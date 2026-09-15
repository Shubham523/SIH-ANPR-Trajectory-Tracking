import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "data" / "trajectories.db"
os.makedirs(BASE_DIR / "data", exist_ok=True)
os.makedirs(BASE_DIR / "data" / "crops", exist_ok=True)

class Settings(BaseModel):
    PROJECT_NAME: str = "City-Wide AI Engine for Multi-Camera ANPR Trajectory Tracking"
    PROJECT_CODE: str = "SIH-26127"
    API_V1_STR: str = "/api"
    
    # Trajectory Matching Engine Thresholds
    REID_COSINE_THRESHOLD: float = 0.72       # Minimum cosine similarity for Re-ID match
    PLATE_LEVENSHTEIN_THRESHOLD: float = 0.70  # Minimum normalized plate text similarity
    EXACT_PLATE_MATCH_CONFIDENCE: float = 0.88 # High confidence threshold for plate dominance
    MAX_VELOCITY_KMH: float = 140.0            # Spatiotemporal sanity velocity ceiling (km/h)
    ACTIVE_TRACK_TTL_SECONDS: int = 1800       # Keep active tracks in cache for 30 minutes
    
    # Pre-configured City Camera Nodes (Delhi Grid for SIH Demo)
    DEFAULT_CAMERAS: list = [
        {
            "id": "CAM-N-01",
            "name": "North Gate Junction",
            "lat": 28.6328,
            "lon": 77.2197,
            "status": "online",
            "fps": 29.5,
            "total_hits": 142,
            "dropped_frames": 0,
            "stream_url": "sim://cam-n-01"
        },
        {
            "id": "CAM-N-02",
            "name": "Central Boulevard",
            "lat": 28.6310,
            "lon": 77.2160,
            "status": "online",
            "fps": 30.0,
            "total_hits": 198,
            "dropped_frames": 0,
            "stream_url": "sim://cam-n-02"
        },
        {
            "id": "CAM-N-03",
            "name": "Metro Station East",
            "lat": 28.6285,
            "lon": 77.2215,
            "status": "online",
            "fps": 28.8,
            "total_hits": 115,
            "dropped_frames": 0,
            "stream_url": "sim://cam-n-03"
        },
        {
            "id": "CAM-N-04",
            "name": "South Avenue Cross",
            "lat": 28.6250,
            "lon": 77.2180,
            "status": "online",
            "fps": 29.2,
            "total_hits": 230,
            "dropped_frames": 0,
            "stream_url": "sim://cam-n-04"
        }
    ]

settings = Settings()
