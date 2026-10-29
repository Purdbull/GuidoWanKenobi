// Gemeinsame Daten und Hilfsfunktionen für alle Seiten.
// Die JSON-Dateien in src/data/ pflegt Guido über das Notenpult.
import termineRoh from '../data/termine.json';
import werkeRoh from '../data/werke.json';
import repertoireRoh from '../data/repertoire.json';
import hoerbeispiele from '../data/hoerbeispiele.json';
import texte from '../data/texte.json';
import { LEBENSDATEN, kurzname } from './komponisten.js';

export { hoerbeispiele, texte };

export const WERK_KATEGORIEN = [
  'Bühnenwerke', 'Chor und Orchesterwerke', 'Chormusik', 'Kammermusik', 'Orchestermusik',
  'Filmmusik', 'Lieder', 'Schulmusik', 'Bearbeitungen',
];
export const REPERTOIRE_KATEGORIEN = ['Opern', 'Operetten', 'Musicals', 'Ballette', 'Konzerte und Kirchenmusik'];

const NB = ' ';
const MONATE = ['Jänner', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const MONATE_KURZ = ['Jän', 'Feb', 'März', 'Apr', 'Mai', 'Juni', 'Juli', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

/** Heute als JJJJ-MM-TT in Wiener Zeit (Build läuft in UTC). */
export function heute() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Vienna' }).format(new Date());
}

/** Datum für die Anzeige: großer Tag, kleiner Monat/Jahr und eine lange Zeile. */
export function datum(von, bis) {
  const a = (von || '').split('-').map(Number);
  if (a.length < 3 || !a[0]) return { gross: '–', klein: 'Datum folgt', lang: 'Datum folgt' };
  if (!bis || bis === von) {
    return { gross: `${a[2]}.`, klein: `${MONATE[a[1] - 1]} ${a[0]}`, lang: `${a[2]}.${NB}${MONATE[a[1] - 1]} ${a[0]}` };
  }
  const b = bis.split('-').map(Number);
  const gross = `${a[2]}.–${b[2]}.`;
  if (a[0] === b[0] && a[1] === b[1]) {
    return { gross, klein: `${MONATE[a[1] - 1]} ${a[0]}`, lang: `${a[2]}.–${b[2]}.${NB}${MONATE[a[1] - 1]} ${a[0]}` };
  }
  if (a[0] === b[0]) {
    return { gross, klein: `${MONATE[a[1] - 1]} – ${MONATE[b[1] - 1]} ${a[0]}`, lang: `${a[2]}.${NB}${MONATE[a[1] - 1]} – ${b[2]}.${NB}${MONATE[b[1] - 1]} ${a[0]}` };
  }
  return {
    gross,
    klein: `${MONATE_KURZ[a[1] - 1]} ${a[0]} – ${MONATE_KURZ[b[1] - 1]} ${b[0]}`,
    lang: `${a[2]}.${NB}${MONATE[a[1] - 1]}${NB}${a[0]} – ${b[2]}.${NB}${MONATE[b[1] - 1]}${NB}${b[0]}`,
  };
}

/** Ort, Ensemble und Uhrzeit in eine Zeile. */
export function terminZeile(t) {
  const teile = [t.ort, t.mit].filter((x) => x && String(x).trim());
  if (t.zeit) teile.unshift(`${t.zeit}${NB}Uhr`);
  return teile.join(' · ');
}

export function ende(t) { return t.bis || t.von; }

const nachDatum = (a, b) => (a.von < b.von ? -1 : a.von > b.von ? 1 : (a.zeit || '') < (b.zeit || '') ? -1 : 1);
export const termine = [...termineRoh].filter((t) => t && t.von).sort(nachDatum);

export function kommendeTermine(stichtag = heute()) {
  return termine.filter((t) => ende(t) >= stichtag);
}
export function vergangeneTermine(stichtag = heute()) {
  return termine.filter((t) => ende(t) < stichtag).reverse();
}

/** Für JavaScript auf der Seite: kompakte Termine, um nach dem Build Vergangenes auszublenden. */
export function termineFuerClient(liste) {
  return liste.map((t) => ({ e: ende(t), d: datum(t.von, t.bis).lang, t: t.titel, z: terminZeile(t) }));
}

function jahrZahl(j) {
  const m = String(j || '').match(/\d{4}/g);
  return m ? Number(m[m.length - 1]) : 0;
}
export const werke = werkeRoh.map((w, i) => ({ ...w, _i: i }));
export function werkeNeuesteZuerst(liste = werke) {
  return [...liste].sort((a, b) => jahrZahl(b.jahr) - jahrZahl(a.jahr) || a._i - b._i);
}
export function werkeNachKategorie() {
  return WERK_KATEGORIEN.map((kat) => ({
    kat,
    werke: werke.filter((w) => w.kat === kat).sort((a, b) => jahrZahl(a.jahr) - jahrZahl(b.jahr) || a._i - b._i),
  })).filter((g) => g.werke.length);
}

export const repertoire = repertoireRoh;
/** Repertoire je Kategorie, darin je Komponist (Reihenfolge wie eingetragen). */
export function repertoireNachKategorie() {
  return REPERTOIRE_KATEGORIEN.map((kat) => {
    const eintraege = repertoire.filter((r) => r.kat === kat);
    const komponisten = [];
    for (const r of eintraege) {
      let k = komponisten.find((x) => x.name === r.komponist);
      if (!k) { k = { name: r.komponist, werke: [] }; komponisten.push(k); }
      k.werke.push(r);
    }
    return { kat, komponisten };
  }).filter((g) => g.komponisten.length);
}
export function repertoireKurz(kat) {
  const namen = [...new Set(repertoire.filter((r) => r.kat === kat).map((r) => r.komponist.split(' ').pop()))];
  return namen;
}

export function url(pfad = '') {
  const basis = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${basis}/${pfad.replace(/^\//, '')}`;
}

// ---------- Repertoire: Kennzahlen, Zeitstrahl, Plakat ----------

/** Kennzahlen für den Kopf der Repertoire-Seite. */
export function repertoireZahlen() {
  const namen = [...new Set(repertoire.map((r) => r.komponist))];
  const jahre = namen.map((n) => LEBENSDATEN[n]?.[0]).filter(Boolean);
  const aeltester = namen.find((n) => LEBENSDATEN[n]?.[0] === Math.min(...jahre));
  const jetzt = Number(heute().slice(0, 4));
  return {
    werke: repertoire.length,
    komponisten: namen.length,
    gattungen: new Set(repertoire.map((r) => r.kat)).size,
    jahre: jahre.length ? jetzt - Math.min(...jahre) : 0,
    aeltester: aeltester ? { name: kurzname(aeltester), jahr: LEBENSDATEN[aeltester][0] } : null,
  };
}

/** Hauptwerke für das Plakat auf der Startseite – erscheinen nur, solange sie im Repertoire stehen. */
const PLAKAT = [
  ['Die Zauberflöte', 3], ['Carmen', 2], ['La Traviata', 1], ['Die Fledermaus', 3], ['Tosca', 2],
  ['My Fair Lady', 1], ['Der Nussknacker', 2], ['Le Nozze di Figaro', 1], ['Die Lustige Witwe', 2],
  ['Aida', 3], ['Cabaret', 1], ['La Bohème', 2], ['Lohengrin', 1], ['Requiem', 1, 'Wolfgang Amadeus Mozart'],
  ['Il Barbiere di Siviglia', 2], ['Romeo und Julia', 1], ['Wiener Blut', 2], ['Elisabeth', 1],
  ['Die Schöpfung', 1], ['Madama Butterfly', 2], ['Gräfin Mariza', 1], ['Don Giovanni', 2],
];
export function plakat() {
  return PLAKAT.map(([titel, groesse, komponist]) => {
    const r = repertoire.find((x) => x.werk === titel && (!komponist || x.komponist === komponist));
    return r ? { titel: r.werk, groesse, komponist: kurzname(r.komponist) } : null;
  }).filter(Boolean);
}

// ---------- Termine: Wochentag, Monate, Chronik, Kalenderdatei ----------

const WOCHENTAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
export function wochentag(iso) {
  const [j, m, t] = String(iso || '').split('-').map(Number);
  if (!j || !m || !t) return '';
  return WOCHENTAGE[new Date(Date.UTC(j, m - 1, t)).getUTCDay()];
}
export function monatsname(iso) {
  const [j, m] = String(iso || '').split('-').map(Number);
  return m ? `${MONATE[m - 1]} ${j}` : '';
}
export function monatKurz(iso) {
  const m = Number(String(iso || '').split('-')[1]);
  return m ? MONATE_KURZ[m - 1] : '';
}

/** Kommende Termine nach Monaten gruppiert: [{ schluessel: '2026-12', name: 'Dezember 2026', termine }] */
export function termineNachMonat(liste) {
  const gruppen = [];
  for (const t of liste) {
    const schluessel = t.von.slice(0, 7);
    let g = gruppen.find((x) => x.schluessel === schluessel);
    if (!g) { g = { schluessel, name: monatsname(t.von), termine: [] }; gruppen.push(g); }
    g.termine.push(t);
  }
  return gruppen;
}

/** Inhalt einer .ics-Kalenderdatei für einen Termin. */
export function kalenderDatei(t) {
  const esc = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  const tag = (iso) => iso.replace(/-/g, '');
  const folgetag = (iso) => { const [j, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(j, m - 1, d + 1)).toISOString().slice(0, 10); };
  const zeilen = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//mancusi.at//Termine//DE', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
    `UID:${t.id}@mancusi.at`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`];
  if (t.zeit && !t.bis) {
    const [h, mi] = t.zeit.split(':').map(Number);
    const endeH = String(Math.min(h + 2, 23)).padStart(2, '0');
    zeilen.push(`DTSTART;TZID=Europe/Vienna:${tag(t.von)}T${t.zeit.replace(':', '')}00`, `DTEND;TZID=Europe/Vienna:${tag(t.von)}T${endeH}${String(mi).padStart(2, '0')}00`);
  } else {
    zeilen.push(`DTSTART;VALUE=DATE:${tag(t.von)}`, `DTEND;VALUE=DATE:${tag(folgetag(t.bis || t.von))}`);
  }
  zeilen.push(`SUMMARY:${esc(`${t.titel} – Guido Mancusi`)}`);
  if (t.ort) zeilen.push(`LOCATION:${esc(t.ort)}`);
  const text = [t.mit, t.programm].filter(Boolean).join('\n');
  if (text) zeilen.push(`DESCRIPTION:${esc(text)}`);
  zeilen.push('URL:https://mancusi.at/termine/', 'END:VEVENT', 'END:VCALENDAR');
  return zeilen.join('\r\n') + '\r\n';
}

// ---------- Werke: Notenregal ----------

/** Werke nach Jahrzehnt für das Notenregal, je Fach chronologisch. */
export function notenregal() {
  const faecher = [];
  const sortiert = [...werke].sort((a, b) => jahrZahl(a.jahr) - jahrZahl(b.jahr) || a._i - b._i);
  for (const w of sortiert) {
    const erstes = Number((String(w.jahr).match(/\d{4}/) || ['0'])[0]);
    const dekade = Math.floor(erstes / 10) * 10;
    let f = faecher.find((x) => x.dekade === dekade);
    if (!f) { f = { dekade, werke: [] }; faecher.push(f); }
    f.werke.push(w);
  }
  faecher.sort((a, b) => a.dekade - b.dekade);
  return faecher.map((f) => ({ ...f, name: f.dekade ? `${f.dekade}er` : 'Ohne Jahr' }));
}
