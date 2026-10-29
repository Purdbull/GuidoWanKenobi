// Notenpult – Oberfläche. Kein Framework, keine fremden Skripte.

const BEREICHE = {
  termine: {
    ziffer: 'A', titel: 'Termine', einzahl: 'Termin', neu: 'Neuer Termin', aendern: 'Termin ändern',
    hinweis: 'Sortieren sich von selbst nach Datum. Vergangene Termine wandern automatisch ins Archiv.',
    leer: { von: '', bis: '', zeit: '', titel: '', ort: '', mit: '', programm: '' },
    pflicht: { von: 'das Datum', titel: 'den Titel' },
    felder: [
      { k: 'von', label: 'Datum *', typ: 'date', flex: '1 1 180px' },
      { k: 'bis', label: 'Bis (bei mehreren Tagen)', typ: 'date', flex: '1 1 180px' },
      { k: 'zeit', label: 'Uhrzeit', typ: 'time', flex: '1 1 150px' },
      { k: 'titel', label: 'Was? *', ph: 'z. B. Weihnachtskonzert', flex: '1 1 100%' },
      { k: 'ort', label: 'Wo?', ph: 'z. B. Musikverein Wien', flex: '1 1 260px' },
      { k: 'mit', label: 'Mit wem?', ph: 'z. B. Wiener Volksoper', flex: '1 1 260px' },
      { k: 'programm', label: 'Programm (optional)', ph: 'z. B. Brahms, Liszt, Mancusi', flex: '1 1 100%' },
    ],
  },
  werke: {
    ziffer: 'B', titel: 'Werke', einzahl: 'Werk', neu: 'Neues Werk', aendern: 'Werk ändern',
    hinweis: 'Das ganze Werkverzeichnis. Auf der Website erscheinen die neuesten Werke zuerst.',
    leer: { jahr: '', titel: '', text: '', kat: 'Orchestermusik' },
    pflicht: { jahr: 'das Jahr', titel: 'den Titel' },
    kats: ['Bühnenwerke', 'Chor und Orchesterwerke', 'Chormusik', 'Kammermusik', 'Orchestermusik', 'Filmmusik', 'Lieder', 'Schulmusik', 'Bearbeitungen'],
    felder: [
      { k: 'titel', label: 'Titel *', ph: 'z. B. „Timi-Polka“', flex: '1 1 100%' },
      { k: 'jahr', label: 'Jahr *', ph: 'z. B. 2026', flex: '1 1 140px' },
      { k: 'kat', label: 'Gattung', auswahl: true, flex: '2 1 260px' },
      { k: 'text', label: 'Besetzung, Widmung oder Beschreibung', ph: 'z. B. Polka française für Orchester', flex: '1 1 100%' },
    ],
  },
  repertoire: {
    ziffer: 'C', titel: 'Repertoire', einzahl: 'Stück', neu: 'Neues Stück', aendern: 'Stück ändern',
    hinweis: 'Alles, was Guido dirigiert. Auf der Website nach Gattung und Komponist geordnet.',
    leer: { komponist: '', werk: '', kat: 'Opern', notiz: '' },
    pflicht: { komponist: 'den Komponisten', werk: 'das Werk' },
    kats: ['Opern', 'Operetten', 'Musicals', 'Ballette', 'Konzerte und Kirchenmusik'],
    felder: [
      { k: 'komponist', label: 'Komponist *', ph: 'z. B. Giuseppe Verdi', flex: '1 1 260px', liste: 'komponisten' },
      { k: 'werk', label: 'Werk *', ph: 'z. B. La Traviata', flex: '1 1 260px' },
      { k: 'kat', label: 'Gattung', auswahl: true, flex: '1 1 260px' },
      { k: 'notiz', label: 'Zusatz (optional)', ph: 'z. B. konzertant', flex: '1 1 260px' },
    ],
  },
};

