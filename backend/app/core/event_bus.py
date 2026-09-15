import asyncio
import time
import datetime
from typing import Dict, Any, Optional
from app.models.database import save_trajectory_point
from app.core.trajectory_matcher import matcher
from app.core.websocket_manager import ws_manager
from app.config import settings

class EventBus:
    """
    High-throughput asynchronous message broker.
    Decouples camera frame inference from database writes and trajectory matching.
    """
    def __init__(self):
        self.queue: asyncio.Queue = asyncio.Queue(maxsize=10000)
        self.worker_task: Optional[asyncio.Task] = None
        self.total_processed: int = 0
        self.start_time: float = time.time()

    async def start(self):
        if not self.worker_task:
            self.worker_task = asyncio.create_task(self._process_queue())

    async def stop(self):
        if self.worker_task:
            self.worker_task.cancel()
            self.worker_task = None

    async def publish(self, detection_event: Dict[str, Any]):
        """Publish a detection message from a camera node to the queue."""
        try:
            self.queue.put_nowait(detection_event)
        except asyncio.QueueFull:
            # Drop oldest message if queue is congested
            _ = self.queue.get_nowait()
            self.queue.put_nowait(detection_event)

    async def _process_queue(self):
        while True:
            try:
                event = await self.queue.get()
                t0 = time.time()

                # Step 1: Global Trajectory Matching (ANPR + Re-ID Cosine Fusion)
                gid, match_type, match_score, speed_kmh = matcher.match_detection(event)

                cam_info = matcher.camera_coords.get(
                    event["camera_id"], 
                    (28.6300, 77.2180, event["camera_id"])
                )

                now_ts = event.get("timestamp", time.time())
                iso_time = datetime.datetime.fromtimestamp(now_ts).strftime("%H:%M:%S")

                point_record = {
                    "global_id": gid,
                    "camera_id": event["camera_id"],
                    "camera_name": cam_info[2],
                    "lat": cam_info[0],
                    "lon": cam_info[1],
                    "timestamp": now_ts,
                    "plate_text": event.get("plate_text"),
                    "plate_confidence": event.get("plate_confidence", 0.0),
                    "vehicle_type": event.get("vehicle_type", "car"),
                    "vehicle_color": event.get("vehicle_color", "white"),
                    "match_type": match_type,
                    "match_score": match_score,
                    "speed_from_prev_kmh": speed_kmh,
                    "reid_vector": event.get("reid_embedding"),
                    "crop_url": event.get("image_crop_base64")
                }

                # Step 2: Persist to Time-Series Database
                point_id = save_trajectory_point(point_record)
                self.total_processed += 1

                # Step 3: Broadcast live hit to connected WebSocket clients
                ws_payload = {
                    "type": "LIVE_DETECTION",
                    "data": {
                        "id": point_id,
                        "global_id": gid,
                        "camera_id": event["camera_id"],
                        "camera_name": cam_info[2],
                        "lat": cam_info[0],
                        "lon": cam_info[1],
                        "timestamp": now_ts,
                        "time_str": iso_time,
                        "plate_text": event.get("plate_text") or "OCCLUDED",
                        "plate_confidence": round(event.get("plate_confidence", 0.0) * 100, 1),
                        "vehicle_type": event.get("vehicle_type", "car"),
                        "vehicle_color": event.get("vehicle_color", "white"),
                        "match_type": match_type,
                        "match_score": match_score,
                        "speed_kmh": speed_kmh,
                        "latency_ms": round((time.time() - t0) * 1000, 2)
                    }
                }
                await ws_manager.broadcast_json(ws_payload)

                self.queue.task_done()
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Error in EventBus consumer: {e}")
                await asyncio.sleep(0.01)

event_bus = EventBus()
