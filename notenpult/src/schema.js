// Regeln für die drei Datenbestände, die Guido pflegt.
// Wird vom Notenpult-Dienst (vor jedem Speichern) UND vom Website-Build (vor jedem Bauen) verwendet.

export const WERK_KATEGORIEN = [
  'Bühnenwerke', 'Chor und Orchesterwerke', 'Chormusik', 'Kammermusik', 'Orchestermusik',
  'Filmmusik', 'Lieder', 'Schulmusik', 'Bearbeitungen',
];
export const REPERTOIRE_KATEGORIEN = ['Opern', 'Operetten', 'Musicals', 'Ballette', 'Konzerte und Kirchenmusik'];

export const BESTAENDE = {
  termine: {
    datei: 'src/data/termine.json',
    felder: {
      von: { pflicht: true, typ: 'datum' },
      bis: { typ: 'datum' },
      zeit: { typ: 'zeit' },
      titel: { pflicht: true, max: 200 },
      ort: { max: 200 },
      mit: { max: 200 },
      programm: { max: 400 },
    },
    praefix: 't',
  },
  werke: {
    datei: 'src/data/werke.json',
    felder: {
      jahr: { pflicht: true, max: 30, muster: /^\d{4}[\d\s/–().,a-z-]*$/ },
      titel: { pflicht: true, max: 300 },
      text: { max: 400 },
      kat: { pflicht: true, liste: WERK_KATEGORIEN },
    },
    praefix: 'w',
  },
  repertoire: {
    datei: 'src/data/repertoire.json',
    felder: {
      komponist: { pflicht: true, max: 120 },
      werk: { pflicht: true, max: 300 },
      kat: { pflicht: true, liste: REPERTOIRE_KATEGORIEN },
      notiz: { max: 300 },
    },
    praefix: 'r',
  },
};

const MAX_EINTRAEGE = 2000;
const ID = /^[a-z][a-z0-9-]{0,40}$/;
const DATUM = /^\d{4}-\d{2}-\d{2}$/;
const ZEIT = /^([01]\d|2[0-3]):[0-5]\d$/;

function gueltigesDatum(s) {
  if (!DATUM.test(s)) return false;
  const [j, m, t] = s.split('-').map(Number);
  const d = new Date(Date.UTC(j, m - 1, t));
  return d.getUTCFullYear() === j && d.getUTCMonth() === m - 1 && d.getUTCDate() === t && j >= 1950 && j <= 2100;
}

/** Bereinigt und prüft eine Liste. Liefert { ok: true, eintraege } oder { ok: false, fehler: [...] }. */
export function pruefen(art, roh) {
  const bestand = BESTAENDE[art];
  if (!bestand) return { ok: false, fehler: ['Unbekannter Bereich.'] };
  if (!Array.isArray(roh)) return { ok: false, fehler: ['Liste erwartet.'] };
  if (roh.length > MAX_EINTRAEGE) return { ok: false, fehler: ['Zu viele Einträge.'] };

  const fehler = [];
  const ids = new Set();
  const eintraege = roh.map((e, i) => {
    const nr = i + 1;
    if (!e || typeof e !== 'object' || Array.isArray(e)) { fehler.push(`Eintrag ${nr}: ungültig.`); return null; }
    const id = String(e.id || '');
    if (!ID.test(id)) fehler.push(`Eintrag ${nr}: ungültige Kennung.`);
    if (ids.has(id)) fehler.push(`Eintrag ${nr}: Kennung doppelt.`);
    ids.add(id);
    const sauber = { id };
    for (const [feld, regel] of Object.entries(bestand.felder)) {
      let wert = e[feld];
      if (wert === undefined || wert === null) wert = '';
      if (typeof wert !== 'string') { fehler.push(`Eintrag ${nr}: „${feld}“ muss Text sein.`); continue; }
      // Steuerzeichen entfernen, Leerraum glätten
      wert = wert.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/\s+/g, ' ').trim();
      if (regel.pflicht && !wert) fehler.push(`Eintrag ${nr}: „${feld}“ fehlt.`);
      if (wert && regel.max && wert.length > regel.max) fehler.push(`Eintrag ${nr}: „${feld}“ ist zu lang.`);
      if (wert && regel.typ === 'datum' && !gueltigesDatum(wert)) fehler.push(`Eintrag ${nr}: „${feld}“ ist kein gültiges Datum.`);
      if (wert && regel.typ === 'zeit' && !ZEIT.test(wert)) fehler.push(`Eintrag ${nr}: „${feld}“ ist keine gültige Uhrzeit.`);
      if (wert && regel.liste && !regel.liste.includes(wert)) fehler.push(`Eintrag ${nr}: „${feld}“ hat einen unbekannten Wert.`);
      if (wert && regel.muster && !regel.muster.test(wert)) fehler.push(`Eintrag ${nr}: „${feld}“ hat ein ungültiges Format.`);
      sauber[feld] = wert;
    }
    if (art === 'termine' && sauber.bis && sauber.von && sauber.bis < sauber.von) fehler.push(`Eintrag ${nr}: Ende liegt vor dem Beginn.`);
    if (art === 'termine' && sauber.bis === sauber.von) sauber.bis = '';
    return sauber;
  });
  if (fehler.length) return { ok: false, fehler: fehler.slice(0, 20) };
  if (art === 'termine') {
    eintraege.sort((a, b) => (a.von < b.von ? -1 : a.von > b.von ? 1 : (a.zeit || '') < (b.zeit || '') ? -1 : 1));
  }
  return { ok: true, eintraege };
}

/** So landet eine Liste als Datei im Repo (stabil, gut lesbar in der Versionsgeschichte). */
export function alsDatei(eintraege) {
  return JSON.stringify(eintraege, null, 2) + '\n';
}
