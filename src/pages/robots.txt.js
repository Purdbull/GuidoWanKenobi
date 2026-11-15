// robots.txt – auf mancusi.at für alle Suchmaschinen und KI-Suchdienste offen,
// in der Vorschau unter github.io gesperrt (sonst doppelte Inhalte).
import { url } from '../lib/daten.js';

export function GET({ site }) {
  const basis = new URL(url(''), site);
  const vorschau = site?.hostname !== 'mancusi.at';
  const text = vorschau
    ? 'User-agent: *\nDisallow: /\n'
    : [
        '# Suchmaschinen und KI-Suchdienste sind willkommen.',
        'User-agent: *',
        'Allow: /',
        '',
        '# Ausdrücklich auch für KI-Assistenten (Antworten mit Quellenangabe)',
        'User-agent: GPTBot',
        'User-agent: OAI-SearchBot',
        'User-agent: ChatGPT-User',
        'User-agent: ClaudeBot',
        'User-agent: Claude-SearchBot',
        'User-agent: Claude-User',
        'User-agent: PerplexityBot',
        'User-agent: Google-Extended',
        'User-agent: Applebot-Extended',
        'Allow: /',
        '',
        `Sitemap: ${new URL('sitemap.xml', basis)}`,
        '',
      ].join('\n');
  return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
