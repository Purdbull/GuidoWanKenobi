// sitemap.xml – alle öffentlichen Seiten, damit Suchmaschinen nichts übersehen.
import { url } from '../lib/daten.js';

const SEITEN = [
  { pfad: '', prio: '1.0', en: 'en/' },
  { pfad: 'termine/', prio: '0.9' },
  { pfad: 'werke/', prio: '0.9' },
  { pfad: 'repertoire/', prio: '0.8' },
  { pfad: 'biografie/', prio: '0.8' },
  { pfad: 'en/', prio: '0.8', de: '' },
  { pfad: 'impressum/', prio: '0.2' },
  { pfad: 'datenschutz/', prio: '0.2' },
];

export function GET({ site }) {
  const voll = (p) => new URL(url(p), site).toString();
  const alt = (s) => {
    const paar = s.en !== undefined ? { de: s.pfad, en: s.en } : s.de !== undefined ? { de: s.de, en: s.pfad } : null;
    return paar ? Object.entries(paar).map(([l, p]) => `\n    <xhtml:link rel="alternate" hreflang="${l}" href="${voll(p)}"/>`).join('') : '';
  };
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${SEITEN.map((s) => `  <url>\n    <loc>${voll(s.pfad)}</loc>${alt(s)}\n    <priority>${s.prio}</priority>\n  </url>`).join('\n')}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
