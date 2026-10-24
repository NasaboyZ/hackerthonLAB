# Magnetrail-Backend auf Railway

Das Repository enthält ein Root-`Dockerfile` und `railway.json`. Railway kann den ASP.NET-Core-Service dadurch direkt aus dem GitHub-Repository bauen. Railway erkennt das Dockerfile automatisch; der Healthcheck ist `/health`.

## Railway-Services

1. Ein Railway-Projekt anlegen.
2. Einen PostgreSQL-Service hinzufügen.
3. Einen GitHub-Service für `NasaboyZ/hackerthonLAB` anlegen und den Backend-Service auf den Branch `main` zeigen lassen.
4. Im Backend-Service die Referenzvariable `ConnectionStrings__Database=${{Postgres.DATABASE_URL}}` setzen.

Die vorhandene Datenbankstruktur wird einmalig über `infra/docker/001_initial_schema.sql` angelegt. Vor dem ersten produktiven Start muss dieses SQL gegen die Railway-PostgreSQL-Datenbank ausgeführt werden; es ist idempotent und löscht keine bestehenden Daten. Railway bietet dafür die Datenbankverbindung bzw. `railway connect` an.

## Backend-Variablen

```text
ConnectionStrings__Database=${{Postgres.DATABASE_URL}}
CORS_ORIGINS=https://<deine-vercel-domain>
COOKIE_CROSS_SITE=true
DATA_PROTECTION_KEYS_PATH=/data/keys
```

`CORS_ORIGINS` darf nur konkrete Frontend-Origin(s) enthalten, kommasepariert und ohne abschließenden Slash. Für eine Railway- oder Vercel-Preview-Domain muss die jeweilige Origin separat ergänzt werden.

Für `DATA_PROTECTION_KEYS_PATH` sollte in Railway ein Volume nach `/data` gemountet werden. Ohne Volume funktioniert der Dienst, aber nach einem Container-Neustart werden bestehende Sessions ungültig.

## Vercel-Variablen

Im Vercel-Projekt muss für Production und Preview die Backend-URL gesetzt werden:

```text
NEXT_PUBLIC_API_URL=https://<deine-railway-domain>
```

Danach muss das Vercel-Projekt neu deployed werden. Die lokale Rewrite-Regel auf `/api/backend` bleibt für die lokale Entwicklung bestehen.

## Öffentliche Railway-Domain

Im Railway-Backend-Service unter Networking eine Public Domain erzeugen. Diese URL wird als `NEXT_PUBLIC_API_URL` in Vercel und als `CORS_ORIGINS` im Backend verwendet.
