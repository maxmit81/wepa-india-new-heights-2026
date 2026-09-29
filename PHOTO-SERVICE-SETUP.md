# Activating photo sharing

GitHub Pages serves static files and cannot store attendee photos. This repository includes a Cloudflare Worker and D1 database with pending review, approved gallery, image delivery, and clear upload responses. The public form remains disabled until the storage service answers a health check.

1. In a Cloudflare account, create a D1 database named `wepa-new-heights-db`; copy its database ID. Enable the `workers.dev` subdomain if prompted. The site is hosted at `https://maxmit81.github.io/wepa-india-new-heights-2026/`, so the Worker permits the browser origin `https://maxmit81.github.io`.
2. Create a Cloudflare API token with permission to edit Workers scripts and D1 databases for that account. In the GitHub repository, set **Actions secrets** `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `D1_DATABASE_ID`, and `WEPA_ADMIN_TOKEN`. Use a long random value for the review key; do not commit or send tokens in a message.
3. Run **Actions → Deploy photo service → Run workflow**. The workflow applies the database migration, stores the review key as a Worker secret, and deploys the Worker. Copy its HTTPS `workers.dev` URL from the deploy job output.
4. In **Settings → Secrets and variables → Actions → Variables**, set `WEPA_API_URL` to that URL (without a trailing slash). Run **Publish off-site website** again. This regenerates the site QR codes and enables the upload form only when `/api/health` confirms storage is available.
5. Open the site on a phone through the photo QR, upload a small sample image, and use `docs/admin.html` with the review key to approve it. Confirm it appears in the public gallery. Delete the sample from D1 if it should not remain (rejection only applies while pending).

The frontend accepts JPEG, PNG and WebP up to 20 MB and compresses images above 1.5 MB in the browser. The Worker checks signatures and stores photos as D1 BLOBs pending review. A photo is shown publicly only after approval. D1 limits rows and BLOBs to 2 MB, so this intentionally caps each stored image at 1.5 MB. The event cap is 500 photos or 250 MiB of active images. If more space is needed, switch image storage to R2.
