-- 0001_init – Baseline (Stand v2). Spiegelt den AKTUELLEN Live-Stand der D1.
--
-- Idempotent (CREATE ... IF NOT EXISTS): Auf der bestehenden D1 ein No-Op, das
-- nur als „angewendet" verbucht wird; auf einer frischen D1 baut es die Tabelle
-- inkl. v2-Spalten auf. Spätere Änderungen kommen als NEUE, höher nummerierte
-- Datei (0002, 0003 …) dazu und werden von der Action genau einmal ausgeführt.

CREATE TABLE IF NOT EXISTS runs (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  server_ts INTEGER NOT NULL,
  ts        INTEGER,
  ver       TEXT,
  cid       TEXT,
  mode      TEXT,
  diff      INTEGER,
  daily     INTEGER,
  lvl       INTEGER,
  score     INTEGER,
  boss      INTEGER,
  won       INTEGER,
  durS      INTEGER,
  hits      INTEGER,
  near      INTEGER,
  perfect   INTEGER,
  orbs      INTEGER,
  combo     INTEGER,
  dps       REAL,
  surv      REAL,
  wpn       TEXT,
  syn       TEXT,
  coins     INTEGER,
  bossReached INTEGER,
  ups       TEXT,
  runUp     INTEGER,
  chipsBal  INTEGER,
  spLeft    INTEGER,
  revive    INTEGER,
  director  REAL,
  jumps     INTEGER,
  onBeat    INTEGER,
  death     TEXT
);

CREATE INDEX IF NOT EXISTS idx_runs_server_ts ON runs(server_ts);
CREATE INDEX IF NOT EXISTS idx_runs_cid_ts    ON runs(cid, server_ts);
CREATE INDEX IF NOT EXISTS idx_runs_mode_diff ON runs(mode, diff);
CREATE INDEX IF NOT EXISTS idx_runs_lvl       ON runs(lvl);
CREATE INDEX IF NOT EXISTS idx_runs_death     ON runs(death);
