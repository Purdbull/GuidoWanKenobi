# Auftakt: Wagner, Lohengrin, Einleitung zum 3. Akt, Posaune 1 ab Ziffer 2
# Bassschlüssel, G-Dur, Alla breve, ff.
# Triole D3-Fis3-A3 | C4 (aufgelöst) punkt. Halbe, H3 punkt. Achtel, C4 Sechzehntel |
# H3 Viertel, A3 Halbe, G3 punkt. Achtel, A3 Sechzehntel | G3 Ganze ⌒ | Fis3 Viertel, Viertelpause, halbe Pause
import math
import os
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ausgabe') + os.sep
os.makedirs(OUT, exist_ok=True)
INK = '#2B2018'; PAPER = '#F3EADA'; LINE = '#B9A585'; GOLD = '#7A5A22'; RED = '#8E2F22'
S = 18; TOP = 40; BOT = TOP + 4 * S
G2, A2, B2, C3, D3, E3, F3, G3, A3, B3, C4, D4 = range(12)
def Y(step): return BOT - step * S / 2

Q = 0.36        # Sekunden pro Viertel (Halbe ≈ 83)
DOWN = 1.9      # Zeitpunkt der Eins von Takt 2 (Schlag des Taktstocks)
def T(q): return DOWN + q * Q

def anim(d, name='erschein', dur=0.55):
    return (f"transform-box: fill-box; transform-origin: center; "
            f"animation: {{{{{name}}}}} {dur}s cubic-bezier(0.22, 0.75, 0.3, 1) {d:.2f}s both")
def fade(d, dur=0.6):
    return f"animation: {{{{fade_n}}}} {dur}s ease-out {d:.2f}s both"

def ledger(x, step):
    out = ''
    if step >= C4:
        for st in range(C4, step + 1, 2):
            out += f'<path d="M{x-12} {Y(st)}H{x+12}" stroke="{INK}" stroke-width="1.4"></path>'
    return out

def head(x, step, kind='black'):
    y = Y(step)
    if kind == 'whole':
        return (f'<ellipse cx="{x}" cy="{y}" rx="9.5" ry="5.8" fill="{INK}"></ellipse>'
                f'<ellipse cx="{x}" cy="{y}" rx="4.6" ry="3.4" transform="rotate(55 {x} {y})" fill="{PAPER}"></ellipse>')
    g = f'<ellipse cx="{x}" cy="{y}" rx="7.2" ry="5.1" transform="rotate(-20 {x} {y})" fill="{INK}"></ellipse>'
    if kind == 'half':
        g += f'<ellipse cx="{x}" cy="{y}" rx="5.3" ry="2.5" transform="rotate(-38 {x} {y})" fill="{PAPER}"></ellipse>'
    return g

def stem_down(x, step, end_y):
    return f'<path d="M{x-6.4} {Y(step)+1.5}V{end_y}" stroke="{INK}" stroke-width="1.7"></path>'

def dot(x, step):
    y = Y(step) if step % 2 == 1 else Y(step) - S / 2  # Punkt immer in einen Zwischenraum
    return f'<circle cx="{x}" cy="{y}" r="2.3" fill="{INK}"></circle>'

def note(x, step, kind, t, stem_end=None, dotted=False, extra=''):
    g = f'<g style="{anim(t)}">' + ledger(x, step) + head(x, step, kind)
    if stem_end is not None:
        g += stem_down(x, step, stem_end)
    if dotted:
        g += dot(x + 14, step)
    return g + extra + '</g>'

def beam(x1, y1, x2, y2, t, thick=7):
    return (f'<path d="M{x1} {y1}L{x2} {y2}L{x2} {y2-thick}L{x1} {y1-thick}Z" fill="{INK}" '
            f'style="{anim(t, dur=0.2)}"></path>')

def glyph(x, y, ch, size, t=None, fill=INK, style=''):
    st = f' style="{anim(t)}"' if t is not None else (f' style="{style}"' if style else '')
    return f'<text x="{x}" y="{y}" font-family="\'Noto Music\'" font-size="{size}" fill="{fill}"{st}>{ch}</text>'

