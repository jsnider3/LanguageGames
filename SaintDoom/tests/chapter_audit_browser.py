"""Render every chapter and check the main performance regressions.

Requires npm ci, Python Playwright, and Chromium. No running server is needed.
    python3 tests/chapter_audit_browser.py --output /tmp/saintdoom-audit

Produces chapter screenshots and metrics.json. Render timings are diagnostic,
not hardware-independent FPS claims. This is not a full campaign playthrough.
"""

import argparse
import json
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument("--output", type=Path, default=Path("/tmp/saintdoom-chapter-audit"))
parser.add_argument(
    "--chapters",
    nargs="+",
    default=[
        "chapel",
        "armory",
        "laboratory",
        "containment",
        "tunnels",
        "spawning",
        "observatory",
        "communications",
        "reactor",
        "finalarena",
        "archive",
        "techfacility",
        "tutorial",
    ],
)
args = parser.parse_args()
args.output.mkdir(parents=True, exist_ok=True)
html = (
    (ROOT / "index.html")
    .read_text()
    .replace(
        "https://unpkg.com/three@0.128.0/build/three.module.js",
        "./node_modules/three/build/three.module.js",
    )
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


views = {
    "chapel": ([0, 1.7, -29], [0, 2, -48]),
    "armory": ([0, 2, -20], [-13, 1, -25]),
    "laboratory": ([0, 1.7, 2], [0, 1.7, -40]),
    "containment": ([0, 2, 15], [0, 2, -15]),
    "tunnels": ([0, 1.7, 0], [0, 1.7, -20]),
    "spawning": ([0, 2, 20], [0, 2, 0]),
    "observatory": ([0, 2, 9], [0, 5, 0]),
    "communications": ([0, 2, 10], [0, 7, 0]),
    "reactor": ([0, 2, 15], [0, 7, 0]),
    "finalarena": ([0, 3, 18], [0, 6, 0]),
    "archive": ([0, 2, 10], [0, 2, -10]),
    "techfacility": ([0, 2, 10], [0, 2, -10]),
}

server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
results = []
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--enable-unsafe-swiftshader"])
        for level in args.chapters:
            page = browser.new_page(viewport={"width": 960, "height": 640})
            errors = []
            page.on("pageerror", lambda e: errors.append(str(e)))
            try:
                page.goto(f"http://127.0.0.1:{server.server_port}/")
                page.evaluate(
                    """async()=>{const {Game}=await import('./modules/Game.js');const init=Game.prototype.init;Game.prototype.init=function(...args){window.testGame=this;return init.apply(this,args);};}"""
                )
                page.click("#levelSelectButton")
                page.click(f'[data-level="{level}"]')
                page.wait_for_function(
                    "window.testGame?.isRunning && testGame.isPaused", timeout=60000
                )
                result = page.evaluate(
                    """view=>{
     const g=testGame;g.isRunning=false; const gl=g.renderer.getContext();
     document.getElementById('pauseMenu').style.display='none';
     if(view){g.camera.position.set(...view[0]);g.camera.lookAt(...view[1]);}
     let compiled=0;const original=gl.compileShader.bind(gl);
     gl.compileShader=(...a)=>{compiled++;return original(...a);};
     window.measure=()=>{
      const start=performance.now();g.renderer.render(g.scene,g.camera);gl.finish();
      const renderMs=performance.now()-start;
      let points=0;g.scene.traverseVisible(o=>{if(o.isPointLight)points++;});
      return {renderMs,points,compiled,draws:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles};
     };
     measure();const samples=[];for(let i=0;i<15;i++)samples.push(measure().renderMs);
     const metrics=measure();metrics.renderMs=samples.sort((a,b)=>a-b)[7];
     return metrics;
    }""",
                    views.get(level),
                )
                page.screenshot(path=str(args.output / f"{level}.png"))
                if level == "archive":
                    counts = page.evaluate(
                        """()=>{const shelves=[];testGame.scene.traverse(o=>{if(o.name==='archive-books')shelves.push(o.count);});return shelves;}"""
                    )
                    assert len(counts) == 16 and sum(counts) == 2160, counts
                    assert result["draws"] < 250, result
                if level == "laboratory":
                    for color in ["blue", "yellow", "red"]:
                        event = page.evaluate(
                            """color=>{const l=testGame.currentLevelInstance;const p=l.pickups.find(p=>p.userData.color===color);l.checkKeycardCollection(p.position);return {...measure(),owned:l.keycards[color],portal:!!l.exitPortal};}""",
                            color,
                        )
                        assert event["points"] == result["points"], event
                        assert event["compiled"] == result["compiled"], event
                        assert event["owned"] and event["portal"] == (
                            color == "red"
                        ), event
                    # Warm the projectile material once, then check repeated fire and despawn.
                    page.evaluate(
                        """async()=>{
      const {Imp}=await import('./enemies/imp.js');const T=await import('three');
      window.probeImp=new Imp(testGame.scene,new T.Vector3(0,1,-15));
      probeImp.target=testGame.player;probeImp.createFireball();measure();probeImp.removeProjectile(0);
      window.launcher=testGame.weaponSystem.weapons.crucifix;
      testGame.player.ammo.rockets=20;launcher.fireCooldown=0;launcher.fire([]);measure();launcher.update(4,[]);measure();
     }"""
                    )
                    baseline = page.evaluate("measure()")
                    for _ in range(4):
                        events = page.evaluate(
                            """()=>{
       launcher.fireCooldown=0;launcher.fire([]);probeImp.createFireball();const fired=measure();
       launcher.update(4,[]);probeImp.removeProjectile(0);return [fired,measure()];
      }"""
                        )
                        for event in events:
                            assert event["points"] == baseline["points"], event
                            assert event["compiled"] == baseline["compiled"], event
                    event = page.evaluate(
                        """()=>{testGame.spawnEnemy(1,0,-10,'scientist');const enemy=testGame.enemies.pop();const spawned=measure();testGame.cleanupEnemy(enemy);return [spawned,measure()];}"""
                    )
                    for snapshot in event:
                        assert snapshot["points"] == baseline["points"], snapshot
                        assert snapshot["compiled"] == baseline["compiled"], snapshot
                    result["pickup_and_combat_shaders"] = "stable"
                if level == "communications":
                    # Every lightning buffer and material is preallocated at level creation.
                    baseline = page.evaluate(
                        """()=>{const l=testGame.currentLevelInstance;l.lightningStorms.forEach(s=>l.createLightning(s));measure();l.updateLightning(.21);return measure();}"""
                    )
                    for _ in range(6):
                        event = page.evaluate(
                            """()=>{const l=testGame.currentLevelInstance;l.lightningStorms.forEach(s=>l.createLightning(s));const flash=measure();l.updateLightning(.21);return [flash,measure()];}"""
                        )
                        for snapshot in event:
                            assert snapshot["points"] == baseline["points"], snapshot
                            assert (
                                snapshot["compiled"] == baseline["compiled"]
                            ), snapshot
                    result["lightning_shaders"] = "stable"
                # Run the actual exit path, including specialized chapter cleanup.
                page.evaluate("testGame.quitToTitle()")
                page.wait_for_timeout(100)
                assert not errors, errors
                result.update(level=level, errors=errors)
            except Exception as e:
                result = {"level": level, "failed": str(e), "errors": errors}
            results.append(result)
            print(json.dumps(result), flush=True)
            (args.output / "metrics.json").write_text(json.dumps(results, indent=2))
            page.close()
        browser.close()
finally:
    server.shutdown()
    server.server_close()
assert not [r for r in results if "failed" in r], results
print(
    "PASS: selected chapters render and clean up; performance probes passed.",
    flush=True,
)
