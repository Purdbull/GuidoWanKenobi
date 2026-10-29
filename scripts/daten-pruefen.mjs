// Prüft alle Datendateien mit denselben Regeln wie das Notenpult. Läuft vor jedem Build.
import fs from 'node:fs';
import { BESTAENDE, pruefen } from '../notenpult/src/schema.js';

let fehlerGesamt = 0;
for (const [art, b] of Object.entries(BESTAENDE)) {
  const daten = JSON.parse(fs.readFileSync(b.datei, 'utf8'));
  const r = pruefen(art, daten);
  if (r.ok) console.log(`✓ ${art}: ${r.eintraege.length} Einträge`);
  else { fehlerGesamt += r.fehler.length; console.error(`✗ ${art}:\n  ` + r.fehler.join('\n  ')); }
}
if (fehlerGesamt) process.exit(1);
