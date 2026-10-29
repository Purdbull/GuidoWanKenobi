# mancusi.at

Website von Guido Mancusi – Dirigent und Komponist.

- **Website:** statisch gebaut mit [Astro](https://astro.build), ausgeliefert über GitHub Pages
- **Notenpult:** kleine Pflege-Oberfläche für Termine, Werke und Repertoire (Cloudflare Worker, Anmeldung per E-Mail-Code)
- **Einrichtung & Domain-Umzug:** [`docs/EINRICHTUNG.md`](docs/EINRICHTUNG.md)
- **Offene inhaltliche Fragen an Guido:** [`docs/pruefliste.md`](docs/pruefliste.md)

## Aufbau

```
src/data/          termine.json · werke.json · repertoire.json  ← schreibt das Notenpult
                   hoerbeispiele.json · texte.json               ← Biografie, Impressum, Kontakt …
src/pages/         Startseite, Termine, Werke, Repertoire, Biografie, Impressum, Datenschutz, 404
src/components/    Auftakt (Taktstock + Lohengrin-Motiv), Listen, Hörbeispiele
public/            Bilder, Hörbeispiele (MP3), Schriftlizenzen
scripts/           Datenprüfung vor jedem Build, Notensatz-Generator für den Auftakt
notenpult/         Worker (src/) und Oberfläche (public/)
```

## So kommt eine Änderung online

1. Guido speichert im Notenpult.
2. Der Worker prüft die Daten (`notenpult/src/schema.js`) und schreibt sie als Commit in `src/data/`.
3. Der Workflow `.github/workflows/website.yml` prüft die Daten erneut, baut die Seite und stellt sie auf Pages – ca. 1 Minute.
4. Das Notenpult zeigt „Jetzt auf der Website zu sehen.“

Der GitHub-Token liegt ausschließlich als Secret im Worker (`wrangler secret put GITHUB_TOKEN`), nie im Browser und nie im Repo.

## Lokal

```bash
npm ci
npm run dev          # Website auf http://localhost:4321
npm run pruefen      # Daten prüfen
npm run build        # nach dist/
```

Notenpult lokal (ohne Anmeldung, funktioniert nur auf localhost):

```bash
cd notenpult
npm ci
cat > .dev.vars <<'X'
NUR_LOKAL_OHNE_ANMELDUNG=ja
GITHUB_API=http://127.0.0.1:8790
GITHUB_REPO=test/mancusi-website
GITHUB_TOKEN=nur-test
VORNAMEN=lokal@test:Guido
X
python3 test/github-attrappe.py /pfad/zu/einer/repo-kopie 8790 &   # GitHub-Attrappe
npm run dev          # http://localhost:8787
```

## Schriften

Libre Bodoni und Source Serif 4, selbst gehostet, unter der SIL Open Font License (`public/lizenzen/`).
