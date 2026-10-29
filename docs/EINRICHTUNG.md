# Einrichtung – mancusi.at

Schritt für Schritt, in dieser Reihenfolge. WordPress läuft bis zum letzten Schritt unverändert weiter.

| Teil | Wo | Kosten |
|---|---|---|
| Website | GitHub Pages (`Purdbull/GuidoWanKenobi`) | 0 € |
| Notenpult (Pflege-Oberfläche) | Cloudflare Worker `mancusi-notenpult` | 0 € |
| Anmeldung | Cloudflare Access, Code per E-Mail | 0 € (bis 50 Personen) |
| DNS, E-Mail | bleibt beim bisherigen Anbieter | unverändert |

---

## 1. GitHub Pages einschalten

1. Repo → **Settings → Pages** → *Build and deployment* → **Source: GitHub Actions**.
2. Repo → **Actions** → Workflow **Website** → **Run workflow** (oder einfach warten, bis der nächste Push kommt).
3. Nach ca. 1–2 Minuten ist die Seite unter **https://purdbull.github.io/GuidoWanKenobi/** erreichbar.

Der Workflow läuft automatisch bei jeder Änderung, jede Nacht (vergangene Termine wandern ins Archiv) und auf Knopfdruck. Vor jedem Bauen werden alle Daten geprüft – fehlerhafte Daten gehen nie online.

## 2. GitHub-Token für das Notenpult

GitHub → Profilbild → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**

- **Name:** Notenpult mancusi.at
- **Expiration:** 1 Jahr (Erinnerung in den Kalender eintragen)
- **Repository access:** *Only select repositories* → `Purdbull/GuidoWanKenobi`
- **Permissions → Repository:**
  - **Contents:** Read and write
  - **Actions:** Read-only
  - (Metadata: Read-only wird automatisch gesetzt)

Token kopieren und **nirgends speichern außer im nächsten Schritt**. Nicht ins Repo, nicht in eine Datei, nicht in den Chat.

## 3. Notenpult auf Cloudflare stellen

Auf dem Mac, im Ordner des Repos:

```bash
cd notenpult
npm ci
npx wrangler login            # öffnet den Browser, mit dem Cloudflare-Konto anmelden
npx wrangler deploy           # zeigt am Ende die Adresse: https://mancusi-notenpult.<name>.workers.dev
npx wrangler secret put GITHUB_TOKEN   # Token aus Schritt 2 einfügen, Enter
```

Ab jetzt ist das Notenpult online – **aber noch für niemanden nutzbar**: Ohne Anmeldung antwortet es nur mit „Nicht angemeldet“. Das ist Absicht.

## 4. Anmeldung einrichten (Cloudflare Access)

### Weg A – empfohlen: Access direkt am Worker

1. Cloudflare-Dashboard → **Workers & Pages** → `mancusi-notenpult` → Tab **Access**.
2. **Protect this Worker behind Access** → Umfang **All traffic**.
3. Wer sich anmelden darf: **E-Mail-Adresse** `gmancusi@icloud.com`.
   Falls dort nur „Cloudflare account“ und „Email domain“ angeboten werden: zunächst „Cloudflare account“ wählen, anwenden, dann über **Edit in Zero Trust** die Regel öffnen und unter *Include → Emails* `gmancusi@icloud.com` eintragen (die Konto-Regel danach entfernen oder für dich behalten).
4. **Apply Access**.
5. Beim ersten Mal fragt Cloudflare nach einem Namen für das „Zero Trust“-Team und dem Tarif → **Free** wählen.
6. Unter **Zero Trust → Settings → Authentication** prüfen, dass **One-time PIN** als Anmeldemethode aktiv ist.

In `wrangler.jsonc` muss bei Weg A nichts geändert werden.

### Weg B – falls der Access-Tab fehlt: klassische Access-Anwendung

1. **Zero Trust → Access → Applications → Add an application → Self-hosted**.
2. Domain: `mancusi-notenpult.<name>.workers.dev`, Policy *Allow* → *Include → Emails* → `gmancusi@icloud.com`, Login-Methode **One-time PIN**.
3. In der Anwendung den **Application Audience (AUD) Tag** kopieren, unter **Zero Trust → Settings → Custom Pages** die **Team domain** (`<team>.cloudflareaccess.com`) ablesen.
4. Beides in `notenpult/wrangler.jsonc` eintragen (`ACCESS_TEAM_DOMAIN` mit `https://` davor, `ACCESS_AUD`), dann `npx wrangler deploy`.

### Doppelte Absicherung

