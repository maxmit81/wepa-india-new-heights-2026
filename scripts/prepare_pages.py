"""Set API origin and make QR codes for this repository's Pages URL."""
import json
import os
from pathlib import Path
import qrcode

root = Path(__file__).resolve().parents[1]
owner, repo = os.environ["GITHUB_REPOSITORY"].split("/", 1)
api_url = os.environ.get("WEPA_API_URL", "").rstrip("/")
if api_url and not api_url.startswith("https://"):
    raise SystemExit("WEPA_API_URL must be the deployed HTTPS Worker URL.")
pages_url = f"https://{owner.lower()}.github.io/"
if repo.lower() != f"{owner.lower()}.github.io":
    pages_url += repo + "/"
(root / "docs" / "config.js").write_text("window.WEPA_API_BASE = " + json.dumps(api_url) + ";\n")
images = root / "docs" / "assets" / "images"
for name, url in {
    "event-qr.png": pages_url,
    "photo-upload-qr.png": pages_url + "#photos",
}.items():
    qrcode.make(url, box_size=10, border=4).save(images / name)
print("Prepared Pages site for", pages_url)
