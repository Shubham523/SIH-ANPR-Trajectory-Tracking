from fastapi import APIRouter, HTTPException
from typing import List
from app.models.schemas import CameraModel
from app.models.database import get_connection
from app.core.trajectory_matcher import matcher

router = APIRouter(prefix="/cameras", tags=["Cameras"])

@router.get("", response_model=List[CameraModel])
def get_all_cameras():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, lat, lon, status, fps, total_hits, dropped_frames, stream_url FROM cameras")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@router.post("", response_model=CameraModel)
def add_camera(camera: CameraModel):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
        INSERT INTO cameras (id, name, lat, lon, status, fps, total_hits, dropped_frames, stream_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            camera.id, camera.name, camera.lat, camera.lon,
            camera.status, camera.fps, camera.total_hits,
            camera.dropped_frames, camera.stream_url
        ))
        conn.commit()
        matcher.register_camera(camera.id, camera.lat, camera.lon, camera.name)
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Failed to add camera: {str(e)}")
    conn.close()
    return camera

@router.put("/{camera_id}/calibrate", response_model=CameraModel)
def calibrate_camera(camera_id: str, lat: float, lon: float, name: str = None):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM cameras WHERE id = ?", (camera_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Camera not found")
    
    updated_name = name or row["name"]
    cursor.execute("""
    UPDATE cameras SET lat = ?, lon = ?, name = ? WHERE id = ?
    """, (lat, lon, updated_name, camera_id))
    conn.commit()
    
    matcher.register_camera(camera_id, lat, lon, updated_name)
    
    cursor.execute("SELECT * FROM cameras WHERE id = ?", (camera_id,))
    updated_row = cursor.fetchone()
    conn.close()
    return dict(updated_row)
