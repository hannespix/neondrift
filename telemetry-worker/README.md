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

## Automatischer Deploy via GitHub Action (empfohlen)

Der Workflow **`.github/workflows/deploy-telemetry.yml`** deployt den Worker und
wendet ausstehende **D1-Migrationen** (`telemetry-worker/migrations/`) automatisch
an – bei jedem Push auf `main`, der `telemetry-worker/**` betrifft (oder manuell
über „Run workflow"). Danach ist **kein manuelles Einfügen in Cloudflare mehr
nötig.**

**Einmalige Einrichtung:**

1. **API-Token** erstellen (Cloudflare → My Profile → API Tokens → Create Token →
   Custom) mit den Rechten **Account › Workers Scripts › Edit** und
   **Account › D1 › Edit**.
2. Im GitHub-Repo unter **Settings → Secrets and variables → Actions** anlegen:
   - `CLOUDFLARE_API_TOKEN` – der Token von oben
   - `CLOUDFLARE_ACCOUNT_ID` – Account-ID (Dashboard, rechte Spalte)
3. In `telemetry-worker/wrangler.toml` die echte **`database_id`** eintragen.
4. `ADMIN_TOKEN` bleibt als Worker-Secret bestehen – `wrangler deploy` **löscht
   keine vorhandenen Secrets**, also einmalig wie bisher per
   `wrangler secret put ADMIN_TOKEN` (oder Dashboard) setzen.

Solange `CLOUDFLARE_API_TOKEN` fehlt, überspringt der Job sauber (kein roter Lauf).

**Migrationen pflegen:** Schema-Änderung = **neue** Datei `migrations/000N_*.sql`
(fortlaufend nummeriert) mit den `ALTER`/`CREATE`-Statements. Die Action führt jede
Datei genau einmal aus (Stand wird in der Tabelle `d1_migrations` getrackt).
`migrate-v2.sql`/`migrate-v3.sql` sind nur noch manuelle Fallbacks für die alte
Konsolen-Methode.

## Deploy (einmalig, manuell – Alternative ohne CI)

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

## Update auf v2 (Balancing-KPIs)

Wenn die DB schon mit der v1-Tabelle läuft, fügt die Migration die neuen Spalten
hinzu (Todesursache, Boss-Funnel, Ökonomie-Werte, Upgrades, Revive …):

1. **D1-Konsole** (Dashboard → D1 → `thronerush_telemetry` → Console) den Inhalt
   von **`telemetry-worker/migrate-v2.sql`** einfügen & ausführen. *(Browser-Weg.)*
   Per CLI alternativ:
   ```bash
   wrangler d1 execute thronerush_telemetry --remote \
     --file=telemetry-worker/migrate-v2.sql -c telemetry-worker/wrangler.toml
   ```
2. **Worker neu deployen** – im Dashboard den aktualisierten `worker.js` einfügen
   und „Deploy", bzw. `wrangler deploy`.

Bestehende v1-Zeilen behalten in den neuen Spalten `NULL`; die Auswertung
ignoriert sie korrekt.

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

### Live-Dashboard

`telemetry-worker/dashboard.html` ist eine eigenständige Admin-Seite (vanilla,
keine Abhängigkeiten). Im Browser öffnen, Worker-URL + `ADMIN_TOKEN` eingeben
(bleibt nur lokal) → zeigt Karten, Winrate je Modus/Diff, Top-Waffen und
Synergie-Nutzung. Funktioniert, wenn der Worker CORS für die Herkunft der Seite
erlaubt (`ALLOW_ORIGIN`). Nicht öffentlich verlinkt und per Token geschützt –
die Seite ist kein Teil der PWA.

### Automatisch per GitHub Action

`.github/workflows/telemetry-stats.yml` generiert `STATS.md` täglich (und auf
Knopfdruck) und commitet sie bei Änderung. Dazu im Repo zwei Secrets setzen
(Settings → Secrets and variables → Actions): `TELEMETRY_BASE` (Worker-URL) und
`ADMIN_TOKEN`. Ohne Secrets läuft der Job durch und überspringt die Generierung.

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
