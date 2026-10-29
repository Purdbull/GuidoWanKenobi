// Kalenderdatei je Termin: /termine/<id>.ics – zum Eintragen in Apple-, Google- oder Outlook-Kalender.
import { termine, kalenderDatei } from '../../lib/daten.js';

export function getStaticPaths() {
  return termine.map((t) => ({ params: { id: t.id }, props: { t } }));
}

export function GET({ props }) {
  return new Response(kalenderDatei(props.t), { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } });
}
