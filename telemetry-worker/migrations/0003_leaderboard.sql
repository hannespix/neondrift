-- THRONERUSH Leaderboard
-- Ein Eintrag pro Spieler & Board (Opt-in, selbst gewählter Nickname).
-- Boards:  Global pro Modus (daily=0, dailyDate='')  ·  Daily pro Tag (daily=1, dailyDate=YYYY-MM-DD)
-- Scores sind client-gemeldet (Casual-Game) → grobe Sanity-Caps im Worker, keine PII.

CREATE TABLE IF NOT EXISTS scores (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  server_ts INTEGER NOT NULL,        -- Eingangszeit (ms)
  ver       TEXT,                    -- Spielversion
  cid       TEXT NOT NULL,           -- anonyme Client-ID (= Telemetrie-cid, keine PII)
  nick      TEXT NOT NULL,           -- selbst gewählter Anzeigename (max 16, bereinigt)
  score     INTEGER NOT NULL,
  mode      TEXT NOT NULL DEFAULT 'normal',
  daily     INTEGER NOT NULL DEFAULT 0,
  dailyDate TEXT NOT NULL DEFAULT '',
  lvl       INTEGER,
  boss      INTEGER
);

-- Genau ein Eintrag pro Spieler pro Board → Upsert auf den Bestwert (ON CONFLICT)
CREATE UNIQUE INDEX IF NOT EXISTS idx_scores_uniq  ON scores(cid, daily, dailyDate, mode);
-- Bestenlisten-Abfrage: Top-N je Board nach Score
CREATE INDEX IF NOT EXISTS idx_scores_board ON scores(daily, dailyDate, mode, score DESC);
-- Rate-Limit pro cid
CREATE INDEX IF NOT EXISTS idx_scores_cid_ts ON scores(cid, server_ts);
