import asyncio
import random
import time
import numpy as np
from typing import Dict, List, Any
from app.core.event_bus import event_bus
from app.config import settings

# Pre-defined simulation fleet with distinct visual signatures & routes across Delhi NCR areas
FLEET = [
    {
        "plate": "HR-26-DK-9921",
        "type": "SUV",
        "color": "silver",
        "speed": 52.0,
        "route": ["CAM-DEL-01", "CAM-DEL-02", "CAM-DEL-09", "CAM-DEL-05"],
        "base_vector_seed": 42
    },
    {
        "plate": "DL-01-AB-1234",
        "type": "SUV",
        "color": "black",
        "speed": 58.0,
        "route": ["CAM-DEL-02", "CAM-DEL-03", "CAM-DEL-04", "CAM-DEL-07"],
        "base_vector_seed": 101
    },
    {
        "plate": "UP-16-XY-4321",
        "type": "Sedan",
        "color": "red",
        "speed": 94.0,
        "route": ["CAM-DEL-05", "CAM-DEL-06", "CAM-DEL-10", "CAM-DEL-09"],
        "base_vector_seed": 202
    },
    {
        "plate": "KA-03-GH-3456",
        "type": "Cab",
        "color": "yellow",
        "speed": 44.0,
        "route": ["CAM-DEL-07", "CAM-DEL-08", "CAM-DEL-01", "CAM-DEL-03"],
        "base_vector_seed": 505
    },
    {
        "plate": "MH-02-CD-5678",
        "type": "Sedan",
        "color": "blue",
        "speed": 76.0,
        "route": ["CAM-DEL-10", "CAM-DEL-09", "CAM-DEL-05", "CAM-DEL-06"],
        "base_vector_seed": 303
    },
    {
        "plate": "DL-08-EF-9012",
        "type": "Bus",
        "color": "red",
        "speed": 38.0,
        "route": ["CAM-DEL-03", "CAM-DEL-04", "CAM-DEL-07", "CAM-DEL-08"],
        "base_vector_seed": 404
    }
]


def generate_reid_vector(seed: int, noise_scale: float = 0.04) -> List[float]:
    """Generate a consistent 512-dimensional normalized Re-ID embedding with slight lighting variance."""
    rng = np.random.RandomState(seed)
    base = rng.randn(512).astype(np.float32)
    # Add subtle real-world camera noise
    noise = np.random.normal(0, noise_scale, 512).astype(np.float32)
    vec = base + noise
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec /= norm
    return vec.tolist()

class TrafficSimulator:
    def __init__(self):
        self.is_running = False
        self.task: asyncio.Task = None
        self.vehicle_states: Dict[str, Dict[str, Any]] = {}
        self.init_fleet()

    def init_fleet(self):
        for v in FLEET:
            self.vehicle_states[v["plate"]] = {
                **v,
                "current_step": 0,
                "local_id": random.randint(10, 999),
                "next_due_time": time.time() + random.uniform(1.0, 5.0)
            }

    async def start(self):
        if not self.is_running:
            self.is_running = True
            self.task = asyncio.create_task(self._run_loop())
            print("[Simulator] Multi-Camera Traffic Simulation started.")

    async def stop(self):
        if self.is_running:
            self.is_running = False
            if self.task:
                self.task.cancel()
                self.task = None
            print("[Simulator] Multi-Camera Traffic Simulation stopped.")

    async def _run_loop(self):
        while self.is_running:
            try:
                now = time.time()
                for plate, v in self.vehicle_states.items():
                    if now >= v["next_due_time"]:
                        route = v["route"]
                        cam_id = route[v["current_step"]]
                        
                        # Simulate occasional occluded plate scenario (demonstrating Re-ID fallback)
                        is_occluded = (random.random() < 0.15)
                        if is_occluded:
                            reported_plate = None
                            plate_conf = 0.0
                        else:
                            reported_plate = plate
                            plate_conf = round(random.uniform(0.91, 0.99), 2)

                        # Generate 512-dim visual embedding
                        reid_vec = generate_reid_vector(v["base_vector_seed"])

                        simulated_speed = round(v.get("speed", 52.0) + random.uniform(-2.5, 2.5), 1)

                        payload = {
                            "camera_id": cam_id,
                            "timestamp": now,
                            "local_track_id": v["local_id"],
                            "vehicle_type": v["type"],
                            "vehicle_color": v["color"],
                            "plate_text": reported_plate,
                            "plate_confidence": plate_conf,
                            "speed_kmh": simulated_speed,
                            "bbox": [random.randint(100, 300), random.randint(200, 400), random.randint(500, 700), random.randint(600, 800)],
                            "reid_embedding": reid_vec
                        }

                        # Publish to Central Brain EventBus
                        await event_bus.publish(payload)

                        # Move to next camera hop along route
                        v["current_step"] = (v["current_step"] + 1) % len(route)
                        # Realistic travel time between city cameras (4-12 seconds in demo time)
                        v["next_due_time"] = now + random.uniform(4.0, 10.0)
                        # New local track ID at new camera view
                        v["local_id"] = random.randint(10, 999)

                await asyncio.sleep(1.0)
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"[Simulator] Error: {e}")
                await asyncio.sleep(1.0)

simulator = TrafficSimulator()
