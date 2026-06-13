#!/usr/bin/env node
/**
 * THRONERUSH – Telemetrie → STATS.md
 *
 * Holt die Aggregate vom Telemetrie-Worker (/stats) und rendert eine
 * lesbare Markdown-Übersicht mit Balancing-KPIs.
 *
 * Nutzung:
 *   TELEMETRY_BASE="https://thronerush-telemetry.<acc>.workers.dev" \
 *   ADMIN_TOKEN="dein-token" \
 *   npm run stats
 *
 * Oder als Argumente:  node tools/render-stats.mjs <base-url> <token> [out.md]
 */

import { writeFileSync } from 'node:fs';

const base = process.argv[2] || process.env.TELEMETRY_BASE || '';
const token = process.argv[3] || process.env.ADMIN_TOKEN || '';
const out = process.argv[4] || 'STATS.md';

if (!base || !token) {
  console.error('Fehlt: Worker-URL und/oder ADMIN_TOKEN.\n' +
    'Beispiel: TELEMETRY_BASE="https://…workers.dev" ADMIN_TOKEN="…" npm run stats');
  process.exit(1);
}

const pct = (a, b) => (b ? ((100 * a) / b).toFixed(1) + '%' : '–');
const round = (n, d = 1) => (n == null ? '–' : Number(n).toFixed(d));
const fmtDur = (s) => {
  s = Math.round(s || 0);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
};

const url = base.replace(/\/+$/, '') + '/stats?token=' + encodeURIComponent(token);
const res = await fetch(url);
if (!res.ok) {
  console.error('Worker antwortete mit HTTP ' + res.status + ' – Token/URL prüfen.');
  process.exit(1);
}
const data = await res.json();
if (!data || !data.ok) {
  console.error('Unerwartete Antwort: ' + JSON.stringify(data).slice(0, 200));
  process.exit(1);
}

const t = data.totals || {};
const L = [];
const h2 = (s) => { L.push('', '## ' + s, ''); };

L.push('# THRONERUSH – Telemetrie-Auswertung');
L.push('');
L.push('_Automatisch generiert: ' + new Date().toISOString() + '_');

// ---- Gesamt ----
h2('Überblick');
L.push('| Kennzahl | Wert |');
L.push('|---|---|');
L.push('| Runs | ' + (t.runs || 0) + ' |');
L.push('| Spieler (anonym) | ' + (t.players || 0) + ' |');
L.push('| Wiederkehrend (≥2 Tage) | ' + (data.returning || 0) + ' · ' + pct(data.returning || 0, t.players || 0) + ' |');
L.push('| Siege | ' + (t.wins || 0) + ' · ' + pct(t.wins || 0, t.runs || 0) + ' |');
L.push('| Ø Level | ' + round(t.avgLvl) + ' |');
L.push('| Ø Run-Dauer | ' + round(t.avgDurS, 0) + ' s |');
L.push('| Gesamtspielzeit | ' + fmtDur(t.totalDurS) + ' |');
L.push('| Höchster Score | ' + (t.maxScore || 0) + ' |');

// ---- Ökonomie ----
h2('💰 Ökonomie');
L.push('| Kennzahl | Wert | Lesart |');
L.push('|---|---|---|');
L.push('| Coins / Minute | ' + round(t.coinsPerMin, 0) + ' | Verdienstrate |');
L.push('| Ø Endguthaben (Chips) | ' + round(t.avgChipsBal, 0) + ' | hoch = zu billig/horten · ~0 = ausgehungert |');
L.push('| Ø ungenutzte Skillpunkte | ' + round(t.avgSpLeft) + ' | hoch = Belohnung verpufft |');
L.push('| Ø Upgrades / Run | ' + round(t.avgRunUp) + ' | wird investiert? |');
L.push('| Revive-Rate | ' + pct((t.reviveRate || 0) * (t.runs || 0), t.runs || 0) + ' | wie oft „unbedingt weiter" |');

