# THRONERUSH im Google Play Store veröffentlichen

THRONERUSH ist eine PWA. Für den Play Store wird sie als **Trusted Web Activity (TWA)**
verpackt: eine dünne Android-App, die die echte Website
`https://hannespix.github.io/thronerush/` im Vollbild (ohne Browser-Adressleiste) lädt.
Die Verpackung erzeugt **Bubblewrap** (das offizielle Google-CLI). Das fertige
Android-Projekt liegt im Ordner [`android/`](./android/).

> **Kurzfassung:** Keystore erzeugen → AAB bauen → in der Play Console hochladen →
> `assetlinks.json` mit dem Play-Fingerprint auf `hannespix.github.io` hosten → Release.

---

## 0. Voraussetzungen

- **Google-Play-Entwicklerkonto** (einmalig 25 USD, bereits vorhanden).
- **Node.js** ≥ 16 (für Bubblewrap).
- **JDK 17** und das **Android SDK** – Bubblewrap installiert beides beim ersten
  `build` automatisch (oder eigene Installation nutzen).
- Bubblewrap-CLI:
  ```bash
  npm install -g @bubblewrap/cli
  ```

Wichtige Eckdaten dieses Projekts (stehen in `android/twa-manifest.json`):

| Feld | Wert |
|---|---|
| Paketname (Application ID) | `com.thronerush.com` |
| Host | `hannespix.github.io` |
| Start-URL | `/thronerush/` |
| App-Name | THRONERUSH |
| Version | `versionName 1.0.0`, `versionCode 1` |

---

## 1. Upload-Keystore erzeugen (einmalig!)

Mit diesem Schlüssel signierst du **jede** Version. Geht er verloren, kannst du
ohne Play-App-Signing keine Updates mehr veröffentlichen → **sicher sichern**
(Passwort-Manager, Backup), **niemals committen** (per `.gitignore` ausgeschlossen).

```bash
cd android
keytool -genkeypair -v \
  -keystore android.keystore \
  -alias android \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -dname "CN=THRONERUSH, O=THRONERUSH, C=DE"
# Vergib ein starkes Store- und Key-Passwort und merke sie dir.
```

Der Keystore muss `android/android.keystore` mit Alias `android` heißen – so ist es
in `twa-manifest.json` hinterlegt.

---

## 2. App-Bundle (.aab) bauen

```bash
cd android

# Passwörter als Umgebungsvariablen, damit der Build ohne Nachfrage durchläuft:
export BUBBLEWRAP_KEYSTORE_PASSWORD='dein-store-passwort'
export BUBBLEWRAP_KEY_PASSWORD='dein-key-passwort'

bubblewrap build
```

Ergebnis:
- `app-release-bundle.aab` → **das lädst du in die Play Console hoch**
- `app-release-signed.apk` → nur zum lokalen Testen auf einem Gerät (`adb install`)

> Beim allerersten Lauf fragt Bubblewrap, ob es JDK + Android SDK herunterladen
> soll → mit „Yes" bestätigen.

**Fingerprint des Upload-Keys** (für später / optional in `assetlinks.json`):
```bash
keytool -list -v -keystore android.keystore -alias android | grep SHA256
```

---

## 3. App in der Play Console anlegen

