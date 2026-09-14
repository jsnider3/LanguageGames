#!/usr/bin/env python3
"""Build if necessary, serve Last Light locally, and open the game in a browser."""
from __future__ import annotations

import argparse
import functools
import http.server
from pathlib import Path
import shutil
import subprocess
import sys
import threading
import urllib.request
import webbrowser

ROOT = Path(__file__).resolve().parent


def main() -> None:
    parser = argparse.ArgumentParser(description="Launch Last Light locally.")
    parser.add_argument("--port", type=int, default=5175, help="Local port (default: 5175).")
    parser.add_argument("--no-browser", action="store_true", help="Only start the local server.")
    parser.add_argument("--build", action="store_true", help="Rebuild the game before launching.")
    args = parser.parse_args()
    if not 0 <= args.port <= 65535:
        parser.error("Port must be between 0 and 65535.")

    if args.build or not (ROOT / "dist/index.html").exists():
        npm = shutil.which("npm.cmd" if sys.platform == "win32" else "npm")
        if not npm:
            raise SystemExit("The game needs a first build. Install Node.js 22.12+ or 24+, then run this launcher again.")
        if not (ROOT / "node_modules/vite").is_dir():
            subprocess.run([npm, "ci"], cwd=ROOT, check=True)
        subprocess.run([npm, "run", "build"], cwd=ROOT, check=True)

    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT / "dist"))
    try:
        server = http.server.ThreadingHTTPServer(("127.0.0.1", args.port), handler)
    except OSError:
        if args.port == 0:
            raise
        # Reuse an existing game server to preserve the browser's save origin.
        existing = f"http://127.0.0.1:{args.port}/"
        try:
            with urllib.request.urlopen(existing, timeout=1) as response:
                already_running = b"<title>LAST LIGHT" in response.read(4096)
        except OSError:
            already_running = False
        if already_running:
            print(f"Last Light is already running at {existing}", flush=True)
            if not args.no_browser:
                webbrowser.open(existing)
            return
        server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    server.daemon_threads = True
    url = f"http://127.0.0.1:{server.server_port}/"
    print(f"\nLAST LIGHT — Keep the light on\n\nPlay at {url}\nKeep this window open. Press Ctrl+C to stop.\n", flush=True)
    if not args.no_browser:
        threading.Timer(0.5, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nOutpost disconnected.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
