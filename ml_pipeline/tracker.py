from typing import List, Dict, Any
import numpy as np

def calculate_iou(boxA, boxB):
    xA = max(boxA[0], boxB[0])
    yA = max(boxA[1], boxB[1])
    xB = min(boxA[2], boxB[2])
    yB = min(boxA[3], boxB[3])

    interArea = max(0, xB - xA) * max(0, yB - yA)
    boxAArea = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1])
    boxBArea = (boxB[2] - boxB[0]) * (boxB[3] - boxB[1])

    iou = interArea / float(boxAArea + boxBArea - interArea + 1e-6)
    return iou

class LocalTracker:
    """
    ByteTrack / IoU local multi-object tracker.
    Maintains vehicle IDs within a single camera's field of view.
    """
    def __init__(self, iou_threshold: float = 0.35, max_lost_frames: int = 15):
        self.iou_threshold = iou_threshold
        self.max_lost_frames = max_lost_frames
        self.tracks = {}  # track_id -> {"bbox", "lost_count", "vehicle_type", "hits"}
        self.next_track_id = 1

    def update(self, detections: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Match incoming detections to existing tracks.
        Returns active tracks with assigned local_track_id.
        """
        updated_tracks = []
        unmatched_dets = list(range(len(detections)))
        matched_tracks = set()

        if self.tracks and detections:
            track_ids = list(self.tracks.keys())
            for t_id in track_ids:
                best_iou = 0.0
                best_det_idx = -1
                for d_idx in unmatched_dets:
                    iou = calculate_iou(self.tracks[t_id]["bbox"], detections[d_idx]["bbox"])
                    if iou > best_iou:
                        best_iou = iou
                        best_det_idx = d_idx

                if best_iou >= self.iou_threshold:
                    matched_tracks.add(t_id)
                    unmatched_dets.remove(best_det_idx)
                    det = detections[best_det_idx]
                    self.tracks[t_id]["bbox"] = det["bbox"]
                    self.tracks[t_id]["lost_count"] = 0
                    self.tracks[t_id]["hits"] += 1
                    updated_tracks.append({
                        "local_track_id": t_id,
                        "bbox": det["bbox"],
                        "vehicle_type": det.get("vehicle_type", "car"),
                        "confidence": det.get("confidence", 0.9)
                    })

        # Add new tracks for unmatched detections
        for d_idx in unmatched_dets:
            det = detections[d_idx]
            new_id = self.next_track_id
            self.next_track_id += 1
            self.tracks[new_id] = {
                "bbox": det["bbox"],
                "lost_count": 0,
                "vehicle_type": det.get("vehicle_type", "car"),
                "hits": 1
            }
            updated_tracks.append({
                "local_track_id": new_id,
                "bbox": det["bbox"],
                "vehicle_type": det.get("vehicle_type", "car"),
                "confidence": det.get("confidence", 0.9)
            })

        # Increment lost count for unmatched existing tracks
        lost_ids = [t_id for t_id in self.tracks if t_id not in matched_tracks and t_id not in [ut["local_track_id"] for ut in updated_tracks]]
        for t_id in lost_ids:
            self.tracks[t_id]["lost_count"] += 1
            if self.tracks[t_id]["lost_count"] > self.max_lost_frames:
                del self.tracks[t_id]

        return updated_tracks
