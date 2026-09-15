import sqlite3
import json
import time
from typing import List, Dict, Any, Optional, Tuple
from app.config import DB_PATH, settings


def get_connection():
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    # Enable Write-Ahead Logging for high-concurrency read/writes
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    return conn

def _ensure_columns(cursor, table_name: str, column_defs: Dict[str, str]):
    cursor.execute(f"PRAGMA table_info({table_name});")
    existing_cols = {row[1] for row in cursor.fetchall()}
    for col_name, col_type in column_defs.items():
        if col_name not in existing_cols:
            cursor.execute(f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_type};")

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # Cameras table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS cameras (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        area TEXT DEFAULT 'Delhi NCR',
        lat REAL NOT NULL,
        lon REAL NOT NULL,
        speed_limit REAL DEFAULT 60.0,
        status TEXT DEFAULT 'online',
        fps REAL DEFAULT 30.0,
        total_hits INTEGER DEFAULT 0,
        dropped_frames INTEGER DEFAULT 0,
        stream_url TEXT
    );
    """)
    _ensure_columns(cursor, "cameras", {
        "area": "TEXT DEFAULT 'Delhi NCR'",
        "speed_limit": "REAL DEFAULT 60.0",
        "status": "TEXT DEFAULT 'online'",
        "fps": "REAL DEFAULT 30.0",
        "total_hits": "INTEGER DEFAULT 0",
        "dropped_frames": "INTEGER DEFAULT 0",
        "stream_url": "TEXT"
    })
    
    # Blacklist / Hotlist table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS blacklist (
        plate_text TEXT PRIMARY KEY,
        reason TEXT NOT NULL,
        threat_level TEXT DEFAULT 'HIGH',
        added_at REAL NOT NULL
    );
    """)

    # Seed default blacklisted plates if empty
    cursor.execute("SELECT COUNT(*) FROM blacklist;")
    if cursor.fetchone()[0] == 0:
        default_blacklist = [
            ("DL-01-AB-1234", "STOLEN SUV - FIR #402 / WANTED IN ARMED ROBBERY", "HIGH"),
            ("KA-03-GH-3456", "SUSPECT VEHICLE - INTER-STATE LAW ENFORCEMENT ALERT", "CRITICAL"),
            ("UP-16-XY-4321", "REPEAT SPEED VIOLATOR / UNPAID TRAFFIC E-CHALLANS", "WARNING")
        ]
        for plate, reason, threat in default_blacklist:
            cursor.execute("""
            INSERT OR IGNORE INTO blacklist (plate_text, reason, threat_level, added_at)
            VALUES (?, ?, ?, ?)
            """, (plate, reason, threat, time.time()))
    
    # Global Vehicles table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS global_vehicles (
        global_id TEXT PRIMARY KEY,
        primary_plate TEXT,
        vehicle_type TEXT DEFAULT 'car',
        vehicle_color TEXT DEFAULT 'white',
        first_seen REAL NOT NULL,
        last_seen REAL NOT NULL,
        total_detections INTEGER DEFAULT 1,
        latest_camera_id TEXT,
        latest_camera_name TEXT,
        latest_area TEXT DEFAULT 'Delhi NCR',
        is_blacklisted INTEGER DEFAULT 0,
        blacklist_reason TEXT,
        is_speeding INTEGER DEFAULT 0,
        top_speed_kmh REAL DEFAULT 0.0,
        reid_vector_json TEXT
    );
    """)
    _ensure_columns(cursor, "global_vehicles", {
        "latest_area": "TEXT DEFAULT 'Delhi NCR'",
        "is_blacklisted": "INTEGER DEFAULT 0",
        "blacklist_reason": "TEXT",
        "is_speeding": "INTEGER DEFAULT 0",
        "top_speed_kmh": "REAL DEFAULT 0.0",
        "reid_vector_json": "TEXT"
    })
    
    # Trajectories (Time-Series Table)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS trajectories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        global_id TEXT NOT NULL,
        camera_id TEXT NOT NULL,
        camera_name TEXT NOT NULL,
        area_name TEXT DEFAULT 'Delhi NCR',
        lat REAL NOT NULL,
        lon REAL NOT NULL,
        timestamp REAL NOT NULL,
        plate_text TEXT,
        plate_confidence REAL DEFAULT 0.0,
        vehicle_type TEXT,
        vehicle_color TEXT,
        match_type TEXT,
        match_score REAL,
        speed_from_prev_kmh REAL,
        speed_limit REAL DEFAULT 60.0,
        is_speeding INTEGER DEFAULT 0,
        is_blacklisted INTEGER DEFAULT 0,
        blacklist_reason TEXT,
        crop_url TEXT,
        FOREIGN KEY (global_id) REFERENCES global_vehicles(global_id),
        FOREIGN KEY (camera_id) REFERENCES cameras(id)
    );
    """)
    _ensure_columns(cursor, "trajectories", {
        "area_name": "TEXT DEFAULT 'Delhi NCR'",
        "speed_from_prev_kmh": "REAL",
        "speed_limit": "REAL DEFAULT 60.0",
        "is_speeding": "INTEGER DEFAULT 0",
        "is_blacklisted": "INTEGER DEFAULT 0",
        "blacklist_reason": "TEXT",
        "crop_url": "TEXT"
    })
    
    # Indices for high-performance spatial & time-window queries
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_trajectories_global_id ON trajectories(global_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_trajectories_timestamp ON trajectories(timestamp);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_trajectories_camera ON trajectories(camera_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_global_plate ON global_vehicles(primary_plate);")
    
    # Clear & re-seed cameras for trial prototype if existing IDs differ
    cursor.execute("DELETE FROM cameras;")
    for cam in settings.DEFAULT_CAMERAS:
        cursor.execute("""
        INSERT INTO cameras (id, name, area, lat, lon, speed_limit, status, fps, total_hits, dropped_frames, stream_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            cam["id"], cam["name"], cam.get("area", "Delhi NCR"), cam["lat"], cam["lon"],
            cam.get("speed_limit", 60.0), cam["status"], cam["fps"], cam["total_hits"],
            cam["dropped_frames"], cam["stream_url"]
        ))
            
    conn.commit()
    conn.close()

def get_blacklist() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT plate_text, reason, threat_level, added_at FROM blacklist ORDER BY added_at DESC;")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def add_to_blacklist(plate_text: str, reason: str, threat_level: str = "HIGH") -> bool:
    clean_plate = plate_text.strip().upper()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT OR REPLACE INTO blacklist (plate_text, reason, threat_level, added_at)
    VALUES (?, ?, ?, ?)
    """, (clean_plate, reason, threat_level, time.time()))
    conn.commit()
    conn.close()
    return True

def remove_from_blacklist(plate_text: str) -> bool:
    clean_plate = plate_text.strip().upper()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM blacklist WHERE plate_text = ?;", (clean_plate,))
    conn.commit()
    conn.close()
    return True

def check_blacklist(plate_text: Optional[str]) -> Tuple[bool, Optional[str], Optional[str]]:
    if not plate_text:
        return False, None, None
    clean_plate = plate_text.replace("-", "").replace(" ", "").upper()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT plate_text, reason, threat_level FROM blacklist;")
    rows = cursor.fetchall()
    conn.close()
    for r in rows:
        target = r["plate_text"].replace("-", "").replace(" ", "").upper()
        if target == clean_plate:
            return True, r["reason"], r["threat_level"]
    return False, None, None

def save_trajectory_point(point_data: Dict[str, Any]) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    
    plate_text = point_data.get("plate_text")
    is_blacklisted, bl_reason, bl_threat = check_blacklist(plate_text)
    
    speed_limit = point_data.get("speed_limit", 60.0)
    raw_speed = point_data.get("speed_from_prev_kmh") or point_data.get("speed_kmh")
    if raw_speed and float(raw_speed) > 1.0:
        speed_kmh = round(float(raw_speed), 1)
    else:
        speed_kmh = round(speed_limit * 0.88, 1)

    is_speeding = 1 if speed_kmh > speed_limit else 0

    area_name = point_data.get("area_name", "Delhi NCR")
    
    # Insert or update global vehicle
    cursor.execute("SELECT total_detections, first_seen, reid_vector_json, top_speed_kmh FROM global_vehicles WHERE global_id = ?", (point_data["global_id"],))
    row = cursor.fetchone()
    
    reid_json = json.dumps(point_data.get("reid_vector", [])) if point_data.get("reid_vector") else None
    
    if row:
        new_total = row["total_detections"] + 1
        current_top_speed = max(row["top_speed_kmh"] or 0.0, speed_kmh)
        cursor.execute("""
        UPDATE global_vehicles
        SET last_seen = ?, total_detections = ?, latest_camera_id = ?, latest_camera_name = ?, latest_area = ?,
            primary_plate = COALESCE(?, primary_plate),
            is_blacklisted = MAX(is_blacklisted, ?),
            blacklist_reason = COALESCE(?, blacklist_reason),
            is_speeding = MAX(is_speeding, ?),
            top_speed_kmh = ?,
            reid_vector_json = COALESCE(?, reid_vector_json)
        WHERE global_id = ?
        """, (
            point_data["timestamp"], new_total, point_data["camera_id"], point_data["camera_name"], area_name,
            plate_text, 1 if is_blacklisted else 0, bl_reason, is_speeding, current_top_speed,
            reid_json, point_data["global_id"]
        ))
    else:
        cursor.execute("""
        INSERT INTO global_vehicles (
            global_id, primary_plate, vehicle_type, vehicle_color, first_seen, last_seen,
            total_detections, latest_camera_id, latest_camera_name, latest_area,
            is_blacklisted, blacklist_reason, is_speeding, top_speed_kmh, reid_vector_json
        ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            point_data["global_id"], plate_text, point_data.get("vehicle_type", "car"),
            point_data.get("vehicle_color", "white"), point_data["timestamp"], point_data["timestamp"],
            point_data["camera_id"], point_data["camera_name"], area_name,
            1 if is_blacklisted else 0, bl_reason, is_speeding, speed_kmh, reid_json
        ))
    
    # Update camera hits
    cursor.execute("UPDATE cameras SET total_hits = total_hits + 1 WHERE id = ?", (point_data["camera_id"],))
    
    # Insert trajectory waypoint
    cursor.execute("""
    INSERT INTO trajectories (
        global_id, camera_id, camera_name, area_name, lat, lon, timestamp,
        plate_text, plate_confidence, vehicle_type, vehicle_color,
        match_type, match_score, speed_from_prev_kmh, speed_limit,
        is_speeding, is_blacklisted, blacklist_reason, crop_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        point_data["global_id"], point_data["camera_id"], point_data["camera_name"], area_name,
        point_data["lat"], point_data["lon"], point_data["timestamp"],
        plate_text, point_data.get("plate_confidence", 0.0),
        point_data.get("vehicle_type", "car"), point_data.get("vehicle_color", "white"),
        point_data.get("match_type", "NEW_TRACK"), point_data.get("match_score", 1.0),
        speed_kmh, speed_limit, is_speeding, 1 if is_blacklisted else 0, bl_reason, point_data.get("crop_url")
    ))
    
    point_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return point_id

