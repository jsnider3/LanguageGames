"""Check scientist facing in the live chapel, including a cached older release.

Run after npm ci, with Python Playwright and Chromium installed:
    python3 tests/scientist_cache_browser.py

A temporary local server emulates the game's HTTP cache headers. It never
changes game files or uses the player's browser profile.
"""

import json
import re
import threading
import time
from email.utils import formatdate
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
state = {"phase": "old", "requests": []}
new_html = (ROOT / "index.html").read_text()
match = re.search(r'<script type="importmap">\s*(.*?)\s*</script>', new_html, re.S)
imports = json.loads(match.group(1))
imports["imports"]["three"] = "./node_modules/three/build/three.module.js"
new_html = new_html[: match.start(1)] + json.dumps(imports) + new_html[match.end(1) :]
old_imports = {
    "imports": {
        key: value
        for key, value in imports["imports"].items()
        if not key.startswith("./")
    }
}
old_html = re.sub(
    r'(<script type="importmap">)\s*.*?\s*(</script>)',
    lambda m: m[1] + json.dumps(old_imports) + m[2],
    new_html,
    flags=re.S,
)
old_html = re.sub(r'(src="\./main.js)\?[^\"]+', r"\1", old_html)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, *args):
        pass

    def do_GET(self):
        path = urlsplit(self.path).path
        if path not in [
            "/",
            "/index.html",
            "/modules/Game.js",
            "/enemies/possessedScientist.js",
        ]:
            return super().do_GET()
        state["requests"].append((state["phase"], self.path))
        if path in ["/", "/index.html"]:
            data = new_html if state["phase"] == "versioned" else old_html
        else:
            data = (ROOT / path.lstrip("/")).read_text()
            if path == "/modules/Game.js":
                data = data.replace(
                    "    constructor() {",
                    "    constructor() {\n        window.testGame = this;",
                    1,
                )
            elif state["phase"] == "old":
                data = data.replace(
                    "this.mesh.rotation.y = Math.atan2(-dx, -dz);",
                    "this.mesh.lookAt(this.target.position);",
                )
        body = data.encode()
        self.send_response(200)
        self.send_header(
            "Content-Type",
            "text/html" if path in ["/", "/index.html"] else "text/javascript",
        )
        self.send_header("Content-Length", str(len(body)))
        # Match the real server: no explicit cache directive on JS, with the old
        # scientist's June modification date giving it a long heuristic lifetime.
        self.send_header(
            "Last-Modified",
            (
                formatdate(time.time() - 90 * 86400, usegmt=True)
                if state["phase"] == "old" and path == "/enemies/possessedScientist.js"
                else formatdate(usegmt=True)
            ),
        )
        if path in ["/", "/index.html"]:
            self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)


server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--enable-unsafe-swiftshader"])
        page = browser.new_page(viewport={"width": 1100, "height": 800})
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        base = f"http://127.0.0.1:{server.server_port}/"

        def check(phase):
            state["phase"] = phase
            if phase == "old":
                page.goto(base)
            else:
                page.reload()
            page.click("#startButton")
            page.wait_for_function(
                "window.testGame?.isRunning && window.testGame.isPaused", timeout=45000
            )
            result = page.evaluate(
                """async () => {
    const T=await import('three'); const g=testGame;
    g.isRunning=false;g.isPaused=false;
    g.player.position.set(0,1.7,-29);g.player.pitch=0;g.player.yaw=0;g.settings.motion=false;
    g.update(1/60);g.update(1/60);g.scene.updateMatrixWorld(true);
    const enemies=g.enemies.filter(e=>e.state==='chasing');
    const facing=enemies.map(e=>e.leftEye.getWorldPosition(new T.Vector3())
      .add(e.rightEye.getWorldPosition(new T.Vector3())).multiplyScalar(.5)
      .sub(e.headMesh.getWorldPosition(new T.Vector3())).setY(0).normalize()
      .dot(g.player.position.clone().sub(e.position).setY(0).normalize()));
    document.getElementById('pauseMenu').style.display='none';
    g.renderer.render(g.scene,g.camera);
    return {facing,urls:performance.getEntriesByType('resource').filter(e=>e.name.includes('possessedScientist')).map(e=>({url:e.name,transfer:e.transferSize}))};
   }"""
            )
            print(phase, json.dumps(result), flush=True)
            return result

        old = check("old")
        assert all(v < -0.99 for v in old["facing"])
        unversioned = check("fixed-source")
        fixed = check("versioned")
        assert len(fixed["facing"]) == 4
        assert all(v > 0.99 for v in fixed["facing"])
        assert all("?v=" in item["url"] for item in fixed["urls"])
        assert any(
            "?v=" in path and "possessedScientist.js" in path
            for phase, path in state["requests"]
            if phase == "versioned"
        )
        print(
            "PASS: the chapel uses the corrected scientist even with an older module cached.",
            flush=True,
        )
        assert not errors, errors
        browser.close()
finally:
    server.shutdown()
    server.server_close()