Der Worker prüft selbst noch einmal, ob die angemeldete Adresse in `ERLAUBTE_EMAILS` steht. Wer zusätzlich Zugang braucht (z. B. du), muss an **beiden** Stellen eingetragen werden: in der Access-Regel und in `ERLAUBTE_EMAILS` (kommagetrennt), danach `npx wrangler deploy`. Anzeigename für die Begrüßung: `VORNAMEN`, Format `adresse:Name,adresse:Name`.

## 5. Ausprobieren

1. Notenpult-Adresse öffnen → E-Mail eingeben → Code aus dem Postfach eingeben.
2. Einen Test-Termin anlegen → oben erscheint „Wird veröffentlicht …“ → nach ca. 1 Minute „Jetzt auf der Website zu sehen.“
3. Auf **https://purdbull.github.io/GuidoWanKenobi/termine/** nachsehen, dann den Test-Termin wieder löschen.
4. Auf dem iPhone ebenso, und dort **Teilen → Zum Home-Bildschirm** – dann hat Guido das Notenpult als App-Symbol.

Jede Änderung ist ein Commit im Repo („Termin hinzugefügt … (Notenpult, gmancusi@icloud.com)“). Alles ist damit jederzeit nachvollziehbar und zurückholbar.

## 6. Domain umstellen (erst wenn Guido zufrieden ist)

Am Tag vorher beim DNS-Anbieter die TTL der Einträge `mancusi.at` und `www` auf 300 Sekunden senken.

1. **Domain bei GitHub bestätigen:** GitHub → Profil-Settings → **Pages → Add a domain** → `mancusi.at` → GitHub nennt einen TXT-Eintrag (`_github-pages-challenge-Purdbull`) → beim DNS-Anbieter anlegen → **Verify**.
2. **Beim DNS-Anbieter** (nur diese Einträge ändern, alles andere – vor allem **MX** und alle E-Mail-Einträge wie SPF/DKIM – bleibt unberührt):

   | Name | Typ | Wert |
   |---|---|---|
   | `@` (mancusi.at) | A | `185.199.108.153` |
   | `@` | A | `185.199.109.153` |
   | `@` | A | `185.199.110.153` |
   | `@` | A | `185.199.111.153` |
   | `@` | AAAA | `2606:50c0:8000::153` |
   | `@` | AAAA | `2606:50c0:8001::153` |
   | `@` | AAAA | `2606:50c0:8002::153` |
   | `@` | AAAA | `2606:50c0:8003::153` |
   | `www` | CNAME | `purdbull.github.io` |

   Bisherige A-/AAAA-Einträge für `@` und `www`, die auf den WordPress-Server zeigen, entfernen.
3. Repo → **Settings → Pages → Custom domain:** `mancusi.at` → **Save**. Sobald das Zertifikat da ist (meist unter einer Stunde): **Enforce HTTPS** anhaken. `www.mancusi.at` leitet automatisch auf `mancusi.at` um.
4. Workflow **Website** einmal per **Run workflow** starten – Adressen und Vorschaubilder stellen sich dabei von selbst auf `https://mancusi.at` um.
5. In `notenpult/wrangler.jsonc` `WEBSITE_URL` auf `https://mancusi.at/` setzen → `npx wrangler deploy`.
6. Prüfen: Startseite, Unterseiten, Hörbeispiele, Impressum, eine Test-Mail an office@mancusi.at.
7. **Erst danach** WordPress-Hosting kündigen. Vorher ein vollständiges Backup (Dateien + Datenbank) ziehen.

Alte WordPress-Adressen (`/termine-2/`, `/?p=123` …) führen danach auf die eigene 404-Seite „Generalpause“, die auf alle Bereiche verlinkt.

## 7. Laufender Betrieb

- **Token läuft ab:** neuen Token wie in Schritt 2 erzeugen, `npx wrangler secret put GITHUB_TOKEN`. Bis dahin zeigt das Notenpult beim Laden einen Fehler – die Website selbst läuft weiter.
- **Nächtlicher Lauf:** GitHub schaltet geplante Läufe in öffentlichen Repos nach 60 Tagen ohne jede Änderung ab. Dann im Tab **Actions** wieder aktivieren (GitHub schickt vorher eine Mail).
- **Etwas kaputt gespeichert?** Im Repo unter *History* der Datei `src/data/…json` die alte Fassung wiederherstellen – oder einfach im Notenpult korrigieren.
- **Lokal entwickeln:** `npm ci && npm run dev` (Website), `cd notenpult && npm run dev` (Notenpult ohne Anmeldung, nur auf localhost; dafür eine `notenpult/.dev.vars` anlegen, siehe README).
