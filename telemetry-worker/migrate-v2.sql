-- THRONERUSH Telemetrie – Migration auf v2 (Balancing-KPIs)
--
-- HINWEIS: Die D1-WEB-KONSOLE zerlegt die Eingabe an ";" und lehnt
-- reine Kommentar-Segmente ab ("Requests without any query"). Markiere
-- daher beim Einfügen in die Web-Konsole NUR die ALTER/CREATE-Zeilen
-- unten (ohne diesen Kommentarblock). Per Wrangler-CLI ist die ganze
-- Datei dagegen problemlos nutzbar:
--   wrangler d1 execute thronerush_telemetry --remote \
--     --file=telemetry-worker/migrate-v2.sql -c telemetry-worker/wrangler.toml
-- Bestehende Zeilen bekommen in den neuen Spalten NULL – das ist ok.
-- "duplicate column name" => Spalte existiert schon => Zeile überspringen.

ALTER TABLE runs ADD COLUMN bossReached INTEGER;
ALTER TABLE runs ADD COLUMN ups TEXT;
ALTER TABLE runs ADD COLUMN runUp INTEGER;
ALTER TABLE runs ADD COLUMN chipsBal INTEGER;
ALTER TABLE runs ADD COLUMN spLeft INTEGER;
ALTER TABLE runs ADD COLUMN revive INTEGER;
ALTER TABLE runs ADD COLUMN director REAL;
ALTER TABLE runs ADD COLUMN jumps INTEGER;
ALTER TABLE runs ADD COLUMN onBeat INTEGER;
ALTER TABLE runs ADD COLUMN death TEXT;
CREATE INDEX IF NOT EXISTS idx_runs_lvl ON runs(lvl);
CREATE INDEX IF NOT EXISTS idx_runs_death ON runs(death);
