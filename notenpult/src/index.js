// Notenpult – kleiner Dienst, über den Guido Termine, Werke und Repertoire pflegt.
//
// Ablauf: Cloudflare Access lässt nur freigegebene E-Mail-Adressen durch (Anmeldung per Code).
// Dieser Dienst prüft das Access-Token zusätzlich selbst, liest die JSON-Dateien aus dem
// GitHub-Repo und schreibt Änderungen als Commit zurück. Der GitHub-Token liegt nur hier,
// nie im Browser. Nach dem Commit baut GitHub die Website neu (ca. 1 Minute).
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { BESTAENDE, pruefen, alsDatei } from './schema.js';

const SICHERHEITS_HEADER = {
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000',
};

let jwks = null;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    try {
      const nutzer = await anmeldungPruefen(request, env, url, ctx);
      if (!nutzer) return antwort({ fehler: 'Nicht angemeldet.' }, 401);

      if (url.pathname.startsWith('/api/')) {
        return await api(request, env, url, nutzer);
      }
      const r = await env.ASSETS.fetch(request);
      return mitHeadern(r);
    } catch (e) {
      console.error(e);
      return antwort({ fehler: 'Unerwarteter Fehler. Bitte später noch einmal versuchen.' }, 500);
    }
  },
};

// ---------- Anmeldung ----------

async function anmeldungPruefen(request, env, url, ctx) {
  // Nur für die lokale Entwicklung (wrangler dev auf localhost), nie im Netz.
  if (env.NUR_LOKAL_OHNE_ANMELDUNG === 'ja' && ['localhost', '127.0.0.1'].includes(url.hostname)) {
    return { email: 'lokal@test' };
  }
  const email = (await emailAusAccess(request, env, ctx)).toLowerCase();
  // Zusätzlich zur Access-Regel: nur ausdrücklich freigegebene Adressen
  const erlaubt = String(env.ERLAUBTE_EMAILS || '').toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);
  if (!email || !erlaubt.includes(email)) return null;
  return { email };
}

async function emailAusAccess(request, env, ctx) {
  // Weg 1: Access direkt am Worker eingeschaltet (Tab „Access“) – Cloudflare liefert die Identität mit.
  if (ctx?.access) {
    try {
      const identitaet = await ctx.access.getIdentity();
      if (identitaet?.email) return String(identitaet.email);
    } catch (e) { console.error('Access-Identität', e); }
  }
  // Weg 2: klassische Access-Anwendung – Token selbst prüfen (Team-Domain und AUD in wrangler.jsonc).
  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token || !env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD || env.ACCESS_TEAM_DOMAIN.includes('TEAMNAME')) return '';
  const team = env.ACCESS_TEAM_DOMAIN.replace(/\/$/, '');
  jwks ||= createRemoteJWKSet(new URL(`${team}/cdn-cgi/access/certs`));
  try {
    const { payload } = await jwtVerify(token, jwks, { issuer: team, audience: env.ACCESS_AUD });
    return String(payload.email || '');
  } catch {
    return '';
  }
}

// ---------- API ----------

