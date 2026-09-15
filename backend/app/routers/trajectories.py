from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any
import datetime
from app.models.schemas import TrajectoryResponse, TrajectoryPoint, GlobalVehicle
from app.models.database import get_connection
from app.core.trajectory_matcher import matcher

router = APIRouter(prefix="/trajectories", tags=["Trajectories"])

@router.get("/search")
def search_trajectories(
    plate: Optional[str] = Query(None, description="Partial or full license plate number"),
    camera_id: Optional[str] = Query(None, description="Filter by camera ID"),
    vehicle_type: Optional[str] = Query(None, description="Filter by vehicle type"),
    limit: int = 50
) -> List[Dict[str, Any]]:
    """Search tracked vehicle records and historical detections."""
    conn = get_connection()
    cursor = conn.cursor()
    
    query = """
    SELECT g.global_id, g.primary_plate, g.vehicle_type, g.vehicle_color,
           g.first_seen, g.last_seen, g.total_detections, g.latest_camera_id, g.latest_camera_name
    FROM global_vehicles g
    WHERE 1=1
    """
    params = []
    
    if plate:
        clean_plate = plate.replace("-", "").replace(" ", "").upper()
        query += " AND (REPLACE(REPLACE(UPPER(g.primary_plate), '-', ''), ' ', '') LIKE ?)"
        params.append(f"%{clean_plate}%")
        
    if camera_id:
        query += " AND g.latest_camera_id = ?"
        params.append(camera_id)
        
    if vehicle_type:
        query += " AND LOWER(g.vehicle_type) = LOWER(?)"
        params.append(vehicle_type)
        
    query += " ORDER BY g.last_seen DESC LIMIT ?"
    params.append(limit)
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    
    results = []
    for r in rows:
        results.append({
            "global_id": r["global_id"],
            "primary_plate": r["primary_plate"] or "OCCLUDED",
            "vehicle_type": r["vehicle_type"],
            "vehicle_color": r["vehicle_color"],
            "first_seen": r["first_seen"],
            "first_seen_str": datetime.datetime.fromtimestamp(r["first_seen"]).strftime("%Y-%m-%d %H:%M:%S"),
            "last_seen": r["last_seen"],
            "last_seen_str": datetime.datetime.fromtimestamp(r["last_seen"]).strftime("%Y-%m-%d %H:%M:%S"),
            "total_detections": r["total_detections"],
            "latest_camera_id": r["latest_camera_id"],
            "latest_camera_name": r["latest_camera_name"]
        })
        
    conn.close()
    return results

@router.get("/{global_id}")
def get_vehicle_trajectory(global_id: str) -> Dict[str, Any]:
    """Retrieve full chronological trajectory waypoints for a specific Global Vehicle ID."""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Get vehicle info
    cursor.execute("SELECT * FROM global_vehicles WHERE global_id = ?", (global_id,))
    v_row = cursor.fetchone()
    if not v_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Vehicle trajectory not found")
        
    # Get chronological waypoints
    cursor.execute("""
    SELECT id, global_id, camera_id, camera_name, lat, lon, timestamp,
           plate_text, plate_confidence, vehicle_type, vehicle_color,
           match_type, match_score, speed_from_prev_kmh, crop_url
    FROM trajectories
    WHERE global_id = ?
    ORDER BY timestamp ASC
    """, (global_id,))
    wp_rows = cursor.fetchall()
    conn.close()
    
    waypoints = []
    for row in wp_rows:
        ts = row["timestamp"]
        waypoints.append({
            "id": row["id"],
            "global_id": row["global_id"],
            "camera_id": row["camera_id"],
            "camera_name": row["camera_name"],
            "lat": row["lat"],
            "lon": row["lon"],
            "timestamp": ts,
            "iso_time": datetime.datetime.fromtimestamp(ts).strftime("%H:%M:%S"),
            "plate_text": row["plate_text"] or "OCCLUDED",
            "plate_confidence": round(row["plate_confidence"] * 100, 1),
            "vehicle_type": row["vehicle_type"],
            "vehicle_color": row["vehicle_color"],
            "match_type": row["match_type"],
            "match_score": row["match_score"],
            "speed_from_prev_kmh": row["speed_from_prev_kmh"],
            "crop_url": row["crop_url"]
        })
        
    return {
        "global_id": v_row["global_id"],
        "primary_plate": v_row["primary_plate"] or "OCCLUDED",
        "vehicle_type": v_row["vehicle_type"],
        "vehicle_color": v_row["vehicle_color"],
        "first_seen": v_row["first_seen"],
        "last_seen": v_row["last_seen"],
        "total_hops": len(waypoints),
        "waypoints": waypoints
    }

@router.get("/live/active")
def get_active_trajectories() -> List[Dict[str, Any]]:
    """Return live active vehicle positions across the city."""
    active_list = []
    now = datetime.datetime.now().timestamp()
    for gid, data in matcher.active_tracks.items():
        active_list.append({
            "global_id": gid,
            "plate": data.get("primary_plate") or "OCCLUDED",
            "vehicle_type": data.get("vehicle_type", "car"),
            "vehicle_color": data.get("vehicle_color", "white"),
            "lat": data["last_lat"],
            "lon": data["last_lon"],
            "last_camera_id": data["last_camera_id"],
            "last_seen": data["last_seen"],
            "seconds_ago": round(now - data["last_seen"], 1)
        })
    return active_list
