# Technology Stack: Scalable Trajectory Tracking Engine

**Project:** City-Wide AI Engine for Multi-Camera ANPR Trajectory Tracking
**Focus:** High-throughput data ingestion, time-series storage, and highly decoupled ML processing.

## 1. AI & Machine Learning Pipeline (Inference Nodes)
The ML pipeline is designed to run close to the camera streams (Edge/Fog) to prevent choking the central network with raw video data.

*   **Framework:** **PyTorch**
    *   Industry standard for deploying and fine-tuning custom computer vision models.
*   **Object Detection:** **YOLOv10 / YOLOv8**
    *   Ultra-fast real-time object detection for isolating vehicles in high-resolution frames.
*   **Local Tracking:** **ByteTrack**
    *   Low-latency tracking algorithm to maintain object IDs within a single camera's field of view.
*   **ANPR / OCR Engine:** **PaddleOCR or LPRNet**
    *   Highly accurate text recognition for cropped license plates.
*   **Vehicle Re-Identification (Re-ID):** **OSNet (Omni-Scale Network)**
    *   Extracts deep visual features (color, make, model) into vector embeddings for cross-camera matching when plates are occluded.

## 2. Event Streaming & Message Broker (The Nervous System)
Directly writing ML outputs to a database will cause bottlenecks. We use a message broker to queue and distribute the data flow.

*   **Broker:** **Apache Kafka**
    *   **Why:** Kafka is built for high-throughput, fault-tolerant streaming. As cameras process frames, they publish lightweight JSON payloads (Camera ID, Timestamp, Local ID, Plate Text, Re-ID Vector) to Kafka topics. The backend consumes these messages at its own pace, preventing system crashes during traffic spikes.

## 3. Backend & Application Logic
The central brain that consumes data, matches trajectories, and serves the frontend.

*   **Framework:** **FastAPI (Python)**
    *   **Why:** Fully asynchronous, incredibly fast, and natively supports WebSockets. It handles incoming Kafka streams, runs the global trajectory matching logic, and pushes live updates to the dashboard dashboard seamlessly.

## 4. High-Performance Data Layer
Storing geographic data alongside time-series events requires specialized database solutions.

*   **Primary Database:** **PostgreSQL with TimescaleDB Extension**
    *   **Why:** Vehicle tracking is fundamentally time-series data (Location X at Time Y). TimescaleDB supercharges PostgreSQL for time-series workloads, allowing for rapid ingestion of millions of rows and hyper-fast queries based on time-windows. It also integrates perfectly with PostGIS for spatial queries.
*   **In-Memory Cache & State Management:** **Redis**
    *   **Why:** The backend needs to constantly compare incoming vehicles against recently seen vehicles across the city. Querying the main DB for this every millisecond is too slow. Redis stores the "active" global IDs and their recent vector embeddings in RAM for instant access and matching.

## 5. Frontend & UI
Adhering to the flat, brutalist design system previously established.

*   **Library:** **React.js**
    *   Component-based architecture for building a dynamic dashboard.
*   **Styling:** **Tailwind CSS**
    *   Utility-first framework to enforce the strict, non-gradient, high-density design constraints.
*   **Geospatial Mapping:** **Mapbox GL JS / Leaflet**
    *   For rendering the city map and plotting live trajectory points via WebSocket data.

## 6. Deployment & Containerization
*   **Containerization:** **Docker & Docker Compose**
    *   Ensures the ML environment, Kafka broker, and databases run consistently across development and production.