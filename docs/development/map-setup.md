# Map setup

Start PostgreSQL/PostGIS, the API and the web app in separate terminals:

```bash
docker compose up -d postgres
dotnet run --project backend/src/Magnetrail.Api
cd apps/web && npm install && npm run dev
```

Open `/map`. If the API is unavailable, the basemap remains independent but the UI reports that regulation information could not be loaded. No empty map state is presented as proof that magnetfishing is allowed.