def taktstock(tip, base, w0, w1, hc, hr, style):
    dx, dy = tip[0] - base[0], tip[1] - base[1]; L = math.hypot(dx, dy); nx, ny = -dy / L, dx / L
    pts = [(base[0] + nx * w0 / 2, base[1] + ny * w0 / 2), (tip[0] + nx * w1 / 2, tip[1] + ny * w1 / 2),
           (tip[0] - nx * w1 / 2, tip[1] - ny * w1 / 2), (base[0] - nx * w0 / 2, base[1] - ny * w0 / 2)]
    d = 'M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in pts) + 'Z'
    ang = math.degrees(math.atan2(dy, dx)) + 90; hx, hy = hc
    return (f'<g style="{style}">'
            f'<path d="{d}" fill="#FBF7EE" stroke="{INK}" stroke-width="1.2" stroke-linejoin="round"></path>'
            f'<ellipse cx="{hx}" cy="{hy}" rx="{hr[0]}" ry="{hr[1]}" transform="rotate({ang:.1f} {hx} {hy})" fill="{GOLD}"></ellipse>'
            f'<ellipse cx="{hx-2.5}" cy="{hy-3}" rx="{hr[0]*0.35:.1f}" ry="{hr[1]*0.45:.1f}" transform="rotate({ang:.1f} {hx-2.5} {hy-3})" fill="#B08A45" opacity="0.8"></ellipse>'
            '</g>')

def build(kurz):
    end = 390 if kurz else 702
    p = []
    # Notensystem, Schlüssel, Vorzeichen, Takt
    st = '<g style="animation: fade 0.6s ease-out both">'
    st += f'<path d="' + ''.join(f'M0 {Y(s)}H{end}' for s in (G2, B2, D3, F3, A3)) + f'" stroke="{LINE}" stroke-width="1.1"></path>'
    st += glyph(4, Y(F3) + 47, '&#x1D122;', 72, fill=GOLD)
    st += glyph(67, Y(F3) + 8, '&#x266F;', 50)
    st += glyph(93, Y(D3) + 35, '&#x1D135;', 72)
    for bx in ([226] if kurz else [226, 364, 512, 584]):
        st += f'<path d="M{bx} {TOP}V{BOT}" stroke="{INK}" stroke-width="1.3"></path>'
    st += f'<path d="M{end-11} {TOP}V{BOT}" stroke="{INK}" stroke-width="1.4"></path><rect x="{end-6}" y="{TOP}" width="6" height="{BOT-TOP}" fill="{INK}"></rect>'
    st += '</g>'
    p.append(st)

    # ff
    p.append(f'<text x="136" y="{BOT+40}" font-family="\'Libre Bodoni\', Georgia, serif" font-style="italic" '
             f'font-weight="700" font-size="26" fill="{INK}" style="{anim(T(-1), dur=0.3)}">ff</text>')

    # Takt 1 (Auftakt): Triole D3 Fis3 A3, Halse nach unten, Balken unten
    xs = [146, 172, 198]; steps = [D3, F3, A3]
    by1, by2 = Y(D3) + 50, Y(A3) + 66      # Balken leicht steigend
    tt = [T(-1), T(-2/3), T(-1/3)]
    for i, (x, s) in enumerate(zip(xs, steps)):
        yb = by1 + (by2 - by1) * (x - xs[0]) / (xs[2] - xs[0])
        p.append(note(x, s, 'black', tt[i], stem_end=yb))
    p.append(beam(xs[0] - 7.2, by1 + 0.6, xs[2] - 5.6, by2 + 0.6, tt[2]))
    p.append(f'<text x="{xs[1]-10}" y="{Y(A3)-12}" font-family="\'Libre Bodoni\', Georgia, serif" font-style="italic" '
             f'font-weight="700" font-size="17" fill="{INK}" style="{anim(tt[2])}">3</text>')

    # Takt 2: ♮C4 punktierte Halbe | H3 punkt. Achtel + C4 Sechzehntel
    p.append(glyph(244, Y(C4) + 7, '&#x266E;', 46, t=T(0)))
    p.append(note(268, C4, 'half', T(0), stem_end=Y(C4) + 58, dotted=True))
    x1, x2 = 318, 344
    b1, b2 = Y(B3) + 54, Y(C4) + 58
    p.append(note(x1, B3, 'black', T(3), stem_end=b1, dotted=True))
    p.append(note(x2, C4, 'black', T(3.75), stem_end=b2))
    p.append(beam(x1 - 7.2, b1 + 0.6, x2 - 5.6, b2 + 0.6, T(3.75)))
    p.append(beam(x2 - 18, b2 - 9.5 + (b1 - b2) * 0.35, x2 - 5.6, b2 - 9.5, T(3.75), thick=6))

    if kurz:
        return fertig(p, kurz)
    # Takt 3: H3 Viertel, A3 Halbe, G3 punkt. Achtel + A3 Sechzehntel
    p.append(note(386, B3, 'black', T(4), stem_end=Y(B3) + 56))
    p.append(note(424, A3, 'half', T(5), stem_end=Y(A3) + 56))
    x1, x2 = 466, 492
    b1, b2 = Y(G3) + 54, Y(A3) + 58
    p.append(note(x1, G3, 'black', T(7), stem_end=b1, dotted=True))
    p.append(note(x2, A3, 'black', T(7.75), stem_end=b2))
    p.append(beam(x1 - 7.2, b1 + 0.6, x2 - 5.6, b2 + 0.6, T(7.75)))
    p.append(beam(x2 - 18, b2 - 9.5 + (b1 - b2) * 0.35, x2 - 5.6, b2 - 9.5, T(7.75), thick=6))

    # Takt 4: G3 Ganze
    p.append(note(542, G3, 'whole', T(8)))
    if not kurz:
        # Bogen G3 -> Fis3 (über den Köpfen) und Takt 5
        p.append(f'<path d="M546 {Y(G3)-11} Q578 {Y(G3)-30} 606 {Y(F3)-13} Q578 {Y(G3)-24} 546 {Y(G3)-11}Z" fill="{INK}" '
                 f'style="{fade(T(12))}"></path>')
        p.append(note(610, F3, 'black', T(12), stem_end=Y(F3) + 56))
        p.append(glyph(632, Y(D3) + 28, '&#x1D13D;', 52, t=T(13)))
        p.append(f'<rect x="652" y="{Y(D3)-7}" width="16" height="7" fill="{INK}" style="{anim(T(14))}"></rect>')

    return fertig(p, kurz)

