/* Birthday: a three-tier cake with candles to blow out. viewBox 600 x 700. */
import { nr, DEFS, flame } from './art';

let seed = 7;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

/** One tier of the cake: its size, colors, and where the icing drips (angle, length, width). */
interface TierSpec {
  id: string;
  cx?: number;
  rx: number;
  top: number;
  bot: number;
  ry: number;
  side: string[];
  icing: string;
  shade: string;
  bead: number;
  drips: [number, number, number][];
}

function tier({ id, cx = 300, rx, top, bot, ry, side, icing, shade, drips, bead }: TierSpec) {
  let edge = '';
  for (let i = 0; i <= 140; i++) {
    const a = (i / 140) * Math.PI;
    let y = top + ry * Math.sin(a) + 8;
    for (const [at, len, w] of drips) y += len * Math.exp(-(((a - at) / w) ** 2));
    edge += ` L${nr(cx - rx * Math.cos(a))} ${nr(y)}`;
  }
  const drip = `M${cx - rx} ${top}${edge} L${cx + rx} ${top}Z`;
  let beads = '';
  const n = Math.round(rx / 8.5);
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI;
    beads += `<circle cx="${nr(cx - rx * Math.cos(a))}" cy="${nr(bot + ry * Math.sin(a))}" r="${bead}" fill="url(#ff-bead)"/>`;
  }
  return `<linearGradient id="ff-${id}"><stop offset="0" stop-color="${side[1]}"/><stop offset=".28" stop-color="${side[0]}"/><stop offset=".62" stop-color="${side[0]}"/><stop offset="1" stop-color="${side[2]}"/></linearGradient>
    <path d="M${cx - rx} ${top} L${cx - rx} ${bot} A${rx} ${ry} 0 0 0 ${cx + rx} ${bot} L${cx + rx} ${top}Z" fill="url(#ff-${id})"/>
    <path d="${drip}" fill="${shade}" transform="translate(0 5)"/><path d="${drip}" fill="${icing}"/>
    <ellipse cx="${cx}" cy="${top}" rx="${rx}" ry="${ry}" fill="${icing}"/>
    <ellipse cx="${cx - rx * 0.08}" cy="${top - 3}" rx="${rx * 0.82}" ry="${ry * 0.62}" fill="#fff" opacity=".35"/>${beads}`;
}

const cherry = (
  x: number,
  y: number
) => `<path d="M${x} ${y - 8} q3 -14 13 -19" stroke="#3f7d3a" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <circle cx="${x}" cy="${y}" r="10.5" fill="url(#ff-cherry)"/><circle cx="${x - 3.5}" cy="${y - 3.5}" r="3" fill="#fff" opacity=".75"/>`;

function sprinkles(x0: number, y0: number, x1: number, y1: number, n: number, ellipse?: boolean) {
  const cols = ['#ff6b9a', '#ffd166', '#5dade2', '#58d68d', '#ffffff', '#b39cff'];
  let s = '';
  for (let i = 0; i < n; i++) {
    let x: number, y: number;
    if (ellipse) {
      const a = rnd() * 6.283,
        r = Math.sqrt(rnd());
      x = x0 + Math.cos(a) * x1 * r;
      y = y0 + Math.sin(a) * y1 * r;
    } else {
      x = x0 + rnd() * (x1 - x0);
      y = y0 + rnd() * (y1 - y0);
    }
    s += `<rect x="${nr(x)}" y="${nr(y)}" width="9" height="2.8" rx="1.4" fill="${cols[i % cols.length]}" transform="rotate(${nr(rnd() * 180)} ${nr(x)} ${nr(y)})"/>`;
  }
  return s;
}

const TIERS: TierSpec[] = [
  {
    id: 't1',
    rx: 262,
    top: 448,
    bot: 640,
    ry: 34,
    side: ['#fff1dc', '#fffaf1', '#ebc89a'],
    icing: '#f78fb3',
    shade: '#d4608b',
    bead: 7.5,
    drips: [
      [0.18, 30, 0.07],
      [0.48, 40, 0.06],
      [0.82, 20, 0.07],
      [1.2, 9, 0.08],
      [1.57, 6, 0.1],
      [1.94, 9, 0.08],
      [2.32, 20, 0.07],
      [2.66, 40, 0.06],
      [2.96, 30, 0.07],
    ],
  },
  {
    id: 't2',
    rx: 205,
    top: 258,
    bot: 452,
    ry: 28,
    side: ['#f7a3c3', '#ffc6dc', '#dc7aa2'],
    icing: '#fffaf4',
    shade: '#ead6c8',
    bead: 6.5,
    drips: [
      [0.22, 18, 0.08],
      [0.6, 12, 0.07],
      [0.98, 18, 0.08],
      [1.38, 7, 0.08],
      [1.76, 7, 0.08],
      [2.16, 18, 0.08],
      [2.54, 12, 0.07],
      [2.92, 18, 0.08],
    ],
  },
  {
    id: 't3',
    rx: 130,
    top: 140,
    bot: 262,
    ry: 22,
    side: ['#bea8ee', '#d8c9f8', '#8e72d4'],
    icing: '#fffaf4',
    shade: '#e2d6f2',
    bead: 5.5,
    drips: [
      [0.3, 22, 0.1],
      [0.8, 30, 0.09],
      [1.3, 16, 0.1],
      [1.8, 30, 0.09],
      [2.3, 18, 0.1],
      [2.8, 24, 0.1],
    ],
  },
];

/** The five candles, each a button to blow out. */
function candles() {
  const xs = [214, 257, 300, 343, 386],
    bases = [151, 156, 158, 156, 151],
    cols = ['#7ee0ff', '#ffd166', '#ff8fb8', '#b39cff', '#7be3a7'];
  return xs
    .map((x, i) => {
      const b = bases[i],
        h = 64,
        t = b - h;
      return `<g class="Lamp Candle" data-i="${i}" tabindex="0" role="button" aria-label="Blow out candle ${i + 1}">
      <rect x="${x - 22}" y="${t - 60}" width="44" height="${h + 60}" fill="transparent"/>
      <rect x="${x - 8}" y="${t}" width="16" height="${h}" rx="4" fill="${cols[i]}"/>
      <rect x="${x - 8}" y="${t}" width="16" height="${h}" rx="4" fill="url(#ff-stripes)"/>
      <rect x="${x - 6}" y="${t + 2}" width="4" height="${h - 4}" rx="2" fill="#fff" opacity=".4"/>
      <path d="M${x} ${t} v-9" stroke="#3b2a22" stroke-width="2.4" stroke-linecap="round"/>
      ${flame(x, t - 7, 1, -i * 0.07)}<g class="Smoke"></g></g>`;
    })
    .join('');
}

export function cakeSVG() {
  seed = 7;
  const lit = candles();
  return `<svg viewBox="0 0 600 700"><defs>${DEFS}</defs>
    <ellipse cx="300" cy="684" rx="290" ry="16" fill="rgba(0,0,0,.28)"/>
    <ellipse cx="300" cy="666" rx="298" ry="30" fill="url(#ff-plate)"/><ellipse cx="300" cy="660" rx="284" ry="23" fill="#fbfcff"/>
    ${tier(TIERS[0])}
    ${cherry(70, 462)}${cherry(530, 462)}${cherry(116, 476)}${cherry(484, 476)}
    ${tier(TIERS[1])}
    ${cherry(118, 274)}${cherry(482, 274)}
    ${tier(TIERS[2])}
    ${sprinkles(185, 200, 415, 250, 26)}${sprinkles(300, 140, 112, 16, 18, true)}
    ${lit}</svg>`;
}