// ---- Passivität / Camping ----
h2('🛌 Passivität — zu leicht?');
L.push('| Kennzahl | Wert | Lesart |');
L.push('|---|---|---|');
L.push('| Ø längste Idle-Strecke | ' + round(t.avgIdleMax) + ' s | so lange überlebt man im Schnitt ohne Eingabe |');
L.push('| Max Idle-Strecke | ' + round(t.maxIdleMax) + ' s | Rekord: so lange ging „Hände weg" |');
L.push('| Ø Idle-Anteil | ' + round(t.avgIdlePct) + ' % | wie viel einer Runde passiv läuft |');
L.push('| Ø längste Idle bei **Siegen** | ' + round(t.avgIdleMaxWon) + ' s | hoch = man gewinnt ohne zu spielen |');
L.push('| Camp-Siege (≥10 s idle) | ' + (t.campWins || 0) + ' · ' + pct(t.campWins || 0, t.wins || 0) + ' der Siege | „unten campen & trotzdem gewinnen" |');
L.push('');
L.push('_Hohe Werte (v. a. bei Siegen) = OP-Builds/zu wenig Druck → Schwierigkeit oder Waffen anziehen._');

// ---- Funnel (Level) ----
h2('📉 Level-Funnel (wo enden Runs?)');
const fn = data.funnel || [];
const totalRuns = fn.reduce((a, r) => a + (r.n || 0), 0) || (t.runs || 0);
const maxLvl = fn.reduce((m, r) => Math.max(m, r.lvl || 0), 0);
L.push('| Level | endeten hier | erreichten (≥) |');
L.push('|---|---|---|');
for (let lv = 1; lv <= maxLvl; lv++) {
  const here = fn.filter((r) => r.lvl === lv).reduce((a, r) => a + r.n, 0);
  const reached = fn.filter((r) => r.lvl >= lv).reduce((a, r) => a + r.n, 0);
  L.push('| ' + lv + ' | ' + here + ' | ' + reached + ' · ' + pct(reached, totalRuns) + ' |');
}
L.push('');
L.push('_Ein steiler Abfall zwischen zwei Leveln = Schwierigkeits-Wand._');

// ---- Boss-Funnel ----
h2('👾 Boss-Funnel & Win-Rate');
L.push('| Boss erreicht | Runs | Siege | Winrate |');
L.push('|---|---|---|---|');
for (const b of data.bossFunnel || []) {
  L.push('| ' + b.boss + ' | ' + b.runs + ' | ' + (b.wins || 0) + ' | ' + pct(b.wins || 0, b.runs) + ' |');
}

// ---- Todesursachen ----
h2('💀 Todesursachen (verlorene Runs)');
const deaths = data.deaths || [];
const deathTotal = deaths.reduce((a, d) => a + (d.n || 0), 0);
L.push('| Ursache | Tode | Anteil |');
L.push('|---|---|---|');
for (const d of deaths) L.push('| `' + d.death + '` | ' + d.n + ' | ' + pct(d.n, deathTotal) + ' |');
L.push('');
L.push('_`obs:*` = Hindernis-Bewegungsmuster · `laser`/`bullet` = Boss · `boss:*` = während Boss-Kampf · `elite` = Panzer-Gegner._');

// ---- Modus/Diff ----
h2('Nach Modus & Schwierigkeit');
L.push('| Modus | Diff | Runs | Siege | Winrate | Ø Level |');
L.push('|---|---|---|---|---|---|');
for (const r of data.byMode || []) {
  L.push('| ' + r.mode + ' | ' + r.diff + ' | ' + r.runs + ' | ' + (r.wins || 0) +
    ' | ' + pct(r.wins || 0, r.runs) + ' | ' + round(r.avgLvl) + ' |');
}

// ---- Build-Balance ----
const balTable = (title, rows, nameKey, pickKey) => {
  h2(title);
  L.push('| Name | Picks | Siege | Winrate |');
  L.push('|---|---|---|---|');
  for (const r of rows || []) {
    L.push('| ' + r[nameKey] + ' | ' + (r[pickKey] || 0) + ' | ' + (r.wins || 0) + ' | ' + pct(r.wins || 0, r[pickKey] || 0) + ' |');
  }
};
balTable('🔫 Waffen (Pick × Win)', data.weapons, 'weapon', 'picks');
balTable('✨ Synergien (Pick × Win)', data.synergies, 'synergy', 'uses');
balTable('⬆️ Upgrades (Pick × Win)', data.upgrades, 'upgrade', 'picks');
L.push('');
L.push('_Hohe Pick- **und** Win-Rate = evtl. zu stark · niedrige Pick- und Win-Rate = zu schwach._');

writeFileSync(out, L.join('\n') + '\n');
console.log('✓ ' + out + ' geschrieben (' + (t.runs || 0) + ' Runs · ' + (t.players || 0) + ' Spieler).');
