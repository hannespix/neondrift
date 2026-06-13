# THRONERUSH – Telemetrie-Worker

Professionelle, datensparsame Telemetrie-Pipeline:

```
Spiel-Client  ──POST──▶  Cloudflare Worker (Gatekeeper)  ──▶  D1 (SQLite)
                          • CORS + nur POST/GET
                          • Schema-/Größen-Validierung
                          • Rate-Limit pro cid
                          • IP wird NICHT gespeichert
                                                              │
                          GET /stats, /export (Admin-Token) ◀─┘
                                  │
                          npm run stats  ──▶  STATS.md
```

Der Client (`js/game.js`) ist bereits verdrahtet: anonymer Datensatz pro Run
(`runRecord`), Opt-in-Schalter „📊 Anonyme Statistik" (standardmäßig **aus**),
zuverlässiger Versand via `navigator.sendBeacon` mit `fetch`-Fallback. Es fehlt
nur die Endpunkt-URL.

## Voraussetzungen

- Cloudflare-Account (kostenloser Tier reicht)
- `npm i -g wrangler` und `wrangler login`

## Deploy (einmalig)

Alle Befehle aus dem Repo-Root.

1. **D1-Datenbank anlegen**
   ```bash
   wrangler d1 create thronerush_telemetry
   ```
   Die ausgegebene `database_id` in `telemetry-worker/wrangler.toml`
   beim Platzhalter eintragen.

2. **Schema anwenden** (remote)
   ```bash
   wrangler d1 execute thronerush_telemetry --remote \
     --file=telemetry-worker/schema.sql
   ```

3. **Admin-Token als Secret setzen** (für /stats und /export)
   ```bash
   wrangler secret put ADMIN_TOKEN -c telemetry-worker/wrangler.toml
   # einen langen Zufallswert eingeben, z. B. `openssl rand -hex 24`
   ```

4. **Erlaubte Origin setzen** – in `wrangler.toml` `ALLOW_ORIGIN`
   auf die echte Spiel-URL ändern (z. B. `https://thronerush.example`).
   `*` nur zum Testen.

5. **Deployen**
   ```bash
   wrangler deploy -c telemetry-worker/wrangler.toml
   ```
   Wrangler zeigt die Worker-URL, z. B.
   `https://thronerush-telemetry.<account>.workers.dev`.

6. **URL ins Spiel eintragen** – in `js/game.js` die Konstante
   `TELEMETRY_URL` auf diese Worker-URL setzen (mit `/` am Ende ist ok).
   Danach **SW-CACHE-Version hochzählen** (`service-worker.js`) und
   `GAME_VER` synchron halten.

Ab jetzt sendet jeder Spieler **mit aktiviertem Opt-in** seinen Run anonym
an den Worker.

## Endpunkte

| Methode | Pfad | Zweck |
|---|---|---|
| `POST` | `/` | einen Run-Datensatz speichern (vom Spiel) |
| `GET` | `/stats?token=…` | Aggregate als JSON (Admin) |
| `GET` | `/export?token=…&format=ndjson\|json&limit=N` | Rohdaten (Admin) |
| `GET` | `/` | Health-Check |

## Auswertung als Markdown

```bash
TELEMETRY_BASE="https://thronerush-telemetry.<account>.workers.dev" \
ADMIN_TOKEN="dein-token" \
npm run stats
# schreibt STATS.md (Runs gesamt, Winrate je Modus/Diff, Top-Waffen, Synergie-Nutzung)
```

Rohdaten ziehen (z. B. für eigene Analysen):

```bash
curl "https://…workers.dev/export?token=DEIN_TOKEN&format=ndjson" > runs.ndjson
```

## Lokal testen

```bash
wrangler dev -c telemetry-worker/wrangler.toml
# in einem zweiten Terminal:
curl -X POST localhost:8787/ -H 'Content-Type: application/json' \
  -d '{"v":1,"ver":"v327","cid":"test","mode":"normal","diff":2,"lvl":5,"score":1234,"won":1,"durS":90,"wpn":["blaster","frost"],"syn":["frostbeam"]}'
```

## Datenschutz / DSGVO

- **Opt-in**, standardmäßig deaktiviert; jederzeit abschaltbar.
- Anonyme `cid` (Zufallswert), **keine** personenbezogenen Daten.
- Der Worker speichert **keine IP** und keine Header.
- In `privacy.html` ist die optionale Server-Übermittlung beschrieben.
- Speichere nur, was du auswertest; lösche alte Rohdaten regelmäßig
  (`DELETE FROM runs WHERE server_ts < …`).

## Alternative Speicher

D1 lässt sich im Worker durch einen anderen Store ersetzen, ohne den
Client anzufassen (R2 als NDJSON-Anhang, oder Postgres/Supabase per
HTTP) – die Validierungs-/CORS-/Rate-Limit-Logik bleibt gleich.
