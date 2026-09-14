"""Check real WebGL shader compilation when armory objects are collected.

Run after npm ci, with Python Playwright and Chromium installed:
    python3 tests/armory_pickup_browser.py [optional-screenshot.png]

Uses a temporary server and browser, local Three.js, and the actual game modules.
Frame timings are diagnostic; shader compilations are the regression assertion.
"""

import json
import re
import sys
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
html = (ROOT / "index.html").read_text()
html = html.replace(
    "https://unpkg.com/three@0.128.0/build/three.module.js",
    "./node_modules/three/build/three.module.js",
)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, *args):
        pass

    def do_GET(self):
        if urlsplit(self.path).path not in ["/", "/index.html"]:
            return super().do_GET()
        body = html.encode()
        self.send_response(200)
        self.send_header("Content-Type", "text/html")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--enable-unsafe-swiftshader"])
        page = browser.new_page(viewport={"width": 960, "height": 640})
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(f"http://127.0.0.1:{server.server_port}/")
        page.evaluate(
            """async () => {
            const {Game} = await import('./modules/Game.js');
            const init = Game.prototype.init;
            Game.prototype.init = function(...args) {
                window.testGame = this;
                return init.apply(this, args);
            };
        }"""
        )
        page.click("#levelSelectButton")
        page.click('[data-level="armory"]')
        page.wait_for_function(
            "window.testGame?.isRunning && testGame.isPaused", timeout=60000
        )
        baseline = page.evaluate(
            """() => {
            const g = testGame;
            // Freeze combat and the camera to isolate pickup work from other changes.
            g.isRunning = false;
            g.camera.position.set(0, 2, -20);
            g.camera.lookAt(-13, 1, -25);
            document.getElementById('pauseMenu').style.display = 'none';
            const gl = g.renderer.getContext();
            window.compilations = {shaders: 0, programs: 0};
            for (const [method, key] of [['compileShader', 'shaders'], ['linkProgram', 'programs']]) {
                const original = gl[method].bind(gl);
                gl[method] = (...args) => {
                    compilations[key]++;
                    return original(...args);
                };
            }
            window.measure = () => {
                const start = performance.now();
                g.renderer.render(g.scene, g.camera);
                gl.finish();
                const renderMs = performance.now() - start;
                let lights = 0;
                g.scene.traverseVisible(o => { if (o.isLight) lights++; });
                return {renderMs, lights, ...compilations};
            };
            measure(); // Warm the materials visible from this camera.
            return measure();
        }"""
        )
        if len(sys.argv) > 1:
            page.screenshot(path=sys.argv[1])

        def assert_stable(before, after):
            assert after["lights"] == before["lights"], (before, after)
            assert after["shaders"] == before["shaders"], (before, after)
            assert after["programs"] == before["programs"], (before, after)

        print("baseline", json.dumps(baseline), flush=True)
        for index in range(5):  # Four racks plus the unlocked central cache.
            result = page.evaluate(
                """() => {
                const level = testGame.armoryLevel;
                const pickup = level.pickups.find(p => !p.userData.collected);
                if (!pickup) throw new Error('Missing armory pickup');
                level.lastCollectionCheck = 0;
                level.checkWeaponCollection(pickup.position);
                const collected = measure();
                level.cleanupRemovedPickups();
                return {
                    type: pickup.userData.type, collected, cleaned: measure(),
                    count: level.weaponsCollected, remaining: level.pickups.length,
                    cacheUnlocked: !!level.cacheUnlocked,
                    exitUnlocked: !level.sealedDoor.userData.locked
                };
            }"""
            )
            print("rack/cache", index + 1, json.dumps(result), flush=True)
            assert result["count"] == index + 1
            assert result["remaining"] == [3, 2, 2, 1, 0][index]
            assert result["cacheUnlocked"] == (index >= 2)
            assert result["exitUnlocked"] == (index >= 3)
            assert_stable(baseline, result["collected"])
            assert_stable(baseline, result["cleaned"])

        for kind in ["health", "shells", "armor"]:
            result = page.evaluate(
                """async type => {
                const {Pickup} = await import('./modules/Pickup.js');
                const T = await import('three');
                const g = testGame;
                const pickup = new Pickup(g.scene, new T.Vector3(-5, 1, -22), type);
                const spawned = measure();
                g.player.health = 50;
                g.player.armor = 0;
                g.player.ammo.shells = 0;
                pickup.collect(g.player, g);
                return {spawned, collected: measure(), health: g.player.health,
                    armor: g.player.armor, shells: g.player.ammo.shells};
            }""",
                kind,
            )
            print(kind, json.dumps(result), flush=True)
            assert result["spawned"]["lights"] == baseline["lights"]
            assert_stable(result["spawned"], result["collected"])
            assert result[kind] == {"health": 75, "shells": 4, "armor": 25}[kind]

        # Verify that the page delivers the new implementations under versioned URLs.
        urls = page.evaluate(
            "performance.getEntriesByType('resource').map(r => r.name)"
        )
        for module in ["armoryLevel.js", "Pickup.js", "PickupGlow.js"]:
            assert any(
                re.search(rf"/{re.escape(module)}\?v=", url) for url in urls
            ), module
        assert not errors, errors
        print(
            "PASS: all armory pickups and supply drops collect without shader rebuilds.",
            flush=True,
        )
        browser.close()
finally:
    server.shutdown()
    server.server_close()
