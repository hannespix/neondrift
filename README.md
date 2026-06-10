# 🚽 THRONERUSH

Ein süchtig machendes Neon-Synthwave-Arcade-Spiel im Browser – mit prozeduraler Chiptune-Musik, Level-System, Boss-Wellen, Roguelite-Upgrades und Power-Ups. Reines Vanilla JS, kein Build, installierbar als PWA auf Android & iOS.

![Modus](https://img.shields.io/badge/Modi-Normal%20%C2%B7%20Hardcore%20%C2%B7%20Zen-ff2e88) ![PWA](https://img.shields.io/badge/PWA-installierbar-19f0ff) ![Stack](https://img.shields.io/badge/Stack-Vanilla%20JS%20%C2%B7%20Canvas%20%C2%B7%20WebAudio-ffe600)

## Spielprinzip

Steuere per **Maus oder Finger** deinen leuchtenden Kern. Weiche Hindernissen aus, sammle Orbs und baue über knappe Vorbeiflüge („Near-Misses") deine Combo auf. Drei Modi:

- **Normal** – Levels, neue Hindernis-Formen, Boss-Wellen, Upgrade-Karten & Power-Ups.
- **Hardcore** – keine Orbs, brutal schnell, Punkte nur über Near-Misses & Bosse.
- **Zen** – kein Tod, ein Treffer kostet nur die Combo.

## Features

- 🎵 **Drei prozedurale Chiptune-Songs** mit Riser-Übergängen, rotieren mit den Levels
- 📈 **Level-System** mit je neuer Hindernis-Form (Sinus, Bogen, Orbit, Zickzack, Pendel) und wechselndem Hintergrund-Theme
- 🃏 **Roguelite-Upgrade-Karten** (stapelbar, je Build eigene Runde)
- 🎁 **Power-Ups**: Schild, Slow-Mo, Magnet, Bombe, Punkte ✕2
- ❤️ **Herzensystem** (3 Leben, Extra-Herz als Upgrade)
- 👾 **Boss-Wellen** mit telegrafierten Lasern
- 🔥 Floating-Feedback, Screenshake, Vibration (Android), schwarzhumorige Game-Over-Sprüche
- 📲 **PWA**: offline-fähig, Vollbild, persistenter Highscore

## Spielen

Online (nach Deployment): siehe GitHub-Pages-URL des Repos. Lokal:

```bash
npm run dev      # http://localhost:8000
# oder
python3 -m http.server 8000
```

> PWAs brauchen einen Server – ein simples Öffnen der `index.html` per Doppelklick aktiviert weder Service Worker noch Installation.

## Als App installieren

- **Android (Chrome):** Seite über HTTPS öffnen → „📲 App installieren" im Startmenü oder Chrome-Menü → „App installieren".
- **iOS (Safari):** Teilen → „Zum Home-Bildschirm". (Hinweis: Vibration ist auf iOS systemseitig nicht verfügbar.)

### Google Play Store

THRONERUSH lässt sich als **Trusted Web Activity (TWA)** in den Play Store bringen. Das fertige Android-Projekt liegt unter [`android/`](./android/), die komplette Schritt-für-Schritt-Anleitung (Keystore, Build, `assetlinks.json`, Store-Eintrag, Release) steht in **[PLAYSTORE.md](./PLAYSTORE.md)**.

## Projektstruktur

```
index.html              HTML-Gerüst + PWA-Meta-Tags
css/style.css           Styling
js/game.js              Spiellogik (eine IIFE)
js/pwa.js               PWA-Integration
service-worker.js       Offline-Cache
manifest.webmanifest    PWA-Manifest
icons/                  App-Icons
CLAUDE.md               Architektur & Hinweise für die Weiterentwicklung
```

## Entwicklung

Architektur, „Wo ändere ich was?" und Konventionen stehen in **[CLAUDE.md](./CLAUDE.md)**. Kurz:

- Vanilla JS, keine ES-Module, kein Bundler.
- UI-Sprache ist Deutsch.
- Nach JS-Änderungen: `node --check js/game.js`.
- Bei neuen Assets die Asset-Liste **und** Cache-Version in `service-worker.js` aktualisieren.

## Deployment

Ein GitHub-Actions-Workflow (`.github/workflows/deploy.yml`) veröffentlicht das Repo automatisch auf **GitHub Pages** (push auf `main`). In den Repo-Einstellungen unter *Pages* als Quelle „GitHub Actions" wählen. Alternativ jeden statischen Host nutzen (z. B. eigener Server) – alle Pfade sind relativ.

## Lizenz

MIT – siehe [LICENSE](./LICENSE).
