from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
import datetime

class CameraModel(BaseModel):
    id: str
    name: str
    area: str = "Delhi NCR"
    lat: float
    lon: float
    speed_limit: float = 60.0
    status: str = "online" # online, offline, degraded
    fps: float = 30.0
    total_hits: int = 0
    dropped_frames: int = 0
    stream_url: Optional[str] = None

class DetectionPayload(BaseModel):
    camera_id: str
    timestamp: float = Field(default_factory=lambda: datetime.datetime.now().timestamp())
    local_track_id: int
    vehicle_type: str = "car"  # car, truck, bus, motorcycle, suv
    vehicle_color: str = "white" # white, black, silver, red, blue, etc.
    plate_text: Optional[str] = None
    plate_confidence: float = 0.0
    bbox: Optional[List[int]] = None # [x1, y1, x2, y2]
    reid_embedding: Optional[List[float]] = None # 512-dim vector
    image_crop_base64: Optional[str] = None

class TrajectoryPoint(BaseModel):
    id: int
    global_id: str
    camera_id: str
    camera_name: str
    area_name: str = "Delhi NCR"
    lat: float
    lon: float
    timestamp: float
    iso_time: str
    plate_text: Optional[str] = None
    plate_confidence: float = 0.0
    vehicle_type: str = "car"
    vehicle_color: str = "white"
    match_type: str = "EXACT_PLATE" # EXACT_PLATE, FUZZY_PLATE, REID_FALLBACK, NEW_TRACK
    match_score: float = 1.0
    speed_from_prev_kmh: Optional[float] = None
    speed_limit: float = 60.0
    is_speeding: int = 0
    is_blacklisted: int = 0
    blacklist_reason: Optional[str] = None
    crop_url: Optional[str] = None

class GlobalVehicle(BaseModel):
    global_id: str
    primary_plate: Optional[str]
    vehicle_type: str
    vehicle_color: str
    first_seen: float
    last_seen: float
    total_detections: int
    latest_camera_id: str
    latest_camera_name: str
    latest_area: str = "Delhi NCR"
    is_blacklisted: int = 0
    blacklist_reason: Optional[str] = None
    is_speeding: int = 0
    top_speed_kmh: float = 0.0
    active: bool = True

class TrajectoryResponse(BaseModel):
    global_id: str
    primary_plate: Optional[str]
    vehicle_type: str
    vehicle_color: str
    first_seen: float
    last_seen: float
    total_hops: int
    is_blacklisted: int = 0
    blacklist_reason: Optional[str] = None
    top_speed_kmh: float = 0.0
    waypoints: List[TrajectoryPoint]


class SearchQuery(BaseModel):
    plate_query: Optional[str] = None
    camera_id: Optional[str] = None
    vehicle_type: Optional[str] = None
    vehicle_color: Optional[str] = None
    start_time: Optional[float] = None
    end_time: Optional[float] = None

class SystemMetrics(BaseModel):
    gpu_name: str = "NVIDIA GeForce RTX 3050 Laptop GPU"
    gpu_vram_used_mb: float = 420.0
    gpu_vram_total_mb: float = 6144.0
    gpu_utilization_pct: float = 12.0
    queue_lag_messages: int = 0
    pipeline_fps: float = 117.5
    active_tracks: int = 4
    total_detections: int = 685
    db_latency_ms: float = 1.8
    uptime_seconds: int = 3600
