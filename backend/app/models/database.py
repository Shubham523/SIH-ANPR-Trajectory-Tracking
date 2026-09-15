import sqlite3
import json
import time
from typing import List, Dict, Any, Optional
from app.config import DB_PATH, settings

def get_connection():
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    # Enable Write-Ahead Logging for high-concurrency read/writes
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # Cameras table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS cameras (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        lat REAL NOT NULL,
        lon REAL NOT NULL,
        status TEXT DEFAULT 'online',
        fps REAL DEFAULT 30.0,
        total_hits INTEGER DEFAULT 0,
        dropped_frames INTEGER DEFAULT 0,
        stream_url TEXT
    );
    """)
    
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
        reid_vector_json TEXT
    );
    """)
    
    # Trajectories (Time-Series Table)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS trajectories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        global_id TEXT NOT NULL,
        camera_id TEXT NOT NULL,
        camera_name TEXT NOT NULL,
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
        crop_url TEXT,
        FOREIGN KEY (global_id) REFERENCES global_vehicles(global_id),
        FOREIGN KEY (camera_id) REFERENCES cameras(id)
    );
    """)
    
    # Indices for high-performance spatial & time-window queries
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_trajectories_global_id ON trajectories(global_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_trajectories_timestamp ON trajectories(timestamp);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_trajectories_camera ON trajectories(camera_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_global_plate ON global_vehicles(primary_plate);")
    
    # Seed default cameras if table is empty
    cursor.execute("SELECT COUNT(*) FROM cameras;")
    count = cursor.fetchone()[0]
    if count == 0:
        for cam in settings.DEFAULT_CAMERAS:
            cursor.execute("""
            INSERT INTO cameras (id, name, lat, lon, status, fps, total_hits, dropped_frames, stream_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                cam["id"], cam["name"], cam["lat"], cam["lon"],
                cam["status"], cam["fps"], cam["total_hits"],
                cam["dropped_frames"], cam["stream_url"]
            ))
            
    conn.commit()
    conn.close()

def save_trajectory_point(point_data: Dict[str, Any]) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    
    # Insert or update global vehicle
    cursor.execute("SELECT total_detections, first_seen, reid_vector_json FROM global_vehicles WHERE global_id = ?", (point_data["global_id"],))
    row = cursor.fetchone()
    
    reid_json = json.dumps(point_data.get("reid_vector", [])) if point_data.get("reid_vector") else None
    
    if row:
        new_total = row["total_detections"] + 1
        cursor.execute("""
        UPDATE global_vehicles
        SET last_seen = ?, total_detections = ?, latest_camera_id = ?, latest_camera_name = ?,
            primary_plate = COALESCE(?, primary_plate),
            reid_vector_json = COALESCE(?, reid_vector_json)
        WHERE global_id = ?
        """, (
            point_data["timestamp"], new_total, point_data["camera_id"], point_data["camera_name"],
            point_data.get("plate_text"), reid_json, point_data["global_id"]
        ))
    else:
        cursor.execute("""
        INSERT INTO global_vehicles (global_id, primary_plate, vehicle_type, vehicle_color, first_seen, last_seen, total_detections, latest_camera_id, latest_camera_name, reid_vector_json)
        VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
        """, (
            point_data["global_id"], point_data.get("plate_text"), point_data.get("vehicle_type", "car"),
            point_data.get("vehicle_color", "white"), point_data["timestamp"], point_data["timestamp"],
            point_data["camera_id"], point_data["camera_name"], reid_json
        ))
    
    # Update camera hits
    cursor.execute("UPDATE cameras SET total_hits = total_hits + 1 WHERE id = ?", (point_data["camera_id"],))
    
    # Insert trajectory waypoint
    cursor.execute("""
    INSERT INTO trajectories (
        global_id, camera_id, camera_name, lat, lon, timestamp,
        plate_text, plate_confidence, vehicle_type, vehicle_color,
        match_type, match_score, speed_from_prev_kmh, crop_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        point_data["global_id"], point_data["camera_id"], point_data["camera_name"],
        point_data["lat"], point_data["lon"], point_data["timestamp"],
        point_data.get("plate_text"), point_data.get("plate_confidence", 0.0),
        point_data.get("vehicle_type", "car"), point_data.get("vehicle_color", "white"),
        point_data.get("match_type", "NEW_TRACK"), point_data.get("match_score", 1.0),
        point_data.get("speed_from_prev_kmh"), point_data.get("crop_url")
    ))
    
    point_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return point_id
