# City-Wide AI Engine for Multi-Camera ANPR Trajectory Tracking
**Smart India Hackathon (SIH) Problem Statement 26127**

An intelligent, scalable AI engine capable of tracking vehicles across non-overlapping city CCTV cameras by fusing **Automatic Number Plate Recognition (ANPR)** and **Visual Vehicle Re-Identification (Re-ID)** into unified Global Trajectories.

---

## Architecture & System Highlights

- **Edge ML Pipeline (`/ml_pipeline`)**:
  - Vehicle Detection via **YOLOv8n** with **FP16 Mixed Precision** (tailored for local NVIDIA RTX 3050 6GB VRAM constraint).
  - Multi-object local tracking via **ByteTrack / IoU tracker**.
  - License plate OCR extraction and **512-dimensional visual Re-ID embeddings**.
- **Central Brain Engine (`/backend`)**:
  - Asynchronous **FastAPI** high-throughput backend.
  - **Fused Trajectory Matching Engine**: Combines normalized Levenshtein plate text distance with 512-dim visual Cosine similarity.
  - **Spatiotemporal Feasibility Verification**: Discards impossible cross-camera velocity jumps ($v > 140\text{ km/h}$) to eliminate false positives.
  - **Real-Time WebSockets (`/ws/live-feed`)**: Instant live hits and trajectory pushes to connected operator consoles.
  - **Time-Series Data Layer**: SQLite WAL mode out-of-the-box with seamless PostgreSQL + TimescaleDB + PostGIS container support.
- **Utilitarian Dashboard (`/frontend`)**:
  - Built with **React + Vite + Tailwind CSS** following strict brutalist operational guidelines from `ui_ux_design_system.md`.
  - Zero gradients, zero glassmorphism, 1px solid borders, sharp corners, and monospace typography for all tokens.
  - **Interactive GIS Map (Leaflet)** with square camera nodes, moving vehicles, and trajectory polylines.
  - **Live ANPR Stream**: Real-time incoming hits sidebar with plate tags and global IDs.
  - **Camera Grid Monitor**: Raw stream view with live tracking bounding boxes and FPS telemetry.
  - **Trajectory Search**: Search by plate (exact/partial), filter by vehicle class, and inspect the chronological Waypoint Timeline.
  - **DevOps System Health**: Monitor NVIDIA RTX 3050 GPU VRAM, queue backpressure, DB latency, and live audit stream.

---

## Quick Start & Deployment
### 1. Unified Production Deployment (Recommended)
Double click [deploy_production.bat](file:///c:/Users/ss479/Desktop/SIH/deploy_production.bat) or run:
```cmd
deploy_production.bat
```
This builds the production React application and serves everything (React Dashboard, REST APIs, WebSockets, static assets) unified on **Port 8000**:
- **Production Dashboard**: `http://localhost:8000`
- **Network (LAN) Dashboard**: `http://<YOUR_LAN_IP>:8000` (accessible from tablets, phones, other PCs)
- **API Documentation**: `http://localhost:8000/docs`

### 2. Development Mode (Hot-Reload)
```cmd
run_all.bat
```
Runs the Vite dev server on port 5173 with HMR and FastAPI backend on port 8000.

---

## SIH Demo Walkthrough

1. **Live Situational Awareness (`/dashboard`)**:
   - Observe real-time traffic moving across the Delhi camera network (`CAM-N-01` to `CAM-N-04`).
   - Watch the right sidebar update with incoming `<LiveHitCard />` ANPR events in real-time via WebSocket.
   - Click any hit card to automatically plot the vehicle's trajectory on the GIS map.
2. **Camera Grid Monitoring (`/cameras`)**:
   - Inspect individual camera nodes with live tracking bounding boxes, FPS, and hit counts.
   - Click **Add Camera Node** to calibrate a new geospatial camera node.
3. **Suspect Vehicle Search (`/search`)**:
   - Enter plate `HR-26-DK-9921` (or click one of the quick presets).
   - Inspect the results table and the chronological **Waypoint Timeline** displaying hops across cameras with transit speeds.
   - Click **Plot on GIS Map** to jump to the map view with the complete route mapped.
4. **Occluded Plate Re-ID Fallback (FR-04)**:
   - Notice vehicles with blurred/occluded plates (`REID_FALLBACK`). The system matches their global ID using 512-dim visual embeddings even when plate text is unavailable.
5. **DevOps & Resource Telemetry (`/system`)**:
   - Inspect live NVIDIA GeForce RTX 3050 VRAM usage ($< 600\text{ MB}$), message queue lag, and millisecond database latency.
