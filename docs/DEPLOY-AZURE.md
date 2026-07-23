# Hosting in the RCS Azure environment

The prototype is a single static file, so hosting is deliberately simple. Two
good options:

## Option A — Azure Static Web Apps (recommended)

Best fit: free/low-cost tier, global CDN, built-in HTTPS, and GitHub-based CI so
every merge to `main` auto-deploys.

1. In the Azure Portal: **Create resource → Static Web App**.
2. Source: this GitHub repository; branch: `main`.
3. Build details:
   - **App location:** `/`
   - **Api location:** *(leave blank for now — added in Phase 2)*
   - **Output location:** `/`  (the app is `index.html` at the repo root)
4. Azure adds a GitHub Actions workflow that publishes on every push to `main`.

Because `index.html` is pre-built and committed, no build step is required in
CI. If you prefer CI to rebuild from source, add a step running
`python3 build.py` before deploy.

## Option B — Azure Blob Storage static website

1. Create a Storage Account → **Static website** → Enable.
2. Set the index document to `index.html`.
3. Upload `index.html` (and `data/`, `assets/` if you want them served too) to
   the `$web` container.
4. Optionally front it with Azure CDN / Front Door for HTTPS on a custom domain.

## Notes

- The app makes **no external network calls** and loads no third-party
  scripts/fonts, so it works behind strict network policies and needs no CORS or
  CSP exceptions.
- For a custom domain + TLS, use the Static Web Apps custom-domain feature or
  Azure Front Door.
- Phase 2 (chatbot API) will introduce an Azure Functions / Container Apps
  backend — Static Web Apps can host that API alongside the front end.
