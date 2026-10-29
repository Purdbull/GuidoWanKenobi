// Gemeinsame Daten und Hilfsfunktionen für alle Seiten.
// Die JSON-Dateien in src/data/ pflegt Guido über das Notenpult.
import termineRoh from '../data/termine.json';
import werkeRoh from '../data/werke.json';
import repertoireRoh from '../data/repertoire.json';
import hoerbeispiele from '../data/hoerbeispiele.json';
import texte from '../data/texte.json';
import { LEBENSDATEN, lebenszeit, kurzname } from './komponisten.js';

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

/**
 * Komponisten als Noten auf einem Notensystem: waagrecht nach Geburtsjahr,
 * senkrecht so verteilt, dass sich keine Noten überdecken.
 */
export const ZEITSTRAHL = { von: 1640, bis: 1960, breite: 1100, stufe: 13 };
export function zeitstrahl() {
  const { von, bis, breite } = ZEITSTRAHL;
  const namen = [...new Set(repertoire.map((r) => r.komponist))].filter((n) => LEBENSDATEN[n]);
  namen.sort((a, b) => LEBENSDATEN[a][0] - LEBENSDATEN[b][0] || a.localeCompare(b));
  // Positionen 0 (oberste Linie) bis 8 (unterste Linie); -2/-1 und 9/10 sind Hilfslinien
  const VORLIEBE = [4, 2, 6, 3, 5, 1, 7, 0, 8, -1, 9, -2, 10];
  const gesetzt = [];
  return namen.map((name, i) => {
    const [geb, gest] = LEBENSDATEN[name];
    const x = ((geb - von) / (bis - von)) * breite;
    const pos = VORLIEBE.find((p) => gesetzt.every((g) => {
      const dx = Math.abs(g.x - x);
      if (g.pos === p) return dx >= 26;
      if (Math.abs(g.pos - p) === 1) return dx >= 13;
      return true;
    })) ?? 4;
    gesetzt.push({ x, pos });
    const werke = repertoire.filter((r) => r.komponist === name);
    return {
      i, name, kurz: kurzname(name), geb, gest, zeit: lebenszeit(name),
      links: (x / breite) * 100, pos,
      werke: REPERTOIRE_KATEGORIEN.map((kat) => ({ kat, werke: werke.filter((w) => w.kat === kat) })).filter((g) => g.werke.length),
      anzahl: werke.length,
    };
  });
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
