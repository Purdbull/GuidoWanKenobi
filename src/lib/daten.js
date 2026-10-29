// Gemeinsame Daten und Hilfsfunktionen für alle Seiten.
// Die JSON-Dateien in src/data/ pflegt Guido über das Notenpult.
import termineRoh from '../data/termine.json';
import werkeRoh from '../data/werke.json';
import repertoireRoh from '../data/repertoire.json';
import hoerbeispiele from '../data/hoerbeispiele.json';
import texte from '../data/texte.json';

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
