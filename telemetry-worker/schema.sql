-- THRONERUSH Telemetrie – D1 (SQLite) Schema
-- Anwenden:  wrangler d1 execute thronerush_telemetry --file=telemetry-worker/schema.sql --remote
--
-- Eine Zeile pro abgeschlossenem Run. Anonym (cid = zufällige Client-ID, keine PII).
-- wpn/syn werden als JSON-Text gespeichert (SQLite hat json_each() zum Auswerten).

CREATE TABLE IF NOT EXISTS runs (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  server_ts INTEGER NOT NULL,   -- Eingangszeit auf dem Server (ms)
  ts        INTEGER,            -- Client-Zeit (ms)
  ver       TEXT,               -- Spielversion (z. B. v327)
  cid       TEXT,               -- anonyme Client-ID
  mode      TEXT,               -- normal | hardcore | zen
  diff      INTEGER,            -- Schwierigkeitsindex
  daily     INTEGER,            -- 1 = Daily-Challenge
  lvl       INTEGER,            -- erreichtes Level
  score     INTEGER,
  boss      INTEGER,            -- besiegte Bosse
  won       INTEGER,            -- 1 = Run gewonnen
  durS      INTEGER,            -- Dauer in Sekunden
  hits      INTEGER,            -- erlittene Treffer
  near      INTEGER,            -- Near-Misses
  perfect   INTEGER,            -- perfekte Ausweichmanöver
  orbs      INTEGER,            -- gesammelte Orbs
  combo     INTEGER,            -- maximale Combo
  dps       REAL,               -- geschätzter DPS
  surv      REAL,               -- Survivability-Index
  wpn       TEXT,               -- JSON-Array der Waffen-IDs
  syn       TEXT,               -- JSON-Array der aktiven Synergien
  coins     INTEGER             -- in diesem Run verdiente Coins
);

-- Indizes für die häufigsten Auswertungen
CREATE INDEX IF NOT EXISTS idx_runs_server_ts ON runs(server_ts);
CREATE INDEX IF NOT EXISTS idx_runs_cid_ts    ON runs(cid, server_ts);
CREATE INDEX IF NOT EXISTS idx_runs_mode_diff ON runs(mode, diff);