1. [Play Console](https://play.google.com/console) → **App erstellen**.
   - Name: THRONERUSH · Sprache: Deutsch · Typ: **Spiel** · Gratis.
2. **Play App Signing** ist für neue Apps Pflicht und standardmäßig aktiv:
   Google verwaltet den finalen Signaturschlüssel, du lädst nur mit dem Upload-Key hoch.
3. Linke Navigation → **Release → Setup → App-Integrität → App-Signatur**.
   Dort findest du den **SHA-256-Fingerprint des App-Signaturschlüssels**.
   Play bietet sogar direkt einen fertigen `assetlinks.json`-Block zum Kopieren.

---

## 4. Domain-Verifizierung (`assetlinks.json`) – **der kritische Schritt**

Damit die App ohne Browser-Adressleiste startet (echte TWA statt Custom Tab), muss
unter dem **Host-Root** folgende Datei erreichbar sein:

```
https://hannespix.github.io/.well-known/assetlinks.json
```

> ⚠️ Wichtig bei GitHub Pages: Der Host ist `hannespix.github.io`, **nicht** der
> Projektpfad `/thronerush/`. Die Datei muss daher in das **separate Repo**
> `hannespix/hannespix.github.io` (deine GitHub-User-Pages), und zwar ins Wurzel-
> verzeichnis unter `.well-known/assetlinks.json`. Ein Ablegen unter
> `/thronerush/.well-known/` reicht **nicht**.

Vorgehen:
1. Repo `hannespix/hannespix.github.io` anlegen (falls nicht vorhanden) und GitHub
   Pages dafür aktivieren.
2. Datei `.well-known/assetlinks.json` anlegen. Inhalt: entweder den von der Play
   Console generierten Block, oder die Vorlage aus
   [`playstore/assetlinks.json`](./playstore/assetlinks.json) und den Platzhalter
   durch den **SHA-256 aus Schritt 3** ersetzen:

   ```json
   [{
     "relation": ["delegate_permission/common.handle_all_urls"],
     "target": {
       "namespace": "android_app",
       "package_name": "com.thronerush.com",
       "sha256_cert_fingerprints": ["<SHA256 DES PLAY-APP-SIGNING-KEYS>"]
     }
   }]
   ```
   Den Upload-Key-Fingerprint (Schritt 2) kann man als zweiten Eintrag ergänzen –
   praktisch, wenn man Test-APKs direkt installiert.
3. Prüfen, dass die Datei live ist (Content-Type sollte JSON sein):
   ```bash
   curl -s https://hannespix.github.io/.well-known/assetlinks.json
   ```

Die Verifizierung greift erst, wenn die App über den Play Store (bzw. Internal
Testing) installiert wird – eine direkt per `adb` installierte APK verifiziert nur,
wenn ihr Signatur-Fingerprint ebenfalls in `assetlinks.json` steht.

---

## 5. Store-Eintrag ausfüllen

Unter **Wachstum → Store-Präsenz → Haupt-Store-Eintrag**:

- **Kurzbeschreibung** (max. 80 Z.): z. B. „Neon-Synthwave-Arcade: ausweichen, Combos
  bauen, Highscore jagen."
- **Vollständige Beschreibung**: Texte aus [`README.md`](./README.md) wiederverwenden.
- **Grafiken** (Pflicht):
  - App-Icon 512×512 → `icons/icon-512.png` (vorhanden).
  - Feature-Grafik 1024×500 (muss noch erstellt werden).
  - Mind. 2 Smartphone-Screenshots (im laufenden Spiel aufnehmen).

Weitere Pflicht-Formulare unter **Richtlinien → App-Inhalte**:

- **Datenschutzerklärung**: URL erforderlich. THRONERUSH speichert nur lokal
  (`localStorage`) und sendet (außer optionaler, standardmäßig **deaktivierter**
  anonymer Statistik) keine personenbezogenen Daten. Eine schlichte
  Datenschutz-Seite, z. B. unter `https://hannespix.github.io/thronerush/privacy.html`.
- **Data Safety / Datensicherheit**: Da keine Daten an Server gesendet werden,
  „keine Datenerhebung" angeben (sofern die optionale Telemetrie aus bleibt).
- **Content-Rating**: Fragebogen ausfüllen (Casual-Arcade, keine Gewalt/Glücksspiel) →
  voraussichtlich USK 0/PEGI 3.
- **Zielgruppe**: Altersgruppen wählen.
- **Werbung**: enthält keine Werbung.

> **In-App-Käufe:** Die Coin-Pakete im Spiel sind aktuell deaktiviert
> („Käufe bald verfügbar"). Solange das so bleibt, sind **keine** IAP-Angaben nötig.
> Echte Käufe später erfordern Google Play Billing – die jetzige reine
> Web-Bezahl-UI ist im Play Store nicht zulässig.

---

## 6. Release

1. **Release → Tests → Interner Test**: neuen Release anlegen, `app-release-bundle.aab`
   hochladen, Tester (eigene Google-Konten) hinzufügen.
2. Über den Test-Link installieren und prüfen:
   - App startet **im Vollbild ohne Adressleiste** → assetlinks korrekt.
   - Sieht man oben eine URL-Leiste → assetlinks.json fehlt/falsch (Schritt 4).
3. Wenn alles passt: **Release → Produktion** → Release erstellen, dasselbe AAB
   (oder neuer Build) hochladen, zur Prüfung einreichen.

Die erste Prüfung durch Google dauert i. d. R. einige Stunden bis wenige Tage.

---

## 7. Updates veröffentlichen

Bei jeder neuen Version **vor dem Build** in `android/twa-manifest.json` hochzählen:

```jsonc
"appVersionName": "1.0.1",   // sichtbare Version
"appVersionCode": 2,         // MUSS bei jedem Upload steigen (Ganzzahl)
```

Dann neu generieren und bauen:
```bash
cd android
bubblewrap update    # überträgt twa-manifest.json ins Android-Projekt
bubblewrap build
```
Das neue `.aab` als neuen Production-Release hochladen.

> Reine Inhalts-Updates des Spiels (HTML/JS/CSS) brauchen **keinen** neuen
> Store-Upload – sie gehen über GitHub Pages live und erscheinen automatisch in der
> TWA, da diese die Live-Website lädt. Ein neuer AAB-Upload ist nur bei Änderungen
> an der App-Hülle nötig (Name, Icon, Version, Berechtigungen …).

---

## Troubleshooting

| Symptom | Ursache / Lösung |
|---|---|
| Adressleiste/Browser-Chrome sichtbar | `assetlinks.json` nicht unter dem **Host-Root** erreichbar oder falscher SHA-256. Schritt 4 prüfen. |
| „Upload-Key stimmt nicht" beim Upload | Anderer Keystore als beim ersten Upload. Immer denselben Upload-Key verwenden (oder in der Play Console zurücksetzen lassen). |
| `bubblewrap build` findet SDK/JDK nicht | Bubblewrap erneut starten und JDK/SDK installieren lassen, oder Pfade in `~/.bubblewrap/config.json` setzen. |
| Build schlägt fehl (TLS/Netzwerk) | Hinter Proxy: System-CA in den Java-Truststore importieren. |
