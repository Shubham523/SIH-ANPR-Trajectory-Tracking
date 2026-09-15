import os
import sys
import socket
import webbrowser
import threading
import time
import subprocess

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
    print(f"\n[Launcher] Opening Unified Dashboard at: {url}")
    try:
        webbrowser.open(url)
    except Exception as e:
        print(f"[Launcher] Could not automatically open browser: {e}")

if __name__ == "__main__":
    base_dir = os.path.abspath(os.path.dirname(__file__))
    backend_dir = os.path.join(base_dir, "backend")
    frontend_dir = os.path.join(base_dir, "frontend")

    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)

    print("=" * 70)
    print("  [SYSTEM] UNIFIED SINGLE-PORT ANPR ENGINE LAUNCHER (PORT 8000)")
    print("  Smart India Hackathon (SIH) - Problem Statement 26127")
    print("=" * 70)

    # Step 1: Ensure Frontend Production Build Exists
    dist_dir = os.path.join(frontend_dir, "dist")
    print("[1/2] Building/verifying frontend bundle for single-port deployment...")
    try:
        npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
        res = subprocess.run([npm_cmd, "run", "build"], cwd=frontend_dir, capture_output=True, text=True)
        if res.returncode == 0:
            print("      [OK] Frontend assets compiled to dist/")
        else:
            print(f"      [WARNING] npm build output: {res.stderr[:200]}")
    except Exception as e:
        print(f"      [WARNING] Could not auto-run npm build: {e}")

    lan_ip = get_lan_ip()
    local_url = "http://localhost:8000"
    lan_url = f"http://{lan_ip}:8000"

    print("=" * 70)
    print(f"  * SINGLE PORT WEB DASHBOARD: {local_url}")
    print(f"  * NETWORK (LAN) DASHBOARD:  {lan_url}")
    print(f"  * SWAGGER API DOCS:         {local_url}/docs")
    print(f"  * LIVE WEBSOCKET STREAM:    ws://localhost:8000/ws/live-feed")
    print("=" * 70)
    print("  Serving Frontend Dashboard, Backend REST APIs, and WebSockets on Port 8000.\n")

    # Start browser opener in background thread
    threading.Thread(target=open_browser_delayed, args=(local_url,), daemon=True).start()

    # Run Uvicorn production server on SINGLE PORT 8000
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        log_level="info",
        access_log=True
    )

