# Project Plan: Scalable Trajectory Tracking Engine (SIH 26127)

This document outlines the phased development plan for the Multi-Camera ANPR Trajectory Tracking project. It is specifically tailored for local development on a machine with an NVIDIA RTX 3050 (6GB VRAM) before scaling to a production environment.

## Phase 1: Environment Setup & Infrastructure (Week 1)
**Goal:** Establish a robust, containerized development environment capable of utilizing GPU resources on Windows.

*   **Task 1.1: WSL2 & GPU Integration:**
    *   Install Windows Subsystem for Linux (WSL2) with an Ubuntu distribution.
    *   Install NVIDIA CUDA Toolkit and cuDNN specifically within the WSL environment to enable PyTorch GPU acceleration.
*   **Task 1.2: Containerization (Docker):**
    *   Install Docker Desktop (with WSL2 integration enabled).
    *   Create a `docker-compose.yml` to spin up the infrastructure layer: Apache Kafka (Zookeeper/Kraft), PostgreSQL (with TimescaleDB and PostGIS extensions), and Redis.
*   **Task 1.3: Repository Setup:**
    *   Initialize Git repository with a monorepo structure: `/ml_pipeline`, `/backend`, `/frontend`, and `/infrastructure`.

## Phase 2: ML Pipeline & VRAM Optimization (Weeks 2-3)
**Goal:** Build the inference nodes to detect, track, and extract features while staying strictly within the 6GB VRAM limit.

*   **Task 2.1: Model Selection & Quantization (6GB VRAM Constraint):**
    *   *Constraint Strategy:* A standard YOLO + Re-ID + OCR pipeline can easily exceed 6GB. 
    *   Use **YOLOv8n** or **YOLOv10-N** (Nano versions) for vehicle and plate detection to save memory.
    *   Implement **Mixed Precision (FP16)** in PyTorch to halve the memory footprint of model weights and activations.
    *   Use a lightweight OSNet model for Re-ID.
    *   Ensure `batch_size=1` for stream processing to prevent CUDA Out Of Memory (OOM) errors.
*   **Task 2.2: Detection & Tracking:**
    *   Write a Python script to ingest RTSP/video files using OpenCV.
    *   Run the YOLO Nano model for vehicle detection.
    *   Pass bounding boxes to ByteTrack for local frame-to-frame tracking.
*   **Task 2.3: Feature Extraction (ANPR & Re-ID):**
    *   Crop tracked vehicles. Run the secondary YOLO plate detector.
    *   Pass plate crops to PaddleOCR or LPRNet.
    *   Pass full vehicle crops to OSNet to generate a 512-dimensional feature vector.
*   **Task 2.4: Message Publishing:**
    *   Format outputs (Camera ID, Timestamp, Local ID, Plate, Vector) into lightweight JSON.
    *   Publish to a Kafka topic (e.g., `camera_detections`).

## Phase 3: Backend & Data Processing (Weeks 4-5)
**Goal:** Develop the FastAPI central server to consume Kafka streams and map global trajectories.

*   **Task 3.1: FastAPI Setup & Kafka Consumption:**
    *   Initialize a FastAPI application.
    *   Use `aiokafka` or `confluent-kafka-python` to continuously consume messages from the `camera_detections` topic asynchronously.
*   **Task 3.2: Global ID Matching Logic:**
    *   When a message arrives, query Redis for active vehicle vectors.
    *   Use Cosine Similarity to compare the incoming Re-ID vector against recently seen vectors. 
    *   Fuse this similarity score with ANPR text matching (using Levenshtein distance for fuzzy plate matching).
    *   Assign a new Global ID or append to an existing one.
*   **Task 3.3: Database Insertion:**
    *   Write the finalized matched data (Global ID, Timestamp, Camera Location Coordinates) into TimescaleDB.
*   **Task 3.4: WebSockets for Live Data:**
    *   Create a FastAPI WebSocket endpoint (`/ws/live-feed`) to push matched trajectory updates instantly to connected clients.

## Phase 4: Frontend Development (Weeks 6-7)
**Goal:** Build the React + Tailwind CSS dashboard adhering strictly to the `design.md` utilitarian design system.

*   **Task 4.1: Scaffold React Application:**
    *   Initialize via Vite (`npm create vite@latest frontend --template react`).
    *   Install and configure Tailwind CSS. Disable all shadow/gradient utilities in `tailwind.config.js` to enforce the brutalist style.
*   **Task 4.2: Layout & Core Components:**
    *   Build the dense, flat layout: Top Navbar (bg-slate-900), Fixed Sidebar, and Main Content Grid.
    *   Create reusable UI components (monospaced data tables, flat bordered buttons, solid color status badges).
*   **Task 4.3: Map Integration:**
    *   Integrate `react-leaflet` or Mapbox GL JS.
    *   Plot camera nodes as static markers.
    *   Develop a layer to draw polylines (trajectories) between cameras based on a specific Global ID.
*   **Task 4.4: WebSocket & State Management:**
    *   Connect the React app to the FastAPI WebSocket.
    *   Populate the live-feed sidebar with incoming ANPR hits in real-time.

## Phase 5: Testing, Benchmarking & SIH Preparation (Week 8)
**Goal:** Ensure the system runs smoothly and prepare documentation for the jury.

*   **Task 5.1: Multi-Stream Simulation:**
    *   Test the system locally by feeding 2-4 synchronized pre-recorded videos simultaneously to simulate multiple cameras.
    *   Monitor VRAM usage via `watch -n 1 nvidia-smi` to ensure the 6GB limit holds steady.
*   **Task 5.2: Accuracy & Latency Benchmarks:**
    *   Calculate frames processed per second (FPS).
    *   Verify cross-camera Re-ID accuracy.
*   **Task 5.3: Presentation Polish:**
    *   Finalize a seamless demo flow showcasing the search feature, live map tracking, and the handling of a blurry/occluded license plate using Re-ID fallback.