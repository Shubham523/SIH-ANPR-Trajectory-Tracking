# Product Requirements Document (PRD)

**Project Name:** City-Wide AI Engine for Multi-Camera ANPR Trajectory Tracking
**SIH Problem Statement:** 26127
**Document Version:** 1.0

## 1. Project Overview
The objective of this project is to build an intelligent, scalable AI engine capable of tracking vehicles across a city's network of CCTV cameras. Unlike single-camera tracking, this system must maintain a vehicle's unique identity as it moves between non-overlapping camera fields of view, utilizing a combination of Automatic Number Plate Recognition (ANPR) and visual vehicle characteristics (Re-Identification).

## 2. Goals & Objectives
*   **Real-time Tracking:** Process multiple RTSP camera streams with minimal latency to provide live vehicle locations.
*   **Robust Identification:** Achieve high accuracy in assigning global IDs by fusing ANPR text with visual features (color, make, model) to handle occlusions or blurry plates.
*   **Spatial Mapping:** Visualize the paths (trajectories) of vehicles on an interactive city map.
*   **Scalability:** Design a distributed architecture that can seamlessly scale as more cameras are added to the network.

## 3. Target Audience (End Users)
*   **Law Enforcement Agencies:** To track suspect vehicles in real-time or historically.
*   **Traffic Management Authorities:** To analyze traffic flow, detect congestion, and optimize signal timings.
*   **Urban Planners:** To understand vehicle mobility patterns across the city.

## 4. Feature Requirements

### 4.1. Core AI Engine Requirements
*   **FR-01: Multi-Stream Ingestion:** The system must accept standard IP camera feeds (RTSP/RTMP) and video files (MP4/AVI).
*   **FR-02: Vehicle Detection & Local Tracking:** Detect vehicles (cars, trucks, buses, two-wheelers) and assign a local tracking ID within a single camera view.
*   **FR-03: License Plate Recognition (ANPR):** Crop the license plate region and extract the alphanumeric text.
*   **FR-04: Vehicle Re-Identification (Re-ID):** Extract visual embeddings (color, shape) for every detected vehicle.
*   **FR-05: Global Trajectory Matching:** Cross-reference local IDs, ANPR text, and visual embeddings across all cameras to assign a unified Global Vehicle ID.

### 4.2. Dashboard & User Interface
*   **FR-06: Live Map View:** Display active cameras and live vehicle locations/trajectories on a GIS map (e.g., Mapbox, Leaflet).
*   **FR-07: Vehicle Search:** Allow operators to search for a vehicle trajectory using partial/full license plate numbers or visual filters (e.g., "Red Sedan").
*   **FR-08: Camera Management:** Interface to add, calibrate (set geospatial coordinates), and remove camera nodes.

### 4.3. Non-Functional Requirements
*   **NFR-01: Latency:** The end-to-end pipeline (frame ingestion to database update) should ideally occur within < 200ms per frame.
*   **NFR-02: Accuracy:** Maintain a Multi-Object Tracking Accuracy (MOTA) of >85% and ANPR accuracy of >90% under standard lighting conditions.
*   **NFR-03: Edge/Cloud Hybrid:** The system should support running AI inference at the edge (near the camera) while centralizing the trajectory matching in the cloud/central server.

## 5. User Flows

### Flow 1: Searching for a Suspect Vehicle
1.  Operator inputs a license plate number into the dashboard search bar.
2.  System queries the database for matches (exact and partial).
3.  Dashboard highlights the chronological path of the vehicle on the city map.
4.  Operator clicks on a specific waypoint to view the captured image/video snippet.

## 6. Success Metrics
*   **System Processing Speed:** Frames Per Second (FPS) processed per camera stream.
*   **Re-ID Match Rate:** Percentage of correctly associated global IDs across two distinct camera feeds.
*   **System Uptime:** Stability of the streaming and processing pipeline over a 24-hour continuous test.