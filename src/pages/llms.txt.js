// llms.txt – kompakte Zusammenfassung für KI-Assistenten (Vorschlag von llmstxt.org).
// Google braucht das nicht; Assistenten wie ChatGPT, Claude oder Perplexity können es nutzen.
import { texte, werkeNeuesteZuerst, kommendeTermine, repertoire, url } from '../lib/daten.js';

export function GET({ site }) {
  const voll = (p) => new URL(url(p), site).toString();
  const buehne = werkeNeuesteZuerst().filter((w) => w.kat === 'Bühnenwerke');
  const termine = kommendeTermine().slice(0, 8);
  const zeilen = [
    '# Guido Mancusi',
    '',
    '> Österreichisch-italienischer Komponist und Dirigent in Wien (geboren 1966 in Neapel). Komponiert Operetten, Opern, Kinderopern, Messen, Passionen und Orchesterwerke; dirigiert Oper, Wiener Operette, Musical und Konzert. Austrian-Italian composer and conductor based in Vienna.',
    '',
    `Kontakt: ${texte.kontakt.email} · ${texte.kontakt.adresse}`,
    '',
    '## Seiten',
    '',
    `- [Biografie](${voll('biografie/')}): Werdegang, Stationen als Dirigent (u. a. Stadttheater Klagenfurt, Schloss Schönbrunn Orchester, Volksoper Wien, Seefestspiele Mörbisch, Oper Timișoara) und als Komponist`,
    `- [Werkverzeichnis](${voll('werke/')}): alle Kompositionen, mit eigenem Abschnitt zu den Bühnenwerken`,
    `- [Repertoire](${voll('repertoire/')}): ${repertoire.length} Werke, die er dirigiert – Opern, Operetten, Musicals, Ballette, Konzerte und Kirchenmusik`,
    `- [Termine](${voll('termine/')}): kommende Konzerte und Vorstellungen`,
    `- [English](${voll('en/')}): Kurzprofil auf Englisch`,
    '',
    '## Bühnenwerke (Komponist)',
    '',
    ...buehne.map((w) => `- ${w.titel} (${w.jahr})${w.text ? ` – ${w.text}` : ''}`),
    '',
    ...(termine.length ? ['## Kommende Termine', '', ...termine.map((t) => `- ${t.von}${t.bis ? ` bis ${t.bis}` : ''}: ${t.titel}${t.ort ? `, ${t.ort}` : ''}`), ''] : []),
  ];
  return new Response(zeilen.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
