-- THRONERUSH Telemetrie – Migration auf v2 (Balancing-KPIs)
-- Für eine BEREITS bestehende D1-Datenbank: fügt die neuen Spalten hinzu.
-- Im Cloudflare-Dashboard → D1 → thronerush_telemetry → Console einfügen & ausführen.
-- (Bestehende Zeilen bekommen in den neuen Spalten NULL – das ist ok.)

ALTER TABLE runs ADD COLUMN bossReached INTEGER;
ALTER TABLE runs ADD COLUMN ups       TEXT;
ALTER TABLE runs ADD COLUMN runUp     INTEGER;
ALTER TABLE runs ADD COLUMN chipsBal  INTEGER;
ALTER TABLE runs ADD COLUMN spLeft    INTEGER;
ALTER TABLE runs ADD COLUMN revive    INTEGER;
ALTER TABLE runs ADD COLUMN director  REAL;
ALTER TABLE runs ADD COLUMN jumps     INTEGER;
ALTER TABLE runs ADD COLUMN onBeat    INTEGER;
ALTER TABLE runs ADD COLUMN death     TEXT;

CREATE INDEX IF NOT EXISTS idx_runs_lvl   ON runs(lvl);
CREATE INDEX IF NOT EXISTS idx_runs_death ON runs(death);
