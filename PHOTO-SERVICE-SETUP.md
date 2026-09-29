# Photo sharing and storage

The live service uses Cloudflare Workers, a private R2 bucket (`wepa-new-heights-photos`) for image files, and D1 (`wepa-new-heights-db`) for review status and metadata. The API is `https://wepa-new-heights-api.maxmit81.workers.dev`.

The event has a **2 GB total photo limit (2,000,000,000 bytes)** across pending and approved photos, including in-progress upload reservations. Each stored photo is limited to 1.5 MB. There is no 500-photo total limit. The upload form accepts JPEG, PNG and WebP originals up to 20 MB and compresses larger images before uploading. The server verifies image signatures and reserves capacity atomically before writing to R2.

## Organiser review

Open [the review desk](https://maxmit81.github.io/wepa-india-new-heights-2026/admin.html) and enter the private review key. The desk shows storage used out of 2 GB. Select photos to approve or delete in bulk; large selections are sent in batches. Individual approval, rejection and deletion are also available. Rejecting or deleting removes the stored image and frees space. Failed removals and abandoned uploads are retried by an hourly cleanup job.

Public visitors see only approved photos. The two public QR codes lead to the website and its photo upload section; neither contains the review key. Knowing the admin URL does not grant access. Keep the key private and never commit it to GitHub.

## Deployment and maintenance

R2 activation, the bucket, bindings, migrations and Worker deployment have been completed directly through Cloudflare. The existing approved photo was migrated from D1 to R2 and its checksum verified. The temporary migration route is disabled in production.

`backend/wrangler.jsonc` records the D1 and R2 bindings and hourly schedule. Preserve the `ADMIN_TOKEN` Worker secret when deploying. `ALLOWED_ORIGIN` is `https://maxmit81.github.io`. Keep the R2 bucket private: images are delivered through the Worker after checking review status.

The optional **Deploy photo service** GitHub workflow requires Actions secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `D1_DATABASE_ID`, and `WEPA_ADMIN_TOKEN`. Its API token must have appropriate Workers, D1 and R2 permissions. These deployment credentials must be configured separately before using that workflow. The bucket must exist before deployment. Apply D1 migrations, then deploy the Worker; do not reapply the R2 ALTER TABLE migration manually.

The Pages workflow publishes `docs/`, regenerates both QR codes, and uses `WEPA_API_URL` if configured; the checked-in default points to the live API. `/api/health` checks both storage bindings and reports the capacity. The gallery has a Load more control, and the admin desk fetches all review pages.

Run backend regression tests with Node 24: `cd backend && node --test test/r2.test.mjs`. They cover privacy, authorization, concurrent quota reservations, pagination, migration, deletion, and recovery after storage failures. Live upload, approval and deletion were also tested against R2.

The 2 GB limit is an application storage limit, not a billing cap for the entire Cloudflare account or its requests.
