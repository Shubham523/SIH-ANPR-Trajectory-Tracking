const getDefaultWsUrl = () => {
  if (typeof window === 'undefined') return 'ws://localhost:8000/ws/live-feed';
  if (window.location.origin.includes(':5173')) return 'ws://localhost:8000/ws/live-feed';
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws/live-feed`;
};

export class LiveFeedSocket {
  constructor(url = getDefaultWsUrl()) {
    this.url = url;
    this.ws = null;
    this.listeners = new Set();
    this.reconnectInterval = 3000;
    this.isConnected = false;
    this.pingTimer = null;
  }

  connect() {
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.isConnected = true;
        console.log('[WebSocket] Live Feed Connected');
        this.notifyStatus(true);
        
        // Heartbeat
        this.pingTimer = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send('ping');
          }
        }, 15000);
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.listeners.forEach((listener) => listener(msg));
        } catch (e) {
          // Non-JSON message (e.g., pong)
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        clearInterval(this.pingTimer);
        this.notifyStatus(false);
        console.log('[WebSocket] Disconnected. Retrying in 3s...');
        setTimeout(() => this.connect(), this.reconnectInterval);
      };

      this.ws.onerror = (err) => {
        console.error('[WebSocket] Error:', err);
        this.ws.close();
      };
    } catch (e) {
      setTimeout(() => this.connect(), this.reconnectInterval);
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  statusListeners = new Set();
  onStatusChange(cb) {
    this.statusListeners.add(cb);
    cb(this.isConnected);
    return () => this.statusListeners.delete(cb);
  }

  notifyStatus(status) {
    this.statusListeners.forEach((cb) => cb(status));
  }
}

export const liveSocket = new LiveFeedSocket();
