#!/usr/bin/env python3
"""Package the existing production build without source or npm dependencies."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parent.parent
if not (root / "dist/index.html").is_file():
    raise SystemExit("Run npm run build before packaging.")

destination = root / "LastLight-Playable.zip"
files = [root / name for name in ("run_game.py", "Play Last Light.bat", "play.sh", "README.md", "THIRD_PARTY.md", "ART_NOTES.md")]
files.extend(path for path in (root / "dist").rglob("*") if path.is_file())
with ZipFile(destination, "w", ZIP_DEFLATED, compresslevel=9) as archive:
    for path in files:
        archive.write(path, Path("LastLight") / path.relative_to(root))
print(f"Packaged {len(files)} files: {destination} ({destination.stat().st_size / 1024:.0f} KB)")
