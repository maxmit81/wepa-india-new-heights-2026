# WEPA India · New Heights · DEC Off-site 2026

The public site is in `docs/` and publishes on GitHub Pages. The submission API is in `backend/` and uses a Cloudflare Worker with a D1 database for photos and feedback. All photos start as `pending`; only approved photos appear in the public gallery. Feedback is visible only in the protected review desk. GitHub Pages alone cannot accept or store uploads.

## Publish the backend

1. Use the **Workers Free** plan in a Cloudflare account. Create a D1 database named `wepa-new-heights-db`.
2. Put the returned D1 database ID into `backend/wrangler.jsonc`. Set `ALLOWED_ORIGIN` to `https://YOUR_GITHUB_USERNAME.github.io` (the origin, without repository path).
3. From `backend/`, install dependencies with `npm install`, authenticate with `npx wrangler login`, and run `npx wrangler d1 execute wepa-new-heights-db --remote --file migrations/0001_init.sql` once.
4. Run `npx wrangler secret put ADMIN_TOKEN` and enter a long random review key. Never commit it to GitHub. Deploy with `npm run deploy`.

## Publish the site

Create a public GitHub repository (suggested name: `wepa-india-new-heights-2026`), push this source to its `main` branch, and set the repository Actions variable `WEPA_API_URL` to the HTTPS Worker URL from the backend deployment. In **Settings → Pages**, select **GitHub Actions** as the publishing source. Run **Publish off-site website**. The workflow generates both QR codes for the actual GitHub Pages URL and publishes `docs/`. A subsequent push to `main` republishes the site automatically. The workflow deliberately fails before publishing when the API URL has not been configured, so the forms never appear live without their storage service.

The footer's **Review submissions** link opens `admin.html`. Enter the review key there to approve or reject photos and read private feedback. The key stays in memory until the tab is closed.

Keep the Cloudflare account on the **Workers Free** plan if you want a strict no-charge setup. D1 free accounts currently have a 500 MB limit per database; the API stops taking photos at 500 photos or 250 MB, whichever comes first. It compresses large source images in visitors' browsers, storing each at up to 1.5 MB. Rejected photos are erased from storage. If free daily request or database limits are reached, the submission service stops until the limits reset; do not upgrade to a paid plan unless you choose to accept charges. Keep an eye on usage in Cloudflare's dashboard. Photos uploaded before publishing are not possible; the GitHub Pages workflow waits for a working API URL.