async function api(request, env, url, nutzer) {
  const pfad = url.pathname.replace(/\/+$/, '');

  if (request.method === 'GET' && pfad === '/api/daten') {
    const daten = {};
    await Promise.all(Object.keys(BESTAENDE).map(async (art) => { daten[art] = await lesen(env, art); }));
    const vornamen = Object.fromEntries(String(env.VORNAMEN || '').split(',').map((x) => x.split(':').map((y) => y.trim())).filter((x) => x.length === 2).map(([e, n]) => [e.toLowerCase(), n]));
    return antwort({ daten, nutzer: nutzer.email, vorname: vornamen[nutzer.email] || '', website: env.WEBSITE_URL || 'https://mancusi.at/' });
  }

  if (request.method === 'GET' && pfad === '/api/veroeffentlichung') {
    return antwort(await letzterBuild(env));
  }

  const m = pfad.match(/^\/api\/daten\/(termine|werke|repertoire)$/);
  if (request.method === 'PUT' && m) {
    // Schutz gegen fremde Seiten: nur eigene Herkunft und eigener Header
    const herkunft = request.headers.get('Origin');
    if ((herkunft && herkunft !== url.origin) || request.headers.get('X-Notenpult') !== '1') {
      return antwort({ fehler: 'Anfrage abgelehnt.' }, 403);
    }
    const laenge = Number(request.headers.get('Content-Length') || 0);
    if (laenge > 1_500_000) return antwort({ fehler: 'Daten zu groß.' }, 413);

    let koerper;
    try { koerper = await request.json(); } catch { return antwort({ fehler: 'Ungültige Daten.' }, 400); }
    const art = m[1];
    const geprueft = pruefen(art, koerper?.eintraege);
    if (!geprueft.ok) return antwort({ fehler: geprueft.fehler.join(' ') }, 422);
    if (typeof koerper.sha !== 'string' || !/^[0-9a-f]{40}$/.test(koerper.sha)) {
      return antwort({ fehler: 'Versionsangabe fehlt. Bitte Seite neu laden.' }, 400);
    }
    const anlass = String(koerper.anlass || 'Änderung').slice(0, 120).replace(/[\r\n]/g, ' ');
    const ergebnis = await schreiben(env, art, geprueft.eintraege, koerper.sha, `${anlass} (Notenpult, ${nutzer.email})`);
    if (ergebnis.konflikt) {
      return antwort({ fehler: 'In der Zwischenzeit wurde etwas anderes gespeichert. Die Liste wird neu geladen.', konflikt: true }, 409);
    }
    return antwort({ ok: true, sha: ergebnis.sha, commit: ergebnis.commit, eintraege: geprueft.eintraege });
  }

  return antwort({ fehler: 'Nicht gefunden.' }, 404);
}

// ---------- GitHub ----------

function gh(env, pfad, init = {}) {
  return fetch(`${env.GITHUB_API || 'https://api.github.com'}/repos/${env.GITHUB_REPO}${pfad}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'mancusi-notenpult',
      ...(init.headers || {}),
    },
  });
}

function zuBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
function ausBase64(b64) {
  const bin = atob(b64.replace(/\n/g, ''));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

async function lesen(env, art) {
  const datei = BESTAENDE[art].datei;
  const r = await gh(env, `/contents/${datei}?ref=${encodeURIComponent(env.GITHUB_BRANCH || 'main')}`);
  if (!r.ok) throw new Error(`GitHub lesen ${art}: ${r.status}`);
  const j = await r.json();
  let inhalt;
  if (j.content) {
    inhalt = ausBase64(j.content);
  } else {
    // Dateien über 1 MB liefert die Contents-API ohne Inhalt – dann über die Blob-API holen
    const b = await gh(env, `/git/blobs/${j.sha}`);
    inhalt = ausBase64((await b.json()).content);
  }
  return { eintraege: JSON.parse(inhalt), sha: j.sha };
}

async function schreiben(env, art, eintraege, sha, nachricht) {
  const r = await gh(env, `/contents/${BESTAENDE[art].datei}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: nachricht,
      content: zuBase64(alsDatei(eintraege)),
      sha,
      branch: env.GITHUB_BRANCH || 'main',
      committer: { name: 'Notenpult', email: 'notenpult@users.noreply.github.com' },
    }),
  });
  if (r.status === 409 || r.status === 422) return { konflikt: true };
  if (!r.ok) throw new Error(`GitHub schreiben ${art}: ${r.status} ${await r.text()}`);
  const j = await r.json();
  return { sha: j.content.sha, commit: j.commit?.sha || '' };
}

async function letzterBuild(env) {
  const r = await gh(env, `/actions/workflows/website.yml/runs?branch=${encodeURIComponent(env.GITHUB_BRANCH || 'main')}&per_page=1`);
  if (!r.ok) return { status: 'unbekannt' };
  const lauf = (await r.json()).workflow_runs?.[0];
  if (!lauf) return { status: 'unbekannt' };
  return { status: lauf.status, ergebnis: lauf.conclusion, zeit: lauf.updated_at, commit: lauf.head_sha };
}

// ---------- Hilfen ----------

function antwort(daten, status = 200) {
  return new Response(JSON.stringify(daten), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...SICHERHEITS_HEADER },
  });
}

function mitHeadern(r) {
  const neu = new Response(r.body, r);
  for (const [k, v] of Object.entries(SICHERHEITS_HEADER)) neu.headers.set(k, v);
  return neu;
}
