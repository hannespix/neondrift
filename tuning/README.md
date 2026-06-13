# 🎚️ Auto-Balance (Game-Director)

Datengetriebenes, **voll-automatisches** Balancing. Einmal pro Tag liest der Director
(`tools/auto-balance.mjs`, via Workflow `.github/workflows/auto-balance.yml`) die
Telemetrie, bewertet die aktuelle Spielversion mit einem **ausgewogenen Health-Score**
und justiert bei Bedarf die Balancing-Knöpfe – dann Version-Bump + Pages-Deploy.

## Die Knöpfe (in `js/game.js`, Block `=== AUTO-BALANCE ===`)
| Knopf | Wirkung | Bereich |
|---|---|---|
| `difficulty` | globales Tempo/Anspruch (× auf `difficulty`) | 0.70–1.40 |
| `spawnRate` | Hindernis-Dichte (>1 = dichter) | 0.70–1.40 |
| `eliteChance` | Häufigkeit der Panzer-/Elite-Gegner | 0.60–1.60 |

`1.00` = neutral. **Nur Werte** werden automatisch geändert, nie Logik.

## Health-Score (ausgewogener Mix, 0–100)
`0.30·Win-Rate-Korridor + 0.25·Sessionlänge + 0.20·Anti-Camping + 0.15·Retention + 0.10·Todesursachen-Balance`.
Verhindert, dass eine Kennzahl auf Kosten anderer „geschönt" wird.

## Leitplanken
- **MIN_RUNS** (Default 40): keine Änderung, solange die aktuelle Version zu wenige Runs hat.
- **SOAK_HOURS** (Default 18): frische Version muss erst einwirken → kein 180°-Schwenk pro Tag.
- **Schrittweite** sinkt mit jeder getunten Version (anfangs grob, später Feintuning); max. **ein Schritt pro Knopf pro Tag**.
- **Revert-bei-Regression**: verschlechtert eine Änderung den Score, wird sie teilweise zurückgenommen.
- **node --check-Gate**: kaputte Syntax wird nie deployt.

## Justieren / Stoppen
- Schwellen ändern: Repo → Settings → Variables → `AB_MIN_RUNS`, `AB_SOAK_HOURS`.
- **Not-Aus:** leere Datei `tuning/AUTOPILOT_OFF` anlegen & committen → Loop pausiert sofort.
- Manuell testen: Workflow „Auto-Balance (täglich)" → *Run workflow* → `dry_run` ankreuzen (rechnet, schreibt nichts).

## Bei großen Updates
Neue Mechaniken → neue Telemetrie-KPIs (Feld in `runRecord` + Migration) und ggf. neuen
Knopf in den `BAL`-Block + `KNOBS` in `auto-balance.mjs` aufnehmen, damit der Director
das Neue mitsteuern kann.

`state.json` = Verlauf (Version → Knöpfe → Score) als Gedächtnis des Hill-Climbers.
