import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.models.database import init_db
from app.core.event_bus import event_bus
from app.simulator.traffic_simulator import simulator
from app.routers import cameras, detections, trajectories, system, ws, blacklist

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database tables and default cameras
    init_db()
    # Start high-throughput asynchronous event bus
    await event_bus.start()
    # Start continuous traffic simulator for real-time demonstration
    await simulator.start()
    print("[Backend] City-Wide AI ANPR Engine initialized successfully.")
    yield
    # Shutdown
    await simulator.stop()
    await event_bus.stop()
    print("[Backend] Engine stopped cleanly.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Scalable Trajectory Tracking Engine (SIH Problem Statement 26127)",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))

# Mount API Routers
app.include_router(cameras.router, prefix=settings.API_V1_STR)
app.include_router(detections.router, prefix=settings.API_V1_STR)
app.include_router(trajectories.router, prefix=settings.API_V1_STR)
app.include_router(blacklist.router, prefix=settings.API_V1_STR)
app.include_router(system.router, prefix=settings.API_V1_STR)
app.include_router(ws.router)


# Mount Production Static Files & SPA Fallback
if os.path.exists(FRONTEND_DIST):
    assets_dir = os.path.join(FRONTEND_DIST, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/favicon.svg")
    def get_favicon():
        fav_path = os.path.join(FRONTEND_DIST, "favicon.svg")
        if os.path.exists(fav_path):
            return FileResponse(fav_path)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))

    @app.get("/{full_path:path}")
    def serve_frontend_spa(full_path: str):
        # Exclude backend docs and API endpoints
        if full_path.startswith("api") or full_path.startswith("docs") or full_path == "openapi.json":
            return None
        file_path = os.path.join(FRONTEND_DIST, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
else:
    @app.get("/")
    def root():
        return {
            "status": "ONLINE",
            "project": settings.PROJECT_NAME,
            "sih_statement": settings.PROJECT_CODE,
            "docs_url": "/docs"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
