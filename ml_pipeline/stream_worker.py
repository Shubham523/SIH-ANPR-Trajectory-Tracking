import cv2
import time
import requests
import json
import argparse
from detector import VehicleDetector
from tracker import LocalTracker
from anpr_engine import ANPREngine
from reid_engine import VehicleReIDEngine

def run_camera_worker(camera_id: str, source: str, backend_url: str = "http://localhost:8000/api/detections/ingest"):
    print(f"[Worker-{camera_id}] Starting ingestion from: {source}")
    cap = cv2.VideoCapture(int(source) if source.isdigit() else source)
    
    detector = VehicleDetector(use_gpu=True)
    tracker = LocalTracker()
    anpr = ANPREngine()
    reid = VehicleReIDEngine(use_gpu=True)

    frame_count = 0
    fps_timer = time.time()
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            # Loop video file for continuous testing
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            continue
            
        frame_count += 1
        # Process every 2nd frame to maximize throughput and keep within < 200ms latency
        if frame_count % 2 != 0:
            continue
            
        # 1. Detect vehicles
        raw_dets = detector.detect(frame)
        
        # 2. Track vehicles locally
        active_tracks = tracker.update(raw_dets)
        
        # 3. Extract features for each tracked vehicle
        for trk in active_tracks:
            bbox = trk["bbox"]
            x1, y1, x2, y2 = max(0, bbox[0]), max(0, bbox[1]), min(frame.shape[1], bbox[2]), min(frame.shape[0], bbox[3])
            crop = frame[y1:y2, x1:x2]
            
            if crop.size == 0:
                continue
                
            plate_text, plate_conf, _ = anpr.extract_plate(crop)
            reid_vec = reid.extract_embedding(crop)
            
            payload = {
                "camera_id": camera_id,
                "timestamp": time.time(),
                "local_track_id": trk["local_track_id"],
                "vehicle_type": trk.get("vehicle_type", "car"),
                "plate_text": plate_text,
                "plate_confidence": plate_conf,
                "bbox": bbox,
                "reid_embedding": reid_vec
            }
            
            try:
                requests.post(backend_url, json=payload, timeout=0.2)
            except Exception:
                pass

        if frame_count % 60 == 0:
            elapsed = time.time() - fps_timer
            print(f"[Worker-{camera_id}] Processed {frame_count} frames (~{round(60/elapsed, 1)} FPS)")
            fps_timer = time.time()

    cap.release()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--camera", type=str, default="CAM-N-01")
    parser.add_argument("--source", type=str, default="0")
    parser.add_argument("--backend", type=str, default="http://localhost:8000/api/detections/ingest")
    args = parser.parse_args()
    run_camera_worker(args.camera, args.source, args.backend)
