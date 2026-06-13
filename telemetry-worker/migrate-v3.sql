-- THRONERUSH Telemetrie – Migration auf v3 (Passivitäts-/Camping-Metrik)
--
-- HINWEIS: Die D1-WEB-KONSOLE zerlegt die Eingabe an ";" und lehnt reine
-- Kommentar-Segmente ab ("Requests without any query"). Markiere beim
-- Einfügen in die Web-Konsole NUR die ALTER-Zeilen unten (ohne diesen
-- Kommentarblock). Per Wrangler-CLI ist die ganze Datei nutzbar:
--   wrangler d1 execute thronerush_telemetry --remote \
--     --file=telemetry-worker/migrate-v3.sql -c telemetry-worker/wrangler.toml
-- "duplicate column name" => Spalte existiert schon => Zeile überspringen.

ALTER TABLE runs ADD COLUMN idleMax REAL;
ALTER TABLE runs ADD COLUMN idlePct REAL;
