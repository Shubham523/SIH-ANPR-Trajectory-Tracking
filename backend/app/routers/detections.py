from fastapi import APIRouter
from typing import List, Dict, Any
from app.models.schemas import DetectionPayload
from app.core.event_bus import event_bus
from app.models.database import get_connection

router = APIRouter(prefix="/detections", tags=["Detections"])

@router.post("/ingest")
async def ingest_detection(payload: DetectionPayload):
    """Ingest a detection event from edge ML pipeline camera worker."""
    await event_bus.publish(payload.model_dump())
    return {"status": "queued", "camera_id": payload.camera_id, "local_id": payload.local_track_id}

@router.get("/recent")
def get_recent_detections(limit: int = 50) -> List[Dict[str, Any]]:
    """Fetch the most recent detection hits from the database."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT id, global_id, camera_id, camera_name, area_name, lat, lon, timestamp,
           plate_text, plate_confidence, vehicle_type, vehicle_color,
           match_type, match_score, speed_from_prev_kmh, speed_limit,
           is_speeding, is_blacklisted, blacklist_reason, crop_url
    FROM trajectories
    ORDER BY timestamp DESC
    LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

