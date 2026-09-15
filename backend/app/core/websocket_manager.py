import json
import asyncio
from typing import List, Set, Dict, Any
from fastapi import WebSocket

class ConnectionManager:
    """Manages active WebSocket connections for live feed & map streaming."""
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)

    async def broadcast_json(self, message: Dict[str, Any]):
        if not self.active_connections:
            return
        
        dead_connections = set()
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                dead_connections.add(connection)

        for dead in dead_connections:
            self.active_connections.discard(dead)

ws_manager = ConnectionManager()
