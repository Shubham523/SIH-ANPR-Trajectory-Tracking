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
    
    # Pre-configured City Camera Nodes & Physical Areas (Delhi NCR Grid for Trial Prototype)
    DEFAULT_CAMERAS: list = [
        {
            "id": "CAM-DEL-01",
            "name": "CP Radial Road 1",
            "area": "Connaught Place",
            "lat": 28.6315,
            "lon": 77.2197,
            "speed_limit": 50,
            "status": "online",
            "fps": 29.5,
            "total_hits": 142,
            "dropped_frames": 0,
            "stream_url": "sim://cam-del-01"
        },
        {
            "id": "CAM-DEL-02",
            "name": "CP Outer Circle Gate 4",
            "area": "Connaught Place",
            "lat": 28.6335,
            "lon": 77.2165,
            "speed_limit": 50,
            "status": "online",
            "fps": 30.0,
            "total_hits": 198,
            "dropped_frames": 0,
            "stream_url": "sim://cam-del-02"
        },
        {
            "id": "CAM-DEL-03",
            "name": "India Gate Circle North",
            "area": "Central Vista & India Gate",
            "lat": 28.6135,
            "lon": 77.2295,
            "speed_limit": 40,
            "status": "online",
            "fps": 28.8,
            "total_hits": 210,
            "dropped_frames": 0,
            "stream_url": "sim://cam-del-03"
        },
        {
            "id": "CAM-DEL-04",
            "name": "Kartavya Path Crossing",
            "area": "Central Vista & India Gate",
            "lat": 28.6145,
            "lon": 77.2210,
            "speed_limit": 40,
            "status": "online",
            "fps": 29.2,
            "total_hits": 175,
            "dropped_frames": 0,
            "stream_url": "sim://cam-del-04"
        },
        {
            "id": "CAM-DEL-05",
            "name": "Aerocity Expressway Toll",
            "area": "Aerocity & Airport Corridor",
            "lat": 28.5520,
            "lon": 77.1210,
            "speed_limit": 80,
            "status": "online",
            "fps": 30.0,
            "total_hits": 340,
            "dropped_frames": 0,
            "stream_url": "sim://cam-del-05"
        },
        {
            "id": "CAM-DEL-06",
            "name": "IGI T3 Arrival Arterial",
            "area": "Aerocity & Airport Corridor",
            "lat": 28.5585,
            "lon": 77.0920,
            "speed_limit": 80,
            "status": "online",
            "fps": 29.0,
            "total_hits": 289,
            "dropped_frames": 0,
            "stream_url": "sim://cam-del-06"
        },
        {
            "id": "CAM-DEL-07",
            "name": "South Ext Ring Road",
            "area": "South Extension & AIIMS",
            "lat": 28.5695,
            "lon": 77.2205,
            "speed_limit": 60,
            "status": "online",
            "fps": 29.4,
            "total_hits": 160,
            "dropped_frames": 0,
            "stream_url": "sim://cam-del-07"
        },
        {
            "id": "CAM-DEL-08",
            "name": "AIIMS Flyover Interchange",
            "area": "South Extension & AIIMS",
            "lat": 28.5670,
            "lon": 77.2100,
            "speed_limit": 60,
            "status": "online",
            "fps": 28.9,
            "total_hits": 204,
            "dropped_frames": 0,
            "stream_url": "sim://cam-del-08"
        },
        {
            "id": "CAM-DEL-09",
            "name": "Dhaula Kuan Underpass",
            "area": "Dhaula Kuan Interchange",
            "lat": 28.5925,
            "lon": 77.1615,
            "speed_limit": 70,
            "status": "online",
            "fps": 29.8,
            "total_hits": 312,
            "dropped_frames": 0,
            "stream_url": "sim://cam-del-09"
        },
        {
            "id": "CAM-DEL-10",
            "name": "Cyber Hub Link Flyover",
            "area": "Cyber City Expressway",
            "lat": 28.4950,
            "lon": 77.0890,
            "speed_limit": 90,
            "status": "online",
            "fps": 30.0,
            "total_hits": 420,
            "dropped_frames": 0,
            "stream_url": "sim://cam-del-10"
        }
    ]

    # Area metadata and polygon bounds for map rendering
    AREAS: list = [
        {
            "name": "Connaught Place",
            "center": [28.6325, 77.2180],
            "speed_limit": 50,
            "color": "#3b82f6",
            "polygon": [
                [28.6360, 77.2140],
                [28.6360, 77.2220],
                [28.6290, 77.2220],
                [28.6290, 77.2140]
            ]
        },
        {
            "name": "Central Vista & India Gate",
            "center": [28.6140, 77.2250],
            "speed_limit": 40,
            "color": "#8b5cf6",
            "polygon": [
                [28.6180, 77.2180],
                [28.6180, 77.2320],
                [28.6090, 77.2320],
                [28.6090, 77.2180]
            ]
        },
        {
            "name": "Aerocity & Airport Corridor",
            "center": [28.5550, 77.1060],
            "speed_limit": 80,
            "color": "#10b981",
            "polygon": [
                [28.5650, 77.0850],
                [28.5650, 77.1270],
                [28.5450, 77.1270],
                [28.5450, 77.0850]
            ]
        },
        {
            "name": "South Extension & AIIMS",
            "center": [28.5680, 77.2150],
            "speed_limit": 60,
            "color": "#f59e0b",
            "polygon": [
                [28.5740, 77.2050],
                [28.5740, 77.2250],
                [28.5620, 77.2250],
                [28.5620, 77.2050]
            ]
        },
        {
            "name": "Dhaula Kuan Interchange",
            "center": [28.5925, 77.1615],
            "speed_limit": 70,
            "color": "#ec4899",
            "polygon": [
                [28.5980, 77.1530],
                [28.5980, 77.1700],
                [28.5870, 77.1700],
                [28.5870, 77.1530]
            ]
        },
        {
            "name": "Cyber City Expressway",
            "center": [28.4950, 77.0890],
            "speed_limit": 90,
            "color": "#06b6d4",
            "polygon": [
                [28.5020, 77.0800],
                [28.5020, 77.0980],
                [28.4880, 77.0980],
                [28.4880, 77.0800]
            ]
        }
    ]

settings = Settings()

