#!/usr/bin/env node
/**
 * THRONERUSH – Telemetrie → STATS.md
 *
 * Holt die Aggregate vom Telemetrie-Worker (/stats) und rendert eine
 * lesbare Markdown-Übersicht. So bekommst du die "in MD"-Ansicht,
 * ohne eine Live-MD-Datei mit Schreib-Races zu pflegen.
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
const lines = [];
lines.push('# THRONERUSH – Telemetrie-Auswertung');
lines.push('');
lines.push('_Automatisch generiert: ' + new Date().toISOString() + '_');
lines.push('');
lines.push('## Gesamt');
lines.push('');
lines.push('| Kennzahl | Wert |');
lines.push('|---|---|');
lines.push('| Runs | ' + (t.runs || 0) + ' |');
lines.push('| Siege | ' + (t.wins || 0) + ' (' + pct(t.wins || 0, t.runs || 0) + ') |');
lines.push('| Ø Level | ' + round(t.avgLvl) + ' |');
lines.push('| Ø Dauer | ' + round(t.avgDurS, 0) + ' s |');
lines.push('| Höchster Score | ' + (t.maxScore || 0) + ' |');
lines.push('');

lines.push('## Nach Modus & Schwierigkeit');
lines.push('');
lines.push('| Modus | Diff | Runs | Siege | Winrate | Ø Level |');
lines.push('|---|---|---|---|---|---|');
for (const r of data.byMode || []) {
  lines.push('| ' + r.mode + ' | ' + r.diff + ' | ' + r.runs + ' | ' + (r.wins || 0) +
    ' | ' + pct(r.wins || 0, r.runs) + ' | ' + round(r.avgLvl) + ' |');
}
lines.push('');

lines.push('## Beliebteste Waffen');
lines.push('');
lines.push('| Waffe | Picks |');
lines.push('|---|---|');
for (const w of data.weapons || []) lines.push('| ' + w.weapon + ' | ' + w.picks + ' |');
lines.push('');

lines.push('## Genutzte Synergien');
lines.push('');
lines.push('| Synergie | Nutzungen |');
lines.push('|---|---|');
for (const s of data.synergies || []) lines.push('| ' + s.synergy + ' | ' + s.uses + ' |');
lines.push('');

writeFileSync(out, lines.join('\n'));
console.log('✓ ' + out + ' geschrieben (' + (t.runs || 0) + ' Runs ausgewertet).');
