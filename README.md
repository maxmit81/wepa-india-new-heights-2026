# WEPA India · New Heights · DEC Off-site 2026

The public site is a continuous, responsive page in `docs/`, published to [GitHub Pages](https://maxmit81.github.io/wepa-india-new-heights-2026/) by `.github/workflows/pages.yml`. Visitors can scroll naturally or use the sticky section menu and day links. All four complete agendas, all speaker cards, and all resort facilities are visible together. Feedback is hidden from the public page.

Photo uploads require the Cloudflare Worker and D1 database in `backend/`. GitHub Pages cannot store files. The upload form stays disabled with a clear status message until a deployed Worker answers `/api/health`. Once connected, attendees can use the photo QR code, compress and upload an image, see a receipt or error, and wait for organiser review. Approved images appear in the public gallery. The private review desk is at `docs/admin.html`.

See [PHOTO-SERVICE-SETUP.md](PHOTO-SERVICE-SETUP.md) for the exact Cloudflare and GitHub configuration, deployment workflow, and end-to-end sample upload check. Never commit or send credentials in a message.

The Pages workflow regenerates the event and photo QR codes for the repository's actual URL, and inserts `WEPA_API_URL` from the repository Actions variable when configured. The Worker allows requests from `https://maxmit81.github.io`.
