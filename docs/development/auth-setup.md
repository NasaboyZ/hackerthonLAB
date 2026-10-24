# Local authentication setup

Start PostgreSQL with `docker compose up -d postgres`, then run the API on port 5080 and the web app on port 3000. The Next.js rewrite proxies `/api/backend/*` to the API, so browser requests remain same-origin.

The initial SQL file contains the Identity tables and is safe for an existing schema through `IF NOT EXISTS`/`ADD COLUMN IF NOT EXISTS`. Do not use `EnsureCreated()` or delete the existing database. Production deployments must configure persistent ASP.NET Data Protection keys and HTTPS before running multiple API instances.