def fertig(p, kurz):
    ox = (390 - 600) if kurz else (702 - 600)
    p.append(taktstock((632 + ox, 28), (710 + ox, 129), 6.5, 2.4, (716 + ox, 138), (9.5, 14),
             f"transform-box: view-box; transform-origin: {716+ox}px 138px; "
             f"animation: {{{{fuchteln}}}} {TT:.2f}s linear 0s both"))
    W = 540 if kurz else 870
    cls = 'noten-kurz' if kurz else 'noten-lang'
    disp = 'none' if kurz else 'block'
    return (f'<svg class="{cls}" viewBox="0 -6 {W} 176" width="100%" fill="none" aria-hidden="true" '
            f'style="display: {disp}; overflow: visible">\n' + '\n'.join(p) + '\n</svg>')

TT = round(DOWN + 12 * Q + 1.4, 2)
def keyframes():
    pts = [(0, -5, 'o'), (DOWN - 1.35, -5, 'o'), (DOWN - 1.0, -11, 'o'), (DOWN - 0.42, 26, 'in'), (DOWN, -22, 'out')]
    for k in range(1, 7):
        t = DOWN + k * 2 * Q
        peak = 8 if k % 2 == 1 else 22
        pts.append((t - 2 * Q * 0.55, peak, 'in'))
        pts.append((t, -22 if k % 2 == 0 else -10, 'out'))
    t6 = DOWN + 12 * Q
    pts += [(t6 + 0.45, 4, 'o'), (t6 + 1.0, -5, 'o'), (TT, -5, 'o')]
    ease = {'in': 'cubic-bezier(0.55, 0, 0.85, 0.5)', 'out': 'cubic-bezier(0.15, 0.55, 0.35, 1)', 'o': 'cubic-bezier(0.45, 0, 0.55, 1)'}
    body = ''.join(f'{100*t/TT:.2f}%{{transform:rotate({a}deg);animation-timing-function:{ease[e]}}}' for t, a, e in pts)
    return f'@keyframes fuchtelnA{{{body}}}\n@keyframes fuchtelnB{{{body}}}'
open(OUT + 'keys.txt', 'w').write(keyframes())
open(OUT + 'svg.txt', 'w').write(build(False) + '\n' + build(True))
print('ok')
