#!/usr/bin/env node
/**
 * THRONERUSH – Auto-Balance Director
 * ----------------------------------
 * Holt Telemetrie (/stats), bewertet die AKTUELL ausgelieferte Spielversion mit einem
 * ausgewogenen Health-Score, vergleicht sie mit der Vorversion und passt die Balancing-
 * Knöpfe (BAL-Block in js/game.js) gedämpft an. Ziel: Spielspaß + Sessionlänge steigen
 * Version für Version.
 *
 * Sicherheits-Leitplanken:
 *   - MIN_RUNS: keine Änderung, solange die aktuelle Version zu wenige Runs hat (kein Rauschen-Tuning).
 *   - SOAK_HOURS: eine frische Version muss erst „einwirken", bevor neu justiert wird → kein 180°-Schwenk pro Tag.
 *   - Gedämpfte Schrittweite: anfangs größere Schritte, mit jeder getunten Version kleiner (Feintuning).
 *   - Revert-bei-Regression: hat die letzte Änderung den Score verschlechtert, wird teilweise zurückgenommen.
 *   - Geklammerte Wertebereiche pro Knopf + Cap pro Tag.
 *   - node --check-Gate (im Workflow): kaputte Syntax wird nie deployt.
 *   - Kill-Switch: existiert tuning/AUTOPILOT_OFF, passiert nichts.
 *
 * Nutzung (lokal):
 *   TELEMETRY_BASE=… ADMIN_TOKEN=… node tools/auto-balance.mjs           # voll-automatisch
 *   …  DRY_RUN=1 node tools/auto-balance.mjs                              # nur rechnen, nichts schreiben
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';

const base = process.env.TELEMETRY_BASE || process.argv[2] || '';
const token = process.env.ADMIN_TOKEN || process.argv[3] || '';
const DRY = !!process.env.DRY_RUN;
const envNum = (k, def) => (process.env[k] != null && process.env[k] !== '' ? Number(process.env[k]) : def);
const MIN_RUNS = envNum('MIN_RUNS', 40);
const SOAK_HOURS = envNum('SOAK_HOURS', 18);

const GAME = 'js/game.js';
const SW = 'service-worker.js';
const STATE = 'tuning/state.json';
const REPORT = 'BALANCING.md';

// Knopf-Definitionen: Bereich + Tagescap. "harder"=true → höherer Wert macht das Spiel schwerer.
const KNOBS = {
  difficulty:  { min: 0.70, max: 1.40, harder: true },
  spawnRate:   { min: 0.70, max: 1.40, harder: true },
  eliteChance: { min: 0.60, max: 1.60, harder: true },
};
// Ziel-Korridore für den Health-Score (Arcade: die meisten Runs gehen verloren, aber gewinnbar).
const T = {
  winLo: 0.10, winHi: 0.28, winIdeal: 0.18,
  sessionTarget: 150,        // s – „gute" mittlere Run-Dauer
  sessionGrind: 320,         // s – darüber droht Grind/zu leicht
  idleWonMax: 14,            // s – Ø längste eingabefreie Strecke bei Siegen; höher = Camping
  campShareMax: 0.25,        // Anteil Camp-Siege an allen Siegen
  retIdeal: 0.30,            // 30 % wiederkehrende Spieler = voll
};

if (!base || !token) {
  console.error('Fehlt TELEMETRY_BASE / ADMIN_TOKEN – Abbruch (kein Fehler im Loop).');
  process.exit(0);
}
if (existsSync('tuning/AUTOPILOT_OFF')) {
  console.log('🛑 tuning/AUTOPILOT_OFF vorhanden → Auto-Balance pausiert.');
  process.exit(0);
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const r2 = (n) => Math.round(n * 100) / 100;

async function getStats(ver) {
  const u = base.replace(/\/+$/, '') + '/stats?token=' + encodeURIComponent(token) + (ver ? '&ver=' + encodeURIComponent(ver) : '');
  const res = await fetch(u);
  if (!res.ok) throw new Error('Worker HTTP ' + res.status);
  const j = await res.json();
  if (!j || !j.ok) throw new Error('unerwartete /stats-Antwort');
  return j;
}

// Ausgewogener Health-Score 0..100 aus den KPIs der gegebenen Version.
function healthScore(s) {
  const t = s.totals || {};
  const runs = t.runs || 0, wins = t.wins || 0;
  const winRate = runs ? wins / runs : 0;
  // 1) Win-Rate im Korridor (Zelt um winIdeal)
  let winBand;
  if (winRate >= T.winLo && winRate <= T.winHi) {
    winBand = 1 - Math.abs(winRate - T.winIdeal) / Math.max(T.winIdeal - T.winLo, T.winHi - T.winIdeal);
  } else {
    const d = winRate < T.winLo ? T.winLo - winRate : winRate - T.winHi;
    winBand = clamp(1 - d / 0.20 - 0.4, 0, 1);   // außerhalb → schnell schlecht
  }
  winBand = clamp(winBand, 0, 1);
  // 2) Sessionlänge Richtung Ziel, leichte Strafe für Grind
  const dur = t.avgDurS || 0;
  let session = clamp(dur / T.sessionTarget, 0, 1);
  if (dur > T.sessionGrind) session *= clamp(1 - (dur - T.sessionGrind) / 600, 0.6, 1);
  // 3) Anti-Camping (nur sinnvoll, wenn es Siege gibt)
  let antiCamp = 0.5;
  if (wins > 0) {
    const idle = t.avgIdleMaxWon || 0;
    const campShare = (t.campWins || 0) / wins;
    antiCamp = clamp(1 - idle / (T.idleWonMax * 2), 0, 1) * 0.6 + clamp(1 - campShare / (T.campShareMax * 2), 0, 1) * 0.4;
  }
  // 4) Retention
  const players = t.players || 0;
  const ret = players ? clamp((s.returning || 0) / players / T.retIdeal, 0, 1) : 0.4;
  // 5) Ausgewogene Todesursachen (keine dominiert)
  let deathBal = 0.7;
  const deaths = s.deaths || [];
  const dTot = deaths.reduce((a, d) => a + (d.n || 0), 0);
  if (dTot > 0) { const top = (deaths[0].n || 0) / dTot; deathBal = clamp(1 - (top - 0.34) / 0.5, 0, 1); }
  const score = 100 * (0.30 * winBand + 0.25 * session + 0.20 * antiCamp + 0.15 * ret + 0.10 * deathBal);
  return { score: r2(score), winRate: r2(winRate), parts: { winBand: r2(winBand), session: r2(session), antiCamp: r2(antiCamp), ret: r2(ret), deathBal: r2(deathBal) } };
}

// KPI-getriebene Wunschrichtung je Knopf (-1 leichter … +1 schwerer/mehr).
function desiredDirection(s) {
  const t = s.totals || {};
  const runs = t.runs || 0, wins = t.wins || 0;
  const winRate = runs ? wins / runs : 0;
  const dir = { difficulty: 0, spawnRate: 0, eliteChance: 0 };
  // Zu leicht?  → schwerer
  if (winRate > T.winHi) { dir.difficulty += 1; dir.spawnRate += 1; }
  // Zu schwer? → leichter
  if (winRate < T.winLo) { dir.difficulty -= 1; dir.spawnRate -= 1; }
  // Camping → aktiver erzwingen (Tempo + Elite hoch)
  if (wins > 0) {
    const idle = t.avgIdleMaxWon || 0, campShare = (t.campWins || 0) / wins;
    if (idle > T.idleWonMax || campShare > T.campShareMax) { dir.spawnRate += 1; dir.eliteChance += 1; }
  }
  // Sehr kurze Sessions bei niedriger Win-Rate → Frust → leicht entschärfen
  if ((t.avgDurS || 0) < 45 && winRate < T.winLo) { dir.difficulty -= 1; }
  // Eine Todesursache dominiert „elite" → Elite etwas zurück
  const deaths = s.deaths || [], dTot = deaths.reduce((a, d) => a + (d.n || 0), 0);
  if (dTot > 0) { const elite = deaths.find((d) => d.death === 'elite'); if (elite && elite.n / dTot > 0.5) dir.eliteChance -= 1; }
  return dir;
}

// ---------- Hauptlauf ----------
const verMatch = readFileSync(GAME, 'utf8').match(/const GAME_VER='v(\d+)'/);
if (!verMatch) { console.error('GAME_VER nicht gefunden – Abbruch.'); process.exit(0); }
const curVerNum = Number(verMatch[1]);
const curVer = 'v' + curVerNum;

const overall = await getStats(null);
const cur = await getStats(curVer);
const curRuns = (cur.totals && cur.totals.runs) || 0;

const state = existsSync(STATE) ? JSON.parse(readFileSync(STATE, 'utf8')) : { history: [] };
const hist = state.history;
const prevEntry = hist.length ? hist[hist.length - 1] : null;        // zuletzt erzeugte Version
const curKnobs = readKnobs();

const health = healthScore(cur);
const lines = [];
const log = (m) => { lines.push(m); console.log(m); };
log('# THRONERUSH – Auto-Balance Report');
log('');
log('_' + new Date().toISOString() + '_');
log('');
log('**Aktuelle Version:** ' + curVer + ' · **Runs:** ' + curRuns + ' · **Health:** ' + health.score + '/100');
log('Knöpfe: `' + JSON.stringify(curKnobs) + '`');
log('Score-Teile: `' + JSON.stringify(health.parts) + '` · Win-Rate ' + (health.winRate * 100).toFixed(1) + '%');

// --- Guardrails ---
const verInfo = (overall.versions || []).find((v) => v.ver === curVer);
const ageH = verInfo && verInfo.first ? (Date.now() - verInfo.first) / 3600000 : 0;
if (curRuns < MIN_RUNS) { finish('⏳ Zu wenig Daten für ' + curVer + ' (' + curRuns + '/' + MIN_RUNS + ') → keine Änderung.'); }
if (ageH < SOAK_HOURS) { finish('⏳ ' + curVer + ' erst ' + ageH.toFixed(1) + ' h live (< ' + SOAK_HOURS + ' h Einwirkzeit) → keine Änderung.'); }

// --- Reife & Schrittweite (anfangs größer, später feiner) ---
const tunedCount = hist.filter((h) => h.score != null).length;
let step = clamp(0.06 * Math.pow(0.85, tunedCount), 0.015, 0.06);

// --- Vergleich mit Vorversion (Hill-Climbing / Revert) ---
let trend = '–', regressed = false;
if (prevEntry && prevEntry.score != null && prevEntry.ver !== curVer) {
  const delta = r2(health.score - prevEntry.score);
  trend = (delta >= 0 ? '+' : '') + delta + ' ggü. ' + prevEntry.ver + ' (' + prevEntry.score + ')';
  if (delta < -1.5) { regressed = true; step *= 0.5; }   // letzte Änderung hat geschadet → vorsichtiger + zurückrudern
}
log('Trend: ' + trend + ' · Schrittweite: ' + r2(step) + (regressed ? ' (Regression → gedämpft + Revert-Bias)' : ''));

// --- Neue Knöpfe bestimmen ---
const dir = desiredDirection(cur);
const newKnobs = { ...curKnobs };
const changes = [];
for (const k of Object.keys(KNOBS)) {
  let d = Math.sign(dir[k] || 0);   // nur Richtung → max. EIN Schritt pro Knopf pro Tag (Tagescap)
  // Revert-Bias: bei Regression Richtung der letzten Änderung umkehren
  if (regressed && prevEntry && prevEntry.prevKnobs) {
    const lastDelta = (curKnobs[k] || 1) - (prevEntry.prevKnobs[k] || 1);
    if (Math.abs(lastDelta) > 0.001) d = -Math.sign(lastDelta);   // teilweiser Rückzug
  }
  if (!d) continue;
  let nv = clamp(r2((curKnobs[k] || 1) + d * step), KNOBS[k].min, KNOBS[k].max);
  if (Math.abs(nv - (curKnobs[k] || 1)) >= 0.005) { newKnobs[k] = nv; changes.push(k + ': ' + (curKnobs[k] || 1) + ' → ' + nv + (KNOBS[k].harder ? (nv > curKnobs[k] ? ' (schwerer)' : ' (leichter)') : '')); }
}

// Aktuelle Version im State mit gemessenem Score „abschließen"
const ce = hist.find((h) => h.ver === curVer);
if (ce) { ce.score = health.score; ce.runs = curRuns; }
else hist.push({ ver: curVer, knobs: curKnobs, score: health.score, runs: curRuns, ts: Date.now() });

if (!changes.length) { saveState(); finish('✅ ' + curVer + ' ist im grünen Bereich – keine Anpassung nötig.'); }

// --- Änderung anwenden: Version bumpen, Knöpfe + SW schreiben, State + Report ---
const nextVer = 'v' + (curVerNum + 1);
log('');
log('## Anpassung → ' + nextVer);
changes.forEach((c) => log('- ' + c));

hist.push({ ver: nextVer, knobs: newKnobs, prevKnobs: curKnobs, score: null, runs: null, ts: Date.now(), reason: changes });

if (DRY) { log(''); log('_(DRY_RUN: nichts geschrieben)_'); saveReport(); console.log('\nSTATUS=DRYRUN'); process.exit(0); }

writeKnobs(newKnobs);
bumpVersion(curVerNum + 1);
saveState();
saveReport();
console.log('\nSTATUS=CHANGED ' + curVer + ' → ' + nextVer);
process.exit(0);

// ---------- Helpers ----------
function readKnobs() {
  const m = readFileSync(GAME, 'utf8').match(/const BAL=\{([^}]*)\};/);
  const o = {};
  if (m) m[1].split(',').forEach((p) => { const x = p.split(':'); if (x.length === 2) o[x[0].trim()] = Number(x[1]); });
  for (const k of Object.keys(KNOBS)) if (!(k in o)) o[k] = 1;
  return o;
}
function writeKnobs(kn) {
  const body = Object.keys(KNOBS).map((k) => k + ':' + (kn[k] ?? 1).toFixed(2)).join(', ');
  const src = readFileSync(GAME, 'utf8').replace(/const BAL=\{[^}]*\};/, 'const BAL={ ' + body + ' };');
  writeFileSync(GAME, src);
}
function bumpVersion(n) {
  writeFileSync(GAME, readFileSync(GAME, 'utf8').replace(/const GAME_VER='v\d+'/, "const GAME_VER='v" + n + "'"));
  writeFileSync(SW, readFileSync(SW, 'utf8').replace(/thronerush-v\d+/, 'thronerush-v' + n));
}
function saveState() { if (DRY) return; if (!existsSync('tuning')) mkdirSync('tuning'); writeFileSync(STATE, JSON.stringify(state, null, 2) + '\n'); }
function saveReport() { writeFileSync(REPORT, lines.join('\n') + '\n'); }
function finish(msg) { log(''); log(msg); if (!DRY) { saveState(); saveReport(); } console.log('\nSTATUS=NOCHANGE'); process.exit(0); }
