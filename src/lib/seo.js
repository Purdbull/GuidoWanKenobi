// Strukturierte Daten (schema.org, JSON-LD) für Suchmaschinen und KI-Assistenten.
// Alles wird aus den gepflegten Daten erzeugt – ändert Guido etwas im Notenpult, ändern sich die Angaben mit.
import { texte, termine, werke, kommendeTermine, url } from './daten.js';

// Feste Profile außerhalb der Website, über die Suchmaschinen Guido eindeutig zuordnen.
// Hier ergänzen, sobald es weitere gibt (z. B. Operabase, Wikidata, deutsche Wikipedia).
export const PROFILE = [
  'https://en.wikipedia.org/wiki/Guido_Mancusi',
  'https://db.musicaustria.at/node/59622',
];

export function personId(site) {
  return new URL('#person', site).toString();
}

export function person(site) {
  return {
    '@type': 'Person',
    '@id': personId(site),
    name: 'Guido Mancusi',
    url: site.toString(),
    image: new URL(url('bilder/guido-mancusi-portraet.jpg'), site).toString(),
    description: 'Österreichisch-italienischer Komponist und Dirigent in Wien. Komponist von Operetten, Opern, Kinderopern, Messen und Orchesterwerken; Dirigent von Oper, Wiener Operette, Musical und Konzert.',
    jobTitle: ['Komponist', 'Dirigent', 'Composer', 'Conductor'],
    birthDate: '1966',
    birthPlace: { '@type': 'Place', name: 'Neapel, Italien' },
    homeLocation: { '@type': 'Place', name: 'Wien, Österreich' },
    knowsAbout: ['Komposition', 'Dirigieren', 'Operette', 'Oper', 'Musical', 'Kinderoper', 'Kirchenmusik', 'Wiener Klassik', 'Johann Strauss'],
    email: `mailto:${texte.kontakt.email}`,
    address: { '@type': 'PostalAddress', streetAddress: 'Münzgasse 8', postalCode: '1030', addressLocality: 'Wien', addressCountry: 'AT' },
    sameAs: [...PROFILE, ...Object.values(texte.social)],
  };
}

export function website(site) {
  return {
    '@type': 'WebSite',
    '@id': new URL('#website', site).toString(),
    url: site.toString(),
    name: 'Guido Mancusi',
    inLanguage: 'de-AT',
    about: { '@id': personId(site) },
  };
}

/** Kommende Termine als Veranstaltungen – Google kann sie direkt in der Suche zeigen. */
export function veranstaltungen(site) {
  return kommendeTermine().map((t) => {
    const beginn = t.zeit ? `${t.von}T${t.zeit}:00${wienerVersatz(t.von)}` : t.von;
    const ort = t.ort || 'Ort wird bekanntgegeben';
    return {
      '@type': 'MusicEvent',
      '@id': new URL(`termine/#${t.id}`, site).toString(),
      name: t.titel,
      startDate: beginn,
      ...(t.bis ? { endDate: t.bis } : {}),
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      location: { '@type': 'Place', name: ort, address: ort },
      performer: { '@id': personId(site) },
      ...(t.mit || t.programm ? { description: [t.mit, t.programm].filter(Boolean).join(' · ') } : {}),
      image: new URL(url('bilder/guido-mancusi-applaus.jpg'), site).toString(),
      url: new URL(url('termine/'), site).toString(),
    };
  });
}

// Mitteleuropäische Zeit: Sommerzeit von letztem Sonntag im März bis letztem Sonntag im Oktober
function wienerVersatz(iso) {
  const [j, m, d] = iso.split('-').map(Number);
  const letzterSonntag = (monat) => { const x = new Date(Date.UTC(j, monat, 0)); return x.getUTCDate() - x.getUTCDay(); };
  const sommer = (m > 3 && m < 10) || (m === 3 && d >= letzterSonntag(3)) || (m === 10 && d < letzterSonntag(10));
  return sommer ? '+02:00' : '+01:00';
}

const GATTUNG = {
  'Bühnenwerke': 'Bühnenwerk', 'Chor und Orchesterwerke': 'Chor und Orchester', 'Chormusik': 'Chormusik',
  'Kammermusik': 'Kammermusik', 'Orchestermusik': 'Orchestermusik', 'Filmmusik': 'Filmmusik',
  'Lieder': 'Lied', 'Schulmusik': 'Schulmusik', 'Bearbeitungen': 'Bearbeitung',
};
const ohneAnfuehrung = (s) => s.replace(/[„“”"]/g, '').trim();

/** Das Werkverzeichnis als Liste von Kompositionen. */
export function kompositionen(site) {
  return werke.map((w) => ({
    '@type': 'MusicComposition',
    name: ohneAnfuehrung(w.titel),
    composer: { '@id': personId(site) },
    ...(/^\d{4}/.test(w.jahr) ? { dateCreated: w.jahr.slice(0, 4) } : {}),
    genre: GATTUNG[w.kat] || w.kat,
    ...(w.text ? { description: w.text } : {}),
  }));
}

export function graph(...knoten) {
  return { '@context': 'https://schema.org', '@graph': knoten.flat().filter(Boolean) };
}

export { termine };
