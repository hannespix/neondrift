-- 0002_idle – Passivitäts-/Camping-Metrik (Telemetrie v3).
-- Wird von der GitHub Action genau einmal ausgeführt und ergänzt die zwei
-- Spalten auf der bestehenden (v2-)D1 automatisch.

ALTER TABLE runs ADD COLUMN idleMax REAL;
ALTER TABLE runs ADD COLUMN idlePct REAL;
