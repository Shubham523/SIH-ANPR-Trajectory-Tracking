import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.websocket_manager import ws_manager

router = APIRouter(tags=["WebSocket"])

@router.websocket("/ws/live-feed")
async def live_feed_websocket(websocket: WebSocket):
    await ws_manager.connect(websocket)
    # Send initial welcome message
    await websocket.send_json({
        "type": "CONNECTION_ESTABLISHED",
        "message": "Connected to City-Wide ANPR Trajectory Tracking Stream"
    })
    try:
        while True:
            # Keep connection alive, listen for ping/client messages
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)