const NB = ' ';
const MONATE = ['Jänner', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const KURZ = ['Jän', 'Feb', 'März', 'Apr', 'Mai', 'Juni', 'Juli', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
const LANGSAM = 400;

const zustand = {
  daten: null, nutzer: '', vorname: '', bereich: 'termine', suche: { termine: '', werke: '', repertoire: '' },
  offen: null, // { id: 'neu' | id, form: {...}, fehler: [], text: '' }
  frage: null, speichert: false, archiv: false, frisch: null, animiere: 'alles',
};

const inhalt = document.getElementById('inhalt');
const meldungsOrt = document.getElementById('meldung');

// ---------- Hilfen ----------

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const normal = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const warte = (ms) => new Promise((r) => setTimeout(r, ms));
const heute = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Vienna' }).format(new Date());
const neueId = (p) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

function datumText(von, bis) {
  const a = (von || '').split('-').map(Number);
  if (a.length < 3 || !a[0]) return 'Datum offen';
  if (!bis || bis === von) return `${a[2]}.${NB}${MONATE[a[1] - 1]}${NB}${a[0]}`;
  const b = bis.split('-').map(Number);
  if (a[0] === b[0] && a[1] === b[1]) return `${a[2]}.–${b[2]}.${NB}${MONATE[a[1] - 1]}${NB}${a[0]}`;
  if (a[0] === b[0]) return `${a[2]}.${NB}${KURZ[a[1] - 1]} – ${b[2]}.${NB}${KURZ[b[1] - 1]}${NB}${a[0]}`;
  return `${a[2]}.${NB}${KURZ[a[1] - 1]}${NB}${a[0]} – ${b[2]}.${NB}${KURZ[b[1] - 1]}${NB}${b[0]}`;
}
const jahrZahl = (j) => { const m = String(j || '').match(/\d{4}/g); return m ? Number(m[m.length - 1]) : 0; };

async function anfrage(pfad, optionen = {}) {
  const r = await fetch(pfad, {
    ...optionen,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'X-Notenpult': '1', ...(optionen.headers || {}) },
  });
  let j = {};
  try { j = await r.json(); } catch { /* leer */ }
  return { status: r.status, ...j };
}

// ---------- Meldungen ----------

let meldungNr = 0;
function meldung(text, { art = 'ok', rueckgaengig = null, dauer = 6500, laeuft = false } = {}) {
  const nr = ++meldungNr;
  const symbol = laeuft
    ? '<svg class="meldung__drehen" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E7C98F" stroke-width="2.2" stroke-linecap="round"><path d="M12 3a9 9 0 1 0 9 9"/></svg>'
    : art === 'fehler'
      ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F8F2E6" stroke-width="2.2" stroke-linecap="round"><path d="M12 7v6M12 17h.01"/></svg>'
      : '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E7C98F" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  meldungsOrt.innerHTML = `<div class="meldung ${art === 'fehler' ? 'fehler' : ''}" role="status">
    <span class="meldung__symbol" aria-hidden="true">${symbol}</span>
    <span class="meldung__text">${esc(text)}</span>
    ${rueckgaengig ? '<button type="button" data-m="zurueck">Rückgängig</button>' : ''}
    <button type="button" class="meldung__zu" data-m="zu" aria-label="Meldung schließen"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 2l10 10M12 2L2 12"/></svg></button>
  </div>`;
  const el = meldungsOrt.firstElementChild;
  const schliessen = () => { if (nr !== meldungNr) return; el.classList.add('geht'); setTimeout(() => { if (nr === meldungNr) meldungsOrt.innerHTML = ''; }, 360); };
  el.querySelector('[data-m="zu"]').addEventListener('click', schliessen);
  if (rueckgaengig) el.querySelector('[data-m="zurueck"]').addEventListener('click', () => { schliessen(); rueckgaengig(); });
  if (dauer) setTimeout(schliessen, dauer);
  return { nr, schliessen };
}

// Nach dem Speichern: warten, bis GitHub die Website neu gebaut hat.
async function veroeffentlichung(commit, text, rueckgaengig = null) {
  const m = meldung(`${text} Wird veröffentlicht …`, { laeuft: true, dauer: 0, rueckgaengig });
  const start = Date.now();
  while (Date.now() - start < 4 * 60_000) {
    await warte(6000);
    if (m.nr !== meldungNr) return; // eine neuere Meldung hat übernommen
    const s = await anfrage('/api/veroeffentlichung').catch(() => ({}));
    if (s.commit === commit && s.status === 'completed') {
      if (m.nr !== meldungNr) return;
      if (s.ergebnis === 'success') meldung('Jetzt auf der Website zu sehen.');
      else meldung('Gespeichert, aber die Website konnte nicht neu gebaut werden. Bitte Moritz Bescheid geben.', { art: 'fehler', dauer: 0 });
      return;
    }
  }
  if (m.nr === meldungNr) meldung('Gespeichert. Das Veröffentlichen dauert gerade länger als üblich.', { dauer: 10_000 });
}

// ---------- Darstellung ----------

function zeilen(art) {
  const b = BEREICHE[art];
  const liste = zustand.daten[art].eintraege;
  const q = normal(zustand.suche[art]).trim();
  const passt = (e) => !q || normal(Object.values(e).join(' ')).includes(q);
  const gefiltert = liste.filter(passt);

  if (art === 'termine') {
    const t0 = heute();
    const kommend = gefiltert.filter((x) => (x.bis || x.von) >= t0).sort((a, c) => (a.von < c.von ? -1 : 1));
    const vorbei = gefiltert.filter((x) => (x.bis || x.von) < t0).sort((a, c) => (a.von < c.von ? 1 : -1));
    const gruppen = [{ titel: 'Kommende Termine', hinweis: 'so auf der Website zu sehen', eintraege: kommend, vergangen: false }];
    if (vorbei.length) gruppen.push({ titel: 'Archiv', hinweis: `${vorbei.length} vergangene Termine`, eintraege: (zustand.archiv || q) ? vorbei : [], vergangen: true, zuklappbar: !q, anzahl: vorbei.length });
    return gruppen;
  }
  return b.kats.map((kat) => {
    let e = gefiltert.filter((x) => x.kat === kat);
    if (art === 'werke') e = e.sort((a, c) => jahrZahl(c.jahr) - jahrZahl(a.jahr));
    else e = e.sort((a, c) => a.komponist.localeCompare(c.komponist, 'de'));
    return { titel: kat, hinweis: `${e.length}`, eintraege: e };
  }).filter((g) => g.eintraege.length);
}

function zeileHtml(art, e, vergangen) {
  let lead, titel, sub;
  if (art === 'termine') {
    lead = datumText(e.von, e.bis) + (e.zeit ? `, ${e.zeit}${NB}Uhr` : '');
    titel = e.titel; sub = [e.ort, e.mit, e.programm].filter(Boolean).join(' · ');
  } else if (art === 'werke') { lead = e.jahr; titel = e.titel; sub = e.text; }
  else { lead = e.komponist; titel = e.werk; sub = e.notiz; }

  const offen = zustand.offen && zustand.offen.id === e.id;
  const frage = zustand.frage === e.id;
  const klassen = ['eintrag', vergangen ? 'vergangen' : '', zustand.frisch === e.id ? 'frisch' : ''].join(' ');
  return `<div class="${klassen}" data-id="${esc(e.id)}"><div><div class="eintrag__innen">
    ${frage ? `<div class="frage"><p><em>${esc(titel)}</em> wirklich von der Website nehmen?</p>
      <div class="knoepfe"><button type="button" class="knopf knopf--rot knopf--klein" data-a="loeschen" ${zustand.speichert ? 'disabled' : ''}>${zustand.speichert ? 'Entfernt …' : 'Ja, löschen'}</button>
      <button type="button" class="knopf knopf--linie knopf--klein" data-a="behalten">Behalten</button></div></div>`
    : `<div class="zeile">
      <div class="zeile__lead">${esc(lead)}</div>
      <div class="zeile__text"><span class="zeile__titel">${esc(titel)}</span>${sub ? `<span class="zeile__sub">${esc(sub)}</span>` : ''}</div>
      <div class="zeile__aktionen">
        <button type="button" class="knopf knopf--linie knopf--klein" data-a="aendern" aria-expanded="${offen}" aria-label="Ändern: ${esc(titel)}">Ändern</button>
        <button type="button" class="knopf knopf--text" data-a="fragen" aria-label="Löschen: ${esc(titel)}">Löschen</button>
      </div></div>`}
    ${offen ? formularHtml(art) : ''}
  </div></div></div>`;
}

function formularHtml(art) {
  const b = BEREICHE[art];
  const o = zustand.offen;
  const neu = o.id === 'neu';
  const anim = zustand.animiere === 'formular' ? 'klapp' : 'klapp ohne-anim';
  const felder = b.felder.map((f) => {
    const id = `f-${f.k}`;
    const fehlt = o.fehler.includes(f.k);
    const wert = o.form[f.k] ?? '';
    const eingabe = f.auswahl
      ? `<select id="${id}" data-f="${f.k}">${b.kats.map((k) => `<option ${k === wert ? 'selected' : ''}>${esc(k)}</option>`).join('')}</select>`
      : `<input id="${id}" data-f="${f.k}" type="${f.typ || 'text'}" value="${esc(wert)}" placeholder="${esc(f.ph || '')}" ${f.liste ? `list="${f.liste}"` : ''} ${fehlt ? 'aria-invalid="true"' : ''} autocomplete="off" />`;
    return `<div class="feld ${fehlt ? 'fehlt' : ''}" style="flex: ${f.flex}"><label for="${id}">${esc(f.label)}</label>${eingabe}</div>`;
  }).join('');
  const komponisten = art === 'repertoire'
    ? `<datalist id="komponisten">${[...new Set(zustand.daten.repertoire.eintraege.map((r) => r.komponist))].sort((a, c) => a.localeCompare(c, 'de')).map((k) => `<option value="${esc(k)}"></option>`).join('')}</datalist>` : '';
  return `<div class="${anim}" data-formular><div><form class="formular" novalidate>
    <h3>${neu ? b.neu : b.aendern}</h3>
    <div class="felder">${felder}</div>${komponisten}
    ${o.text ? `<p class="formular__fehler" role="alert">${esc(o.text)}</p>` : ''}
    <div class="knoepfe">
      <button type="submit" class="knopf knopf--rot" ${zustand.speichert ? 'disabled' : ''}>${zustand.speichert ? 'Speichert …' : 'Speichern'}</button>
      <button type="button" class="knopf knopf--linie" data-a="abbrechen">Abbrechen</button>
    </div>
  </form></div></div>`;
}

function darstellen() {
  const { daten, bereich } = zustand;
  const b = BEREICHE[bereich];
  const t0 = heute();
  const zahl = {
    termine: daten.termine.eintraege.filter((x) => (x.bis || x.von) >= t0).length,
    werke: daten.werke.eintraege.length,
    repertoire: daten.repertoire.eintraege.length,
  };
  const sub = { termine: `${zahl.termine} kommende`, werke: `${zahl.werke} Werke`, repertoire: `${zahl.repertoire} Stücke` };
  const name = zustand.vorname ? `, <em>${esc(zustand.vorname)}.</em>` : '.';
  const rein = zustand.animiere === 'alles' || zustand.animiere === 'bereich';
  const gruppen = zeilen(bereich);
  const neuOffen = zustand.offen && zustand.offen.id === 'neu';

  inhalt.innerHTML = `
    <div><h1 class="gruss">Guten Tag${name}</h1><p class="untertitel">Was soll heute auf die Website?</p></div>
    <nav class="reiter-leiste" aria-label="Bereiche">
      ${Object.entries(BEREICHE).map(([k, x]) => `<button type="button" class="reiter" data-bereich="${k}" aria-pressed="${k === bereich}">
        <span class="reiter__ziffer" aria-hidden="true">${x.ziffer}</span>
        <span class="reiter__text"><span class="reiter__name">${x.titel}</span><span class="reiter__sub">${sub[k]}</span></span></button>`).join('')}
    </nav>
    <div class="bereichkopf ${rein ? 'rein' : ''}">
      <div class="bereichkopf__text"><h2>${b.titel}</h2><p class="hinweis">${b.hinweis}</p></div>
      <button type="button" class="knopf knopf--rot" data-a="neu" aria-expanded="${!!neuOffen}">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M8 2v12M2 8h12"/></svg><span>${b.neu}</span></button>
    </div>
    <label class="suche ${rein ? 'rein' : ''}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>
      <span class="unsichtbar">${b.titel} durchsuchen</span><input type="search" data-suche value="${esc(zustand.suche[bereich])}" placeholder="${b.titel} durchsuchen" /></label>
    ${neuOffen ? formularHtml(bereich) : ''}
    ${gruppen.map((g, i) => `<section class="gruppe ${rein ? 'rein' : ''}" style="animation-delay:${(0.08 + i * 0.06).toFixed(2)}s">
      <div class="gruppe__kopf"><h3>${esc(g.titel)}</h3><span>${esc(g.hinweis)}</span></div>
      ${g.eintraege.map((e) => zeileHtml(bereich, e, g.vergangen)).join('')}
      ${!g.eintraege.length && !g.zuklappbar ? `<p class="leer">${zustand.suche[bereich] ? 'Nichts gefunden.' : 'Noch keine Einträge.'}</p>` : ''}
      ${g.zuklappbar ? `<button type="button" class="knopf knopf--linie knopf--klein gruppe__mehr" data-a="archiv">${zustand.archiv ? 'Archiv ausblenden' : `Archiv anzeigen (${g.anzahl})`}</button>` : ''}
    </section>`).join('')}
    ${!gruppen.length ? '<p class="leer">Nichts gefunden.</p>' : ''}
    <div class="fusszeile"><span>Jede Änderung ist nach etwa einer Minute auf der Website zu sehen.</span><span>Angemeldet als ${esc(zustand.nutzer)}</span></div>`;

  zustand.animiere = null;
  zustand.frisch = null;
  inhalt.querySelectorAll('.klapp.ohne-anim').forEach((el) => { el.style.animation = 'none'; });
}

// ---------- Aktionen ----------

async function laden() {
  const r = await anfrage('/api/daten');
  if (r.status === 401) { zeigeAbgemeldet(); return false; }
  if (!r.daten) { meldung(r.fehler || 'Die Daten konnten nicht geladen werden.', { art: 'fehler', dauer: 0 }); return false; }
  zustand.daten = r.daten;
  zustand.nutzer = r.nutzer || '';
  zustand.vorname = r.vorname || '';
  if (r.website) document.querySelectorAll('[data-website]').forEach((el) => { el.href = r.website; });
  return true;
}

function zeigeAbgemeldet() {
  inhalt.innerHTML = '<div class="laden"><p>Die Anmeldung ist abgelaufen.</p><a class="knopf knopf--rot" href="/">Neu anmelden</a></div>';
}

function schliesseFormular(dann) {
  const el = inhalt.querySelector('[data-formular]');
  if (!el) { zustand.offen = null; dann?.(); darstellen(); return; }
  el.classList.remove('ohne-anim'); el.style.animation = '';
  el.classList.add('zu');
  setTimeout(() => { zustand.offen = null; dann?.(); darstellen(); }, LANGSAM);
}

function oeffne(id) {
  const art = zustand.bereich;
  const b = BEREICHE[art];
  const quelle = id === 'neu' ? b.leer : zustand.daten[art].eintraege.find((e) => e.id === id);
  if (!quelle) return;
  zustand.offen = { id, form: { ...b.leer, ...quelle }, fehler: [], text: '' };
  zustand.frage = null;
  zustand.animiere = 'formular';
  darstellen();
  const erstes = inhalt.querySelector('[data-formular] input, [data-formular] select');
  erstes?.focus({ preventScroll: true });
  inhalt.querySelector('[data-formular]')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function speichern(art, neueListe, anlass) {
  const r = await anfrage(`/api/daten/${art}`, { method: 'PUT', body: JSON.stringify({ eintraege: neueListe, sha: zustand.daten[art].sha, anlass }) });
  if (r.status === 401) { zeigeAbgemeldet(); return { ok: false }; }
  if (r.konflikt) { await laden(); return { ok: false, text: r.fehler }; }
  if (!r.ok) return { ok: false, text: r.fehler || 'Speichern hat nicht geklappt. Bitte noch einmal versuchen.' };
  zustand.daten[art] = { eintraege: r.eintraege, sha: r.sha };
  return { ok: true, commit: r.commit };
}

async function formularSpeichern() {
  const art = zustand.bereich;
  const b = BEREICHE[art];
  const o = zustand.offen;
  const fehlt = Object.keys(b.pflicht).filter((k) => !String(o.form[k] || '').trim());
  if (fehlt.length) {
    o.fehler = fehlt; o.text = `Bitte noch ${fehlt.map((k) => b.pflicht[k]).join(' und ')} eintragen.`;
    darstellen(); return;
  }
  if (art === 'termine' && o.form.bis && o.form.bis < o.form.von) {
    o.fehler = ['bis']; o.text = 'Das Ende liegt vor dem Beginn. Bitte das Bis-Datum prüfen.'; darstellen(); return;
  }
  const liste = zustand.daten[art].eintraege;
  const eintrag = { ...o.form };
  let neueListe;
  if (o.id === 'neu') {
    eintrag.id = neueId(art === 'termine' ? 't' : art === 'werke' ? 'w' : 'r');
    neueListe = [...liste, eintrag];
  } else {
    eintrag.id = o.id;
    neueListe = liste.map((e) => (e.id === o.id ? eintrag : e));
  }
  zustand.speichert = true; o.fehler = []; o.text = ''; darstellen();
  const titel = eintrag.titel || eintrag.werk;
  const r = await speichern(art, neueListe, `${o.id === 'neu' ? 'Neu' : 'Geändert'}: ${titel}`);
  zustand.speichert = false;
  if (!r.ok) {
    if (zustand.offen) { zustand.offen.text = r.text || ''; darstellen(); }
    return;
  }
  schliesseFormular(() => { zustand.frisch = eintrag.id; });
  veroeffentlichung(r.commit, 'Gespeichert.');
}

async function loeschen(id) {
  const art = zustand.bereich;
  const liste = zustand.daten[art].eintraege;
  const idx = liste.findIndex((e) => e.id === id);
  const eintrag = liste[idx];
  if (!eintrag) return;
  zustand.speichert = true; darstellen();
  const titel = eintrag.titel || eintrag.werk;
  const r = await speichern(art, liste.filter((e) => e.id !== id), `Entfernt: ${titel}`);
  zustand.speichert = false;
  if (!r.ok) { zustand.frage = null; darstellen(); meldung(r.text || 'Löschen hat nicht geklappt.', { art: 'fehler' }); return; }
  const zeile = inhalt.querySelector(`.eintrag[data-id="${CSS.escape(id)}"]`);
  // Zeile ist noch zu sehen (Daten schon neu) – erst zusammenfalten, dann neu zeichnen
  if (zeile) { zeile.classList.add('weg'); await warte(450); }
  zustand.frage = null; darstellen();
  veroeffentlichung(r.commit, `„${String(titel).replace(/[„“"]/g, '')}“ entfernt.`, async () => {
    const aktuell = zustand.daten[art].eintraege.slice();
    aktuell.splice(Math.min(idx, aktuell.length), 0, eintrag);
    const z = await speichern(art, aktuell, `Wiederhergestellt: ${titel}`);
    if (!z.ok) { meldung(z.text || 'Wiederherstellen hat nicht geklappt.', { art: 'fehler' }); return; }
    zustand.frisch = id; darstellen();
    veroeffentlichung(z.commit, 'Wiederhergestellt.');
  });
}

// ---------- Ereignisse ----------

inhalt.addEventListener('click', (ev) => {
  const reiter = ev.target.closest('[data-bereich]');
  if (reiter) {
    const k = reiter.getAttribute('data-bereich');
    if (k === zustand.bereich) return;
    zustand.bereich = k; zustand.offen = null; zustand.frage = null; zustand.animiere = 'bereich';
    darstellen(); return;
  }
  const knopf = ev.target.closest('[data-a]');
  if (!knopf || zustand.speichert) return;
  const a = knopf.getAttribute('data-a');
  const id = knopf.closest('.eintrag')?.getAttribute('data-id');
  if (a === 'neu') { if (zustand.offen?.id === 'neu') schliesseFormular(); else oeffne('neu'); }
  if (a === 'aendern') { if (zustand.offen?.id === id) schliesseFormular(); else oeffne(id); }
  if (a === 'abbrechen') schliesseFormular();
  if (a === 'fragen') { zustand.frage = id; zustand.offen = null; darstellen(); }
  if (a === 'behalten') { zustand.frage = null; darstellen(); }
  if (a === 'loeschen') loeschen(id);
  if (a === 'archiv') { zustand.archiv = !zustand.archiv; darstellen(); }
});

inhalt.addEventListener('input', (ev) => {
  const f = ev.target.getAttribute('data-f');
  if (f && zustand.offen) {
    zustand.offen.form[f] = ev.target.value;
    if (zustand.offen.fehler.includes(f)) {
      zustand.offen.fehler = zustand.offen.fehler.filter((x) => x !== f);
      ev.target.closest('.feld')?.classList.remove('fehlt');
      ev.target.removeAttribute('aria-invalid');
    }
  }
  if (ev.target.hasAttribute('data-suche')) {
    zustand.suche[zustand.bereich] = ev.target.value;
    clearTimeout(zustand.sucheUhr);
    zustand.sucheUhr = setTimeout(() => {
      const pos = ev.target.selectionStart;
      zustand.offen = null; zustand.frage = null; darstellen();
      const s = inhalt.querySelector('[data-suche]'); s.focus(); s.setSelectionRange(pos, pos);
    }, 220);
  }
});
inhalt.addEventListener('change', (ev) => {
  const f = ev.target.getAttribute('data-f');
  if (f && zustand.offen) zustand.offen.form[f] = ev.target.value;
});
inhalt.addEventListener('submit', (ev) => { ev.preventDefault(); if (!zustand.speichert) formularSpeichern(); });
document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && zustand.offen && !zustand.speichert) schliesseFormular(); });

// ---------- Start ----------

(async () => {
  try {
    if (await laden()) { zustand.animiere = 'alles'; darstellen(); }
  } catch {
    meldung('Keine Verbindung. Bitte Internet prüfen und neu laden.', { art: 'fehler', dauer: 0 });
  }
})();
