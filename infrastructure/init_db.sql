-- Initialize PostGIS and TimescaleDB extensions
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
CREATE EXTENSION IF NOT EXISTS postgis CASCADE;

-- Cameras Table
CREATE TABLE IF NOT EXISTS cameras (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lon DOUBLE PRECISION NOT NULL,
    status VARCHAR(20) DEFAULT 'online',
    fps DOUBLE PRECISION DEFAULT 30.0,
    total_hits BIGINT DEFAULT 0,
    dropped_frames BIGINT DEFAULT 0,
    stream_url TEXT,
    location GEOMETRY(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(lon, lat), 4326)) STORED
);

-- Global Tracked Vehicles
CREATE TABLE IF NOT EXISTS global_vehicles (
    global_id VARCHAR(50) PRIMARY KEY,
    primary_plate VARCHAR(30),
    vehicle_type VARCHAR(30) DEFAULT 'car',
    vehicle_color VARCHAR(30) DEFAULT 'white',
    first_seen TIMESTAMPTZ NOT NULL,
    last_seen TIMESTAMPTZ NOT NULL,
    total_detections INT DEFAULT 1,
    latest_camera_id VARCHAR(50) REFERENCES cameras(id),
    latest_camera_name VARCHAR(100),
    reid_vector_json JSONB
);

-- Trajectories (Time-Series Hypertable)
CREATE TABLE IF NOT EXISTS trajectories (
    time TIMESTAMPTZ NOT NULL,
    global_id VARCHAR(50) NOT NULL,
    camera_id VARCHAR(50) NOT NULL,
    camera_name VARCHAR(100),
    lat DOUBLE PRECISION NOT NULL,
    lon DOUBLE PRECISION NOT NULL,
    plate_text VARCHAR(30),
    plate_confidence REAL DEFAULT 0.0,
    vehicle_type VARCHAR(30),
    vehicle_color VARCHAR(30),
    match_type VARCHAR(30),
    match_score REAL,
    speed_from_prev_kmh REAL,
    crop_url TEXT,
    location GEOMETRY(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(lon, lat), 4326)) STORED
);

-- Convert to TimescaleDB hypertable partitioned by time (7-day chunks)
SELECT create_hypertable('trajectories', 'time', if_not_exists => TRUE, chunk_time_interval => INTERVAL '7 days');

-- Spatial and Time-Series indexing
CREATE INDEX IF NOT EXISTS idx_trajectories_global_time ON trajectories (global_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_trajectories_camera_time ON trajectories (camera_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_trajectories_spatial ON trajectories USING GIST (location);
