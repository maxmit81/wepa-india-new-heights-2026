"""Set API origin and make QR codes for this repository's Pages URL."""
import json
import hashlib
import os
from pathlib import Path
import qrcode

root = Path(__file__).resolve().parents[1]
owner, repo = os.environ["GITHUB_REPOSITORY"].split("/", 1)
api_url = (os.environ.get("WEPA_API_URL") or "https://wepa-new-heights-api.maxmit81.workers.dev").rstrip("/")
if api_url and not api_url.startswith("https://"):
    raise SystemExit("WEPA_API_URL must be the deployed HTTPS Worker URL.")
pages_url = f"https://{owner.lower()}.github.io/"
if repo.lower() != f"{owner.lower()}.github.io":
    pages_url += repo + "/"
(root / "docs" / "config.js").write_text("window.WEPA_API_BASE = " + json.dumps(api_url) + ";\n")
config_version = hashlib.sha256(api_url.encode()).hexdigest()[:12]
for page in (root / "docs").glob("*.html"):
    page.write_text(page.read_text().replace('src="config.js"', f'src="config.js?v={config_version}"'))
images = root / "docs" / "assets" / "images"
for name, url in {
    "event-qr.png": pages_url,
    "photo-upload-qr.png": pages_url + "#photos",
}.items():
    qrcode.make(url, box_size=10, border=4).save(images / name)
print("Prepared Pages site for", pages_url)
