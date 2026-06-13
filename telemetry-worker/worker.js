/**
 * THRONERUSH – Telemetrie-Worker (Cloudflare)
 *
 * Gatekeeper zwischen Spiel-Client und D1-Datenbank:
 *   - POST /            → einen anonymen Run-Datensatz validieren & in D1 speichern
 *   - GET  /stats?token=…   → Aggregat-Auswertung als JSON (Admin)
 *   - GET  /export?token=…&format=ndjson|json → Rohdaten (Admin)
 *
 * Das macht es "professionell":
 *   - kein DB-Credential im Browser (Secrets liegen im Worker)
 *   - strikte Schema-/Größen-Validierung → kein Müll in der DB
 *   - einfaches Rate-Limit pro cid (Spam-Schutz)
 *   - IP wird NICHT gespeichert (DSGVO-freundlich)
 *   - CORS sauber, akzeptiert sendBeacon (text/plain) und fetch (application/json)
 *
 * Konfiguration (siehe wrangler.toml + Secrets):
 *   - D1-Binding   DB
 *   - Secret       ADMIN_TOKEN   (für /stats und /export)
 *   - Var          ALLOW_ORIGIN  (z. B. https://thronerush.example) – '*' erlaubt alle
 */

const ALLOWED_MODES = new Set(['normal', 'hardcore', 'zen']);
const MAX_BODY = 4096;          // Bytes – ein Run-Datensatz ist winzig
const RATE_MAX = 30;            // max. Inserts …
const RATE_WINDOW_MS = 60_000;  // … pro cid pro Minute

function cors(env) {
  const origin = (env && env.ALLOW_ORIGIN) || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function json(data, status, env) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', ...cors(env) },
  });
}

// Datensatz auf erwartete Form bringen; wirft bei groben Verstößen.
function sanitize(rec) {
  if (!rec || typeof rec !== 'object') throw new Error('bad record');
  const int = (v, lo, hi) => {
    let n = Math.round(Number(v));
    if (!Number.isFinite(n)) n = 0;
    return Math.max(lo, Math.min(hi, n));
  };
  const num = (v, lo, hi) => {
    let n = Number(v);
    if (!Number.isFinite(n)) n = 0;
    return Math.max(lo, Math.min(hi, n));
  };
  const str = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');
  const arr = (v, max, itemMax) =>
    Array.isArray(v) ? v.slice(0, max).map((x) => String(x).slice(0, itemMax)) : [];

  const mode = str(rec.mode, 16);
  return {
    ts: int(rec.ts, 0, 1e15),
    ver: str(rec.ver, 16),
    cid: str(rec.cid, 32),
    mode: ALLOWED_MODES.has(mode) ? mode : 'normal',
    diff: int(rec.diff, 0, 9),
    daily: rec.daily ? 1 : 0,
    lvl: int(rec.lvl, 0, 9999),
    score: int(rec.score, 0, 1e12),
    boss: int(rec.boss, 0, 9999),
    won: rec.won ? 1 : 0,
    durS: int(rec.durS, 0, 1e7),
    hits: int(rec.hits, 0, 1e6),
    near: int(rec.near, 0, 1e6),
    perfect: int(rec.perfect, 0, 1e6),
    orbs: int(rec.orbs, 0, 1e6),
    combo: int(rec.combo, 0, 1e6),
    dps: num(rec.dps, 0, 1e6),
    surv: num(rec.surv, 0, 1e6),
    wpn: JSON.stringify(arr(rec.wpn, 12, 24)),
    syn: JSON.stringify(arr(rec.syn, 24, 24)),
    coins: int(rec.coins, 0, 1e12),
  };
}

async function rateLimited(env, cid) {
  if (!cid) return false;
  const since = Date.now() - RATE_WINDOW_MS;
  const row = await env.DB.prepare(
    'SELECT COUNT(*) AS n FROM runs WHERE cid = ? AND server_ts > ?'
  )
    .bind(cid, since)
    .first();
  return (row && row.n) >= RATE_MAX;
}

