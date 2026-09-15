# Wireframe & Layout Specifications

**Project:** City-Wide AI Engine for Multi-Camera ANPR Trajectory Tracking
**Design System:** Utilitarian, Flat, High-Density (per `design.md`)
**Framework:** React + Tailwind CSS

---

## 1. Global Application Layout (App.jsx)

The core shell of the application is rigid. It does not scroll globally; rather, internal panels scroll independently to maintain contextual awareness.

*   **Structure:**
    *   `<AppContainer>`: `h-screen w-screen bg-slate-100 flex flex-col overflow-hidden font-sans text-slate-900`
    *   `<TopNavigation>`: Fixed height, top.
    *   `<Workspace>`: `flex-1 flex overflow-hidden` (Contains Sidebar and Main Content).
    *   `<LeftSidebar>`: Fixed width, left side.
    *   `<MainContentArea>`: `flex-1 relative bg-slate-200 border-l border-slate-400`.

### 1.1. Top Navigation (`<TopBar />`)
*   **Layout:** `h-10 w-full bg-slate-900 text-slate-50 flex items-center justify-between px-4 border-b border-slate-950`
*   **Elements:**
    *   **Left:** Project Title (`font-bold tracking-tight`).
    *   **Right:** Global System Status (e.g., `<span className="bg-emerald-600 px-2 py-0.5 text-xs font-bold border border-emerald-800">SYSTEM ONLINE</span>`), Current Server Time (`font-mono text-xs`).

### 1.2. Left Sidebar (`<Sidebar />`)
*   **Layout:** `w-64 h-full bg-white border-r border-slate-300 flex flex-col`
*   **Elements:**
    *   **Navigation Links:** Stacked `<button>` or `<Link>` elements.
    *   **Style:** `w-full text-left px-4 py-3 border-b border-slate-200 hover:bg-slate-100 transition-none font-semibold text-sm`. Active state receives `bg-slate-800 text-white`.

---

## 2. View: Main Dashboard (`/dashboard`)

**Purpose:** Live situational awareness. Map-centric.

*   **Structure:** `flex h-full w-full`
*   **Left Pane (GIS Map):**
    *   **Layout:** `flex-1 relative`
    *   **Component:** `<MapContainer>` (Leaflet/Mapbox).
    *   **Overlay Element:** Floating camera nodes (square markers, `bg-slate-800 border-white`).
*   **Right Pane (Live ANPR Feed):**
    *   **Layout:** `w-80 h-full bg-white border-l border-slate-400 flex flex-col`
    *   **Header:** `h-10 bg-slate-200 border-b border-slate-300 flex items-center px-3 font-bold text-sm` ("LIVE DETECTIONS").
    *   **Scroll Area:** `flex-1 overflow-y-auto p-2 space-y-2`
    *   **Hit Card Component (`<LiveHitCard />`):**
        *   `border border-slate-300 bg-slate-50 p-2 text-xs flex flex-col gap-1`
        *   Row 1: `flex justify-between font-mono` -> [Timestamp] | [Camera ID]
        *   Row 2: Plate Number -> `bg-yellow-200 border border-yellow-400 font-mono font-bold text-center py-1 mt-1 text-black`
        *   Row 3: Global ID -> `text-slate-500 font-mono text-[10px]`

---

## 3. View: Camera Grid (`/cameras`)

**Purpose:** Monitoring raw RTSP/Video feeds and local tracker performance.

*   **Structure:** `p-4 h-full overflow-y-auto`
*   **Header:** Page title and "Add Camera" action button (`bg-slate-800 text-white px-4 py-1 border border-slate-900`).
*   **Grid Layout:** `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4`
*   **Camera Card Component (`<CameraNode />`):**
    *   `bg-white border border-slate-400 flex flex-col`
    *   **Header:** `bg-slate-100 border-b border-slate-300 p-2 flex justify-between items-center text-sm font-bold`
        *   Includes Status Dot: `w-3 h-3 bg-emerald-500 rounded-none border border-emerald-700`.
    *   **Video Container:** `aspect-video bg-black relative` (Placeholder for WebRTC/HLS stream).
    *   **Footer Stats:** `grid grid-cols-3 gap-px bg-slate-300 border-t border-slate-400 text-center text-xs font-mono`
        *   Stat 1: FPS (e.g., `bg-white py-1`)
        *   Stat 2: Total Hits (`bg-white py-1`)
        *   Stat 3: Dropped Frames (`bg-white py-1 text-red-600`)

---

## 4. View: Trajectory Search (`/search`)

**Purpose:** Historical database querying for specific vehicles.

*   **Structure:** `flex flex-col h-full p-4`
*   **Top Pane (Query Form):**
    *   `bg-white border border-slate-400 p-4 mb-4 flex gap-4 items-end`
    *   **Input 1:** License Plate (`<input className="border border-slate-400 rounded-none p-2 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-slate-800" />`)
    *   **Input 2:** Time Range (Start/End datetimes).
    *   **Action:** Submit Button (`bg-slate-900 text-white font-bold px-6 py-2 border border-slate-950`).
*   **Middle Pane (Results Table):**
    *   `flex-1 overflow-y-auto bg-white border border-slate-400`
    *   **Table Layout:** Standard `<table>`, `w-full text-sm text-left`.
    *   **Headers:** `bg-slate-200 border-b border-slate-400 p-2 font-bold` (Timestamp, Camera, Confidence, Plate, Global ID).
    *   **Rows:** `border-b border-slate-200 hover:bg-yellow-50` (Cells use `font-mono`).
*   **Bottom Pane (Visual Timeline - Optional):**
    *   `h-32 mt-4 bg-white border border-slate-400 p-4 flex items-center`
    *   Horizontal nodes connected by solid 2px lines mapping the chronological path of the selected Global ID.

---

## 5. View: System Health (`/system`)

**Purpose:** DevOps view monitoring pipeline bottlenecks.

*   **Structure:** `p-4 h-full overflow-y-auto`
*   **Grid Layout:** `grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6`
*   **Metric Card Component:**
    *   `bg-white border border-slate-400 p-4`
    *   **Title:** `text-xs text-slate-500 uppercase font-bold tracking-wider`
    *   **Value:** `text-3xl font-mono font-bold mt-1 text-slate-900`
    *   Examples: "Kafka Lag (Msgs)", "GPU VRAM (MB)", "DB Insert Latency (ms)", "Active Tracks".