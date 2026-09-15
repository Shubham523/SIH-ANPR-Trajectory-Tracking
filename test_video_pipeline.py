import os
import sys
import time
import argparse
import json
import cv2
import numpy as np
import requests

# Add ml_pipeline to path so we reuse the existing modular components
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "ml_pipeline")))

try:
    from detector import VehicleDetector
    from tracker import LocalTracker
    from anpr_engine import ANPREngine
    from reid_engine import VehicleReIDEngine
except ImportError as e:
    print(f"[Error] Failed to import from ml_pipeline: {e}")
    sys.exit(1)

def create_sample_traffic_video(output_path="sample_traffic.mp4", duration_sec=10, fps=25):
    """
    Generates a realistic synthetic traffic video with multiple moving vehicles
    and Indian license plates for instant testing if the user has no video file.
    """
    print(f"[Generator] Creating synthetic test traffic video: {output_path} ({duration_sec}s @ {fps}fps)...")
    width, height = 1280, 720
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    vehicles = [
        {"plate": "HR-26-DK-9921", "color": (192, 192, 192), "type": "SUV", "speed": 4, "x": 350, "y": -120, "w": 180, "h": 110},
        {"plate": "DL-01-AB-1234", "color": (230, 230, 230), "type": "Sedan", "speed": 6, "x": 600, "y": -300, "w": 160, "h": 90},
        {"plate": "UP-16-XY-4321", "color": (40, 40, 200), "type": "Hatchback", "speed": 5, "x": 800, "y": -50, "w": 150, "h": 85},
        {"plate": "MH-02-CD-5678", "color": (30, 30, 30), "type": "SUV", "speed": 3, "x": 380, "y": -500, "w": 190, "h": 120}
    ]

    total_frames = duration_sec * fps
    for f in range(total_frames):
        # Dark asphalt road
        frame = np.full((height, width, 3), (35, 35, 40), dtype=np.uint8)

        # Lane markings
        cv2.line(frame, (250, 0), (250, height), (80, 80, 85), 3)
        cv2.line(frame, (1050, 0), (1050, height), (80, 80, 85), 3)
        for y in range((f * 8) % 60, height, 60):
            cv2.line(frame, (500, y), (500, y + 30), (200, 200, 200), 2)
            cv2.line(frame, (750, y), (750, y + 30), (200, 200, 200), 2)

        # Move and render vehicles
        for v in vehicles:
            curr_y = int(v["y"] + (f * v["speed"]))
            if curr_y > height + 150:
                v["y"] = -150 - (f * v["speed"])
                curr_y = -150

            if -120 <= curr_y <= height + 50:
                x, y, w, h = v["x"], curr_y, v["w"], v["h"]
                
                # Vehicle body
                cv2.rectangle(frame, (x, y), (x + w, y + h), v["color"], -1)
                cv2.rectangle(frame, (x, y), (x + w, y + h), (10, 10, 10), 2)

                # Windshield / Roof
                cv2.rectangle(frame, (x + 20, y + 15), (x + w - 20, y + h - 25), (60, 80, 90), -1)

                # Rear License Plate
                plate_w, plate_h = 90, 24
                px = x + (w - plate_w) // 2
                py = y + h - 26
                cv2.rectangle(frame, (px, py), (px + plate_w, py + plate_h), (255, 255, 255), -1)
                cv2.rectangle(frame, (px, py), (px + plate_w, py + plate_h), (0, 0, 0), 1)
                cv2.putText(frame, v["plate"].replace("-", ""), (px + 4, py + 16),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.42, (0, 0, 0), 1, cv2.LINE_AA)

        out.write(frame)

    out.release()
    print(f"[Generator] Synthetic video created successfully: {output_path}")
    return output_path

def run_test_pipeline(source=None, camera_id="CAM-TEST-01", backend_url="http://localhost:8000/api/detections/ingest",
                      publish=True, save_path=None, headless=False):
    """
    Runs vehicle detection (YOLO), local tracking (ByteTrack), license plate recognition,
    and 512-dim visual Re-ID extraction on any video file or live camera stream.
    """
    print("\n" + "=" * 70)
    print("  AI VEHICLE CLASSIFICATION, TRACKING & RE-ID TEST PIPELINE")
    print("  Smart India Hackathon (SIH 26127)")
    print("=" * 70)

    # 1. Resolve video source
    if source is None:
        default_video = "sample_traffic.mp4"
        if not os.path.exists(default_video):
            create_sample_traffic_video(default_video)
        source = default_video
    elif str(source).isdigit():
        source = int(source)

    print(f"  * Video Source:          {source}")
    print(f"  * Camera ID Tag:         {camera_id}")
    print(f"  * Dashboard Publishing:  {'ENABLED (' + backend_url + ')' if publish else 'DISABLED'}")
    print(f"  * Headless Mode:         {headless}")
    print("=" * 70 + "\n")

    # 2. Initialize Video Stream
    cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        print(f"[Error] Could not open video source: {source}")
        return

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 1280
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 720
    video_fps = cap.get(cv2.CAP_PROP_FPS) or 25.0

    # Optional Video Writer for saving annotated output
    writer = None
    if save_path:
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        writer = cv2.VideoWriter(save_path, fourcc, video_fps, (width, height))
        print(f"[Output] Saving annotated video to: {save_path}")

    # 3. Check Dashboard Backend Connectivity
    backend_online = False
    if publish:
        try:
            r = requests.get(backend_url.replace("/ingest", "/recent"), timeout=0.4)
            backend_online = (r.status_code == 200)
            if backend_online:
                print(f"[Network] Connected to Dashboard backend at {backend_url}")
            else:
                print(f"[Network] Backend returned {r.status_code}. Running standalone.")
        except Exception:
            print("[Network] Dashboard backend is currently offline. Running in standalone mode (no publish).")
            backend_online = False

    # 4. Load ML Pipeline Components
    print("[AI Pipeline] Initializing YOLOv8n, ByteTrack, ANPR, and 512-dim Re-ID engine...")
    detector = VehicleDetector(use_gpu=True)
    tracker = LocalTracker(iou_threshold=0.35, max_lost_frames=15)
    anpr = ANPREngine()
    reid = VehicleReIDEngine(use_gpu=True)
    print("[AI Pipeline] All models ready!\n")
    print(">> Press 'q' in the video window to stop, or SPACE to pause/resume.\n")

    frame_idx = 0
    start_time = time.time()
    tracked_vehicles_history = {}
    fps_history = []

    paused = False

    while cap.isOpened():
        if not paused:
            ret, frame = cap.read()
            if not ret:
                print("[Info] End of video stream reached.")
                break

            frame_idx += 1
            t0 = time.time()

            # Step 1: Detect Vehicles using YOLOv8
            raw_detections = detector.detect(frame)

            # Fallback for synthetic/simulated test video frames
            if not raw_detections:
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                mask = cv2.inRange(gray, 60, 255)
                contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                for cnt in contours:
                    area = cv2.contourArea(cnt)
                    if 4000 < area < 30000:
                        bx, by, bw, bh = cv2.boundingRect(cnt)
                        if 1.1 < (bw / float(bh)) < 2.5:
                            raw_detections.append({
                                "bbox": [bx, by, bx + bw, by + bh],
                                "confidence": 0.88,
                                "vehicle_type": "car"
                            })

            # Step 2: Local Multi-Object Tracking (ByteTrack / IoU)
            active_tracks = tracker.update(raw_detections)

            # Step 3: Feature Extraction (Plate OCR + 512-dim Re-ID Embedding)
            for trk in active_tracks:
                track_id = trk["local_track_id"]
                bbox = trk["bbox"]
                x1 = max(0, int(bbox[0]))
                y1 = max(0, int(bbox[1]))
                x2 = min(frame.shape[1], int(bbox[2]))
                y2 = min(frame.shape[0], int(bbox[3]))

                if x2 - x1 < 20 or y2 - y1 < 20:
                    continue

                vehicle_crop = frame[y1:y2, x1:x2]

                # Extract Plate OCR
                plate_text, plate_conf, plate_crop = anpr.extract_plate(vehicle_crop)

                # Extract 512-dim Visual Re-ID Embedding
                reid_vec = reid.extract_embedding(vehicle_crop)

                # Record in vehicle history
                if track_id not in tracked_vehicles_history:
                    tracked_vehicles_history[track_id] = {
                        "type": trk.get("vehicle_type", "car"),
                        "first_seen_frame": frame_idx,
                        "last_seen_frame": frame_idx,
                        "hits": 1,
                        "plates_seen": [] if not plate_text else [plate_text],
                        "reid_norm": round(float(np.linalg.norm(reid_vec)), 4) if reid_vec else 0.0
                    }
                else:
                    hist = tracked_vehicles_history[track_id]
                    hist["last_seen_frame"] = frame_idx
                    hist["hits"] += 1
                    if plate_text and plate_text not in hist["plates_seen"]:
                        hist["plates_seen"].append(plate_text)

                # Step 4: Publish to Dashboard (if backend is online)
                if backend_online and frame_idx % 2 == 0:
                    payload = {
                        "camera_id": camera_id,
                        "timestamp": time.time(),
                        "local_track_id": track_id,
                        "vehicle_type": trk.get("vehicle_type", "car"),
                        "plate_text": plate_text,
                        "plate_confidence": plate_conf,
                        "bbox": [x1, y1, x2, y2],
                        "reid_embedding": reid_vec
                    }
                    try:
                        requests.post(backend_url, json=payload, timeout=0.08)
                    except Exception:
                        pass # Ignore if backend is not currently running

            # Compute scaling factor for high-resolution (4K / 1080p) videos
            scale = max(1.0, width / 1280.0)
            font_scale = 0.45 * scale
            thick = max(1, int(1.5 * scale))

            # Step 5: Draw Rich Annotations on Frame
            for trk in active_tracks:
                track_id = trk["local_track_id"]
                bbox = trk["bbox"]
                x1, y1 = max(0, int(bbox[0])), max(0, int(bbox[1]))
                x2, y2 = min(frame.shape[1], int(bbox[2])), min(frame.shape[0], int(bbox[3]))

                # Vehicle Bounding Box
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 230, 115), max(2, int(2 * scale)))

                # Top tag label: Track ID & Class
                label = f"#{track_id} {trk.get('vehicle_type', 'car').upper()}"
                tag_w = int(140 * scale)
                tag_h = int(24 * scale)
                cv2.rectangle(frame, (x1, max(0, y1 - tag_h)), (x1 + tag_w, max(0, y1)), (15, 23, 42), -1)
                cv2.putText(frame, label, (x1 + int(6 * scale), max(16, y1 - int(6 * scale))),
                            cv2.FONT_HERSHEY_SIMPLEX, font_scale, (255, 255, 255), thick, cv2.LINE_AA)

                # Plate & Re-ID tag
                seen_plates = tracked_vehicles_history.get(track_id, {}).get("plates_seen", [])
                plate_text = seen_plates[0] if len(seen_plates) > 0 else None
                display_plate = plate_text if plate_text else "RE-ID EXTRACTED"
                tag_bg_color = (0, 215, 255) if plate_text else (180, 105, 255)
                plate_tag_w = int(180 * scale)
                cv2.rectangle(frame, (x1, y2), (x1 + plate_tag_w, y2 + tag_h), tag_bg_color, -1)
                cv2.putText(frame, f"[{display_plate}]", (x1 + int(4 * scale), y2 + int(17 * scale)),
                            cv2.FONT_HERSHEY_SIMPLEX, font_scale, (0, 0, 0), thick, cv2.LINE_AA)

            # Compute latency & FPS
            elapsed_frame = max(0.001, time.time() - t0)
            current_fps = 1.0 / elapsed_frame
            fps_history.append(current_fps)
            avg_fps = round(np.mean(fps_history[-30:]), 1)

            # Telemetry HUD on Top-Left
            hud_w, hud_h = int(420 * scale), int(90 * scale)
            cv2.rectangle(frame, (10, 10), (10 + hud_w, 10 + hud_h), (15, 23, 42), -1)
            cv2.rectangle(frame, (10, 10), (10 + hud_w, 10 + hud_h), (100, 116, 139), max(1, int(scale)))
            cv2.putText(frame, f"SIH-26127 CCTV PIPELINE ({width}x{height})", (20, int(32 * scale)),
                        cv2.FONT_HERSHEY_SIMPLEX, font_scale * 1.1, (0, 255, 200), thick, cv2.LINE_AA)
            cv2.putText(frame, f"CAM: {camera_id} | FRAME: {frame_idx}", (20, int(54 * scale)),
                        cv2.FONT_HERSHEY_SIMPLEX, font_scale, (220, 220, 220), thick, cv2.LINE_AA)
            cv2.putText(frame, f"SPEED: {avg_fps} FPS | TRACKED: {len(active_tracks)} VEHICLES", (20, int(76 * scale)),
                        cv2.FONT_HERSHEY_SIMPLEX, font_scale, (50, 255, 50), thick, cv2.LINE_AA)

            if writer:
                writer.write(frame)

        # Display window (scaled to fit screen)
        if not headless:
            display_frame = frame
            if width > 1920 or height > 1080:
                display_frame = cv2.resize(frame, (1280, 720))
            cv2.imshow("Multi-Camera ANPR Video Pipeline Tester (Press 'q' to exit)", display_frame)
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord(' '):
                paused = not paused
                print(f"[State] {'PAUSED' if paused else 'RESUMED'}")

    cap.release()
    if writer:
        writer.release()
    if not headless:
        cv2.destroyAllWindows()

    total_time = max(0.01, time.time() - start_time)
    print("\n" + "=" * 70)
    print("  TEST PIPELINE SUMMARY REPORT")
    print("=" * 70)
    print(f"  * Total Frames Processed:   {frame_idx}")
    print(f"  * Total Duration:           {round(total_time, 2)}s")
    print(f"  * Average Pipeline Speed:   {round(frame_idx / total_time, 1)} FPS")
    print(f"  * Unique Vehicles Tracked:  {len(tracked_vehicles_history)}")
    print("-" * 70)
    print(f"  {'TRACK ID':<10} {'CLASS':<12} {'HITS':<8} {'PLATES SEEN':<24} {'RE-ID VECTOR'}")
    print("-" * 70)
    for tid, info in sorted(tracked_vehicles_history.items()):
        plates_str = ", ".join(info['plates_seen']) if info['plates_seen'] else "Occluded (Re-ID Only)"
        print(f"  #{tid:<9} {info['type']:<12} {info['hits']:<8} {plates_str:<24} 512-dim (norm={info['reid_norm']})")
    print("=" * 70 + "\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test Recorded Video Classification, ANPR and Re-ID Extraction")
    parser.add_argument("--video", type=str, default=None, help="Path to video file, or '0' for webcam, or omit to auto-generate sample traffic video")
    parser.add_argument("--camera", type=str, default="CAM-TEST-01", help="Camera ID to simulate (e.g. CAM-N-01, CAM-TEST-01)")
    parser.add_argument("--backend", type=str, default="http://localhost:8000/api/detections/ingest", help="Backend ingestion endpoint")
    parser.add_argument("--no-publish", action="store_true", help="Run standalone without publishing detections to backend")
    parser.add_argument("--save-output", type=str, default=None, help="Path to save annotated output video (e.g. output.mp4)")
    parser.add_argument("--headless", action="store_true", help="Run without opening GUI window")
    args = parser.parse_args()

    run_test_pipeline(
        source=args.video,
        camera_id=args.camera,
        backend_url=args.backend,
        publish=not args.no_publish,
        save_path=args.save_output,
        headless=args.headless
    )