async function handleIngest(request, env) {
  const len = Number(request.headers.get('content-length') || 0);
  if (len > MAX_BODY) return json({ ok: false, error: 'too large' }, 413, env);

  let raw;
  try {
    raw = await request.text();
  } catch {
    return json({ ok: false, error: 'no body' }, 400, env);
  }
  if (raw.length > MAX_BODY) return json({ ok: false, error: 'too large' }, 413, env);

  let parsed;
  try {
    parsed = JSON.parse(raw); // akzeptiert sendBeacon (text/plain) genauso wie fetch (json)
  } catch {
    return json({ ok: false, error: 'bad json' }, 400, env);
  }

  let rec;
  try {
    rec = sanitize(parsed);
  } catch {
    return json({ ok: false, error: 'bad record' }, 422, env);
  }

  if (await rateLimited(env, rec.cid)) return json({ ok: false, error: 'rate limited' }, 429, env);

  await env.DB.prepare(
    `INSERT INTO runs
      (server_ts, ts, ver, cid, mode, diff, daily, lvl, score, boss, won, durS, hits, near, perfect, orbs, combo, dps, surv, wpn, syn, coins)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  )
    .bind(
      Date.now(), rec.ts, rec.ver, rec.cid, rec.mode, rec.diff, rec.daily, rec.lvl,
      rec.score, rec.boss, rec.won, rec.durS, rec.hits, rec.near, rec.perfect,
      rec.orbs, rec.combo, rec.dps, rec.surv, rec.wpn, rec.syn, rec.coins
    )
    .run();

  return json({ ok: true }, 200, env);
}

function adminOk(url, env) {
  const token = url.searchParams.get('token') || '';
  return env.ADMIN_TOKEN && token && token === env.ADMIN_TOKEN;
}

async function handleStats(url, env) {
  if (!adminOk(url, env)) return json({ ok: false, error: 'unauthorized' }, 401, env);
  const db = env.DB;
  const totals = await db
    .prepare('SELECT COUNT(*) AS runs, SUM(won) AS wins, AVG(lvl) AS avgLvl, AVG(durS) AS avgDurS, MAX(score) AS maxScore FROM runs')
    .first();
  const byMode = (await db
    .prepare('SELECT mode, diff, COUNT(*) AS runs, SUM(won) AS wins, AVG(lvl) AS avgLvl FROM runs GROUP BY mode, diff ORDER BY runs DESC')
    .all()).results;
  const weapons = (await db
    .prepare("SELECT j.value AS weapon, COUNT(*) AS picks FROM runs, json_each(runs.wpn) AS j GROUP BY weapon ORDER BY picks DESC")
    .all()).results;
  const synergies = (await db
    .prepare("SELECT j.value AS synergy, COUNT(*) AS uses FROM runs, json_each(runs.syn) AS j GROUP BY synergy ORDER BY uses DESC")
    .all()).results;
  return json({ ok: true, totals, byMode, weapons, synergies }, 200, env);
}

async function handleExport(url, env) {
  if (!adminOk(url, env)) return json({ ok: false, error: 'unauthorized' }, 401, env);
  const format = url.searchParams.get('format') || 'ndjson';
  const limit = Math.min(Number(url.searchParams.get('limit') || 50000), 50000);
  const rows = (await env.DB
    .prepare('SELECT * FROM runs ORDER BY server_ts DESC LIMIT ?')
    .bind(limit)
    .all()).results;

  if (format === 'json') return json({ ok: true, rows }, 200, env);
  const ndjson = rows.map((r) => JSON.stringify(r)).join('\n');
  return new Response(ndjson, {
    status: 200,
    headers: { 'Content-Type': 'application/x-ndjson', ...cors(env) },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(env) });

    try {
      if (request.method === 'POST' && url.pathname === '/') return await handleIngest(request, env);
      if (request.method === 'GET' && url.pathname === '/stats') return await handleStats(url, env);
      if (request.method === 'GET' && url.pathname === '/export') return await handleExport(url, env);
      if (request.method === 'GET' && url.pathname === '/') return json({ ok: true, service: 'thronerush-telemetry' }, 200, env);
    } catch (e) {
      return json({ ok: false, error: 'server error' }, 500, env);
    }
    return json({ ok: false, error: 'not found' }, 404, env);
  },
};
