import os
import sys
import socket
import webbrowser
import threading
import time

def get_lan_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def open_browser_delayed(url, delay=1.5):
    time.sleep(delay)
    print(f"\n[Launcher] Opening Web Dashboard at: {url}")
    try:
        webbrowser.open(url)
    except Exception as e:
        print(f"[Launcher] Could not automatically open browser: {e}")

if __name__ == "__main__":
    # Ensure backend directory is on sys.path
    backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "backend"))
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)

    lan_ip = get_lan_ip()
    local_url = "http://localhost:8000"
    lan_url = f"http://{lan_ip}:8000"

    print("=" * 70)
    print("  [SYSTEM] CITY-WIDE AI ANPR TRAJECTORY TRACKING ENGINE (PRODUCTION)")
    print("  Smart India Hackathon (SIH) - Problem Statement 26127")
    print("=" * 70)
    print(f"  * Local Web Dashboard:      {local_url}")
    print(f"  * Network (LAN) Dashboard:  {lan_url}")
    print(f"  * Swagger API Docs:         {local_url}/docs")
    print(f"  * Live WebSocket Stream:    ws://localhost:8000/ws/live-feed")
    print("=" * 70)
    print("  Press CTRL+C to safely terminate the server.\n")

    # Start browser opener in background thread
    threading.Thread(target=open_browser_delayed, args=(local_url,), daemon=True).start()

    # Run Uvicorn production server
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        log_level="info",
        access_log=True
    )
