/* The centrepieces, drawn in code: no images to download. viewBox 600 x 700 each. */
export const nr = (n) => Math.round(n * 10) / 10;
export let seed = 7;
export const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

export const DEFS = `
  <pattern id="ff-stripes" width="11" height="11" patternUnits="userSpaceOnUse" patternTransform="rotate(38)"><rect width="4.5" height="11" fill="rgba(255,255,255,.6)"/></pattern>
  <radialGradient id="ff-flame" cx=".5" cy=".78" r=".75"><stop offset="0" stop-color="#fff4b8"/><stop offset=".45" stop-color="#ffc23d"/><stop offset="1" stop-color="#ff5f14"/></radialGradient>
  <radialGradient id="ff-glow"><stop offset="0" stop-color="rgba(255,206,110,.75)"/><stop offset=".4" stop-color="rgba(255,180,70,.28)"/><stop offset="1" stop-color="rgba(255,160,40,0)"/></radialGradient>
  <radialGradient id="ff-bead" cx=".35" cy=".35"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#efe1d4"/></radialGradient>
  <radialGradient id="ff-cherry" cx=".35" cy=".35"><stop offset="0" stop-color="#ff6b81"/><stop offset="1" stop-color="#b3123a"/></radialGradient>
  <linearGradient id="ff-plate" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#c9cfdb"/></linearGradient>
  <linearGradient id="ff-gold" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#fff0b0"/><stop offset=".45" stop-color="#e9b949"/><stop offset="1" stop-color="#a8761d"/></linearGradient>
  <filter id="ff-blur" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="4"/></filter>`;

export function flame(x, base, s = 1, delay = 0) {
  const t = base,
    h = 44 * s,
    w = 11 * s;
  return `<g class="Flame" style="transform-origin:${x}px ${t}px">
    <circle class="Glow" cx="${x}" cy="${nr(t - h * 0.5)}" r="${nr(36 * s)}" fill="url(#ff-glow)"/>
    <g class="Fl" style="transform-origin:${x}px ${t}px;animation-delay:${delay}s">
      <path d="M${x} ${t} C${nr(x - w)} ${nr(t - h * 0.16)} ${nr(x - w * 0.75)} ${nr(t - h * 0.68)} ${x} ${nr(t - h)} C${nr(x + w * 0.75)} ${nr(t - h * 0.68)} ${nr(x + w)} ${nr(t - h * 0.16)} ${x} ${t}Z" fill="url(#ff-flame)"/>
      <path d="M${x} ${nr(t - 2 * s)} C${nr(x - w * 0.45)} ${nr(t - h * 0.16)} ${nr(x - w * 0.35)} ${nr(t - h * 0.45)} ${x} ${nr(t - h * 0.62)} C${nr(x + w * 0.35)} ${nr(t - h * 0.45)} ${nr(x + w * 0.45)} ${nr(t - h * 0.16)} ${x} ${nr(t - 2 * s)}Z" fill="#fffbe6"/>
    </g></g>`;
}

export function tier({ id, cx = 300, rx, top, bot, ry, side, icing, shade, drips, bead }) {
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

export const cherry = (x, y) => `<path d="M${x} ${y - 8} q3 -14 13 -19" stroke="#3f7d3a" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <circle cx="${x}" cy="${y}" r="10.5" fill="url(#ff-cherry)"/><circle cx="${x - 3.5}" cy="${y - 3.5}" r="3" fill="#fff" opacity=".75"/>`;

export function sprinkles(x0, y0, x1, y1, n, ellipse) {
  const cols = ['#ff6b9a', '#ffd166', '#5dade2', '#58d68d', '#ffffff', '#b39cff'];
  let s = '';
  for (let i = 0; i < n; i++) {
    let x, y;
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

export function cakeSVG() {
  seed = 7;
  const xs = [214, 257, 300, 343, 386],
    bases = [151, 156, 158, 156, 151],
    cols = ['#7ee0ff', '#ffd166', '#ff8fb8', '#b39cff', '#7be3a7'];
  const candles = xs
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
  return `<svg viewBox="0 0 600 700"><defs>${DEFS}</defs>
    <ellipse cx="300" cy="684" rx="290" ry="16" fill="rgba(0,0,0,.28)"/>
    <ellipse cx="300" cy="666" rx="298" ry="30" fill="url(#ff-plate)"/><ellipse cx="300" cy="660" rx="284" ry="23" fill="#fbfcff"/>
    ${tier({
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
    })}
    ${cherry(70, 462)}${cherry(530, 462)}${cherry(116, 476)}${cherry(484, 476)}
    ${tier({
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
    })}
    ${cherry(118, 274)}${cherry(482, 274)}
    ${tier({
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
    })}
    ${sprinkles(185, 200, 415, 250, 26)}${sprinkles(300, 140, 112, 16, 18, true)}
    ${candles}</svg>`;
}

export const pts = (a) => a.map(([x, y]) => `${nr(x)},${nr(y)}`).join(' ');
export const GOLD_STOPS = `<stop offset="0" stop-color="#a8761d"/><stop offset=".35" stop-color="#f6d27a"/><stop offset=".5" stop-color="#fff3c4"/><stop offset=".65" stop-color="#e9b949"/><stop offset="1" stop-color="#9a6a16"/>`;

/* Christmas: a wrapped present (3/4 view), gold ribbon and bow; the tag is HTML so it can swing */
export function presentSVG() {
  const flake = (x, y, s, c) =>
    `<g stroke="${c}" stroke-width="${1.6 * s}" stroke-linecap="round">${[0, 60, 120].map((a) => `<path d="M${x} ${y - 7 * s} V${y + 7 * s}" transform="rotate(${a} ${x} ${y})"/>`).join('')}</g>`;
  const patt = (id, tf) => `<pattern id="ff-${id}" width="56" height="56" patternUnits="userSpaceOnUse"${tf ? ` patternTransform="${tf}"` : ''}>
      ${flake(14, 14, 1, 'rgba(255,255,255,.55)')}${flake(42, 42, 0.7, 'rgba(255,226,140,.7)')}
      <circle cx="42" cy="12" r="2" fill="rgba(255,226,140,.8)"/><circle cx="12" cy="44" r="1.6" fill="rgba(255,255,255,.6)"/></pattern>`;
  return `<svg viewBox="0 0 600 700"><defs>${DEFS}
      <linearGradient id="ff-wrapF" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ef4656"/><stop offset=".5" stop-color="#c8182b"/><stop offset="1" stop-color="#8a0d1a"/></linearGradient>
      <linearGradient id="ff-wrapS" x1="0" x2="1"><stop offset="0" stop-color="#8c0f1b"/><stop offset="1" stop-color="#5a0710"/></linearGradient>
      <linearGradient id="ff-wrapT" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#e2384a"/><stop offset="1" stop-color="#f77783"/></linearGradient>
      <linearGradient id="ff-ribV" x1="0" x2="1">${GOLD_STOPS}</linearGradient>
      <linearGradient id="ff-ribD" x1="0" y1="0" x2="1" y2="1">${GOLD_STOPS}</linearGradient>
      <linearGradient id="ff-ribH" x1="0" y1="0" x2="0" y2="1">${GOLD_STOPS}</linearGradient>
      <linearGradient id="ff-gloss" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="rgba(255,255,255,.42)"/><stop offset=".45" stop-color="rgba(255,255,255,0)"/></linearGradient>
      <linearGradient id="ff-lidShadow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(40,0,6,.55)"/><stop offset="1" stop-color="rgba(40,0,6,0)"/></linearGradient>
      <linearGradient id="ff-beamG" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="rgba(255,240,180,.95)"/><stop offset="1" stop-color="rgba(255,225,140,0)"/></linearGradient>
      ${patt('flF')}${patt('flS', 'skewY(-35)')}${patt('flT', 'skewX(-55)')}</defs>
    <ellipse cx="300" cy="618" rx="262" ry="24" fill="rgba(0,0,0,.4)"/>
    <g class="Gift" role="button" tabindex="0" aria-label="Open the present">
      <polygon points="${pts([
        [106, 312],
        [160, 274],
        [500, 274],
        [446, 312],
      ])}" fill="#3a0710"/>
      <path class="Beam" d="M120 296 L-20 -120 L640 -120 L486 290Z" fill="url(#ff-beamG)"/>
      <polygon points="${pts([
        [446, 312],
        [500, 274],
        [500, 568],
        [446, 606],
      ])}" fill="url(#ff-wrapS)"/>
      <polygon points="${pts([
        [446, 312],
        [500, 274],
        [500, 568],
        [446, 606],
      ])}" fill="url(#ff-flS)" opacity=".45"/>
      <polygon points="${pts([
        [446, 432],
        [500, 394],
        [500, 442],
        [446, 480],
      ])}" fill="url(#ff-ribD)"/>
      <rect x="106" y="312" width="340" height="294" fill="url(#ff-wrapF)"/><rect x="106" y="312" width="340" height="294" fill="url(#ff-flF)"/>
      <polygon points="${pts([
        [106, 312],
        [330, 312],
        [106, 520],
      ])}" fill="url(#ff-gloss)"/>
      <rect x="106" y="432" width="340" height="48" fill="url(#ff-ribH)"/><rect x="106" y="432" width="340" height="2" fill="rgba(90,50,0,.3)"/><rect x="106" y="478" width="340" height="2" fill="rgba(90,50,0,.3)"/>
      <rect x="251" y="312" width="50" height="294" fill="url(#ff-ribV)"/><rect x="251" y="312" width="2" height="294" fill="rgba(90,50,0,.35)"/><rect x="299" y="312" width="2" height="294" fill="rgba(90,50,0,.35)"/>
      <rect x="106" y="312" width="340" height="26" fill="url(#ff-lidShadow)"/>
      <g class="Lid">
        <polygon points="${pts([
          [460, 250],
          [514, 212],
          [514, 280],
          [460, 318],
        ])}" fill="url(#ff-wrapS)"/>
        <polygon points="${pts([
          [92, 250],
          [146, 212],
          [514, 212],
          [460, 250],
        ])}" fill="url(#ff-wrapT)"/>
        <polygon points="${pts([
          [92, 250],
          [146, 212],
          [514, 212],
          [460, 250],
        ])}" fill="url(#ff-flT)" opacity=".5"/>
        <polygon points="${pts([
          [114.5, 235],
          [482.5, 235],
          [491.5, 228.5],
          [123.5, 228.5],
        ])}" fill="url(#ff-ribD)"/>
        <polygon points="${pts([
          [251, 250],
          [305, 212],
          [355, 212],
          [301, 250],
        ])}" fill="url(#ff-ribD)"/>
        <rect x="92" y="250" width="368" height="68" rx="3" fill="url(#ff-wrapF)"/><rect x="92" y="250" width="368" height="68" fill="url(#ff-flF)"/>
        <rect x="251" y="250" width="50" height="68" fill="url(#ff-ribV)"/>
        <path d="M93 251 H459" stroke="rgba(255,255,255,.7)" stroke-width="2"/><path d="M147 213 H513" stroke="rgba(255,255,255,.5)" stroke-width="1.5"/>
        <g class="Bow">
          <path d="M300 236 Q 276 282 240 324 L258 334 L262 314 L280 324 Q 296 280 310 242Z" fill="url(#ff-ribD)"/>
          <path d="M308 236 Q 344 270 378 300 L392 286 L398 306 L384 316 Q 350 280 300 242Z" fill="url(#ff-ribD)"/>
          <path d="M303 231 C 248 156, 160 168, 188 228 C 206 266, 268 254, 303 231Z" fill="url(#ff-ribD)"/>
          <path d="M303 231 C 262 194, 214 194, 222 222 C 236 242, 276 240, 303 231Z" fill="rgba(110,60,0,.35)"/>
          <path d="M303 231 C 358 156, 446 168, 418 228 C 400 266, 338 254, 303 231Z" fill="url(#ff-ribD)"/>
          <path d="M303 231 C 344 194, 392 194, 384 222 C 370 242, 330 240, 303 231Z" fill="rgba(110,60,0,.35)"/>
          <path d="M206 206 C 222 178, 262 178, 286 206" stroke="rgba(255,255,255,.65)" stroke-width="3" fill="none" stroke-linecap="round"/>
          <path d="M330 196 C 354 176, 392 178, 404 200" stroke="rgba(255,255,255,.55)" stroke-width="3" fill="none" stroke-linecap="round"/>
          <ellipse cx="303" cy="232" rx="24" ry="18" fill="url(#ff-ribD)"/><ellipse cx="297" cy="226" rx="9" ry="5" fill="#fff" opacity=".55"/>
        </g>
      </g>
    </g></svg>`;
}

/* top-of-screen garlands: twinkling lights (Christmas) or bunting (forum birthday) */
export function topDeco(kind) {
  const W = innerWidth,
    span = W < 600 ? 190 : 300,
    sag = W < 600 ? 42 : 62,
    n = Math.ceil(W / span) + 1;
  const cols = ['#ff4d4d', '#ffd43b', '#51cf66', '#4dabf7', '#f783ac', '#ffa94d'];
  let wire = '',
    items = '',
    k = 0;
  for (let i = 0; i < n; i++) {
    const x0 = i * span - 12,
      x1 = x0 + span + 24,
      xm = (x0 + x1) / 2,
      y0 = 2,
      yc = y0 + sag * 2;
    wire += `<path d="M${x0} ${y0} Q${xm} ${yc} ${x1} ${y0}" fill="none" stroke="${kind === 'lights' ? '#1d2b22' : '#c9a35a'}" stroke-width="2"/>`;
    const m = Math.round(span / (kind === 'lights' ? 32 : 40));
    for (let j = 1; j < m; j++) {
      const t = j / m,
        u = 1 - t,
        x = u * u * x0 + 2 * u * t * xm + t * t * x1,
        y = u * u * y0 + 2 * u * t * yc + t * t * y0;
      const ang = Math.atan2(2 * u * (yc - y0) + 2 * t * (y0 - yc), 2 * u * (xm - x0) + 2 * t * (x1 - xm)) * 57.3,
        c = cols[k % 6];
      items +=
        kind === 'lights'
          ? `<g transform="translate(${nr(x)} ${nr(y)}) rotate(${nr(ang)})" style="--d:${nr((k % 14) * 0.13)}s"><circle class="bg" cy="22" r="20" fill="${c}" filter="url(#ff-lb)"/>
            <rect x="-4" y="1" width="8" height="10" rx="2" fill="#26342b"/><path class="bb" d="M0 10 C-9 14 -9 29 0 34 C9 29 9 14 0 10Z" fill="${c}"/>
            <ellipse cx="-2.6" cy="19" rx="1.7" ry="4.5" fill="#fff" opacity=".65"/></g>`
          : `<g transform="translate(${nr(x)} ${nr(y)}) rotate(${nr(ang)})"><path class="flag" style="--d:${nr((k % 7) * 0.2)}s" d="M-15 0 H15 L0 36Z" fill="${c}"/><path d="M-15 0 H15 L13 5 H-13Z" fill="rgba(255,255,255,.35)"/></g>`;
      k++;
    }
  }
  return `<svg width="${W}" height="${sag + 64}" viewBox="0 0 ${W} ${sag + 64}" aria-hidden="true"><defs><filter id="ff-lb" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="5"/></filter></defs>${wire}${items}</svg>`;
}

/* Lunar New Year: a big silk lantern that drops in, with firecracker strings */
export function lanternBigSVG() {
  const crackers = (x, side) => {
    let s = `<path d="M${x} -700 V560" stroke="#c9962f" stroke-width="2.5"/>`;
    for (let i = 0, y = 90; y < 540; i++, y += 30) {
      const rot = (i % 2 ? 28 : -28) * side;
      s += `<g class="Cracker" data-y="${y}" transform="rotate(${rot} ${x} ${y})"><path d="M${x} ${y} v6" stroke="#5a3a1a" stroke-width="2"/>
        <rect x="${x - 7}" y="${y + 6}" width="14" height="30" rx="3" fill="url(#ff-crk)"/><rect x="${x - 7}" y="${y + 18}" width="14" height="4" fill="#ffd56b"/></g>`;
    }
    return s;
  };
  let ribs = '';
  for (const rx of [52, 104, 152])
    ribs += `<ellipse cx="300" cy="330" rx="${rx}" ry="168" fill="none" stroke="rgba(110,0,12,.55)" stroke-width="3"/>`;
  return `<svg viewBox="0 0 600 700"><defs>${DEFS}
      <radialGradient id="ff-silk" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#ff6b57"/><stop offset=".5" stop-color="#e01e2e"/><stop offset="1" stop-color="#8e0c18"/></radialGradient>
      <radialGradient id="ff-inner" cx=".5" cy=".5"><stop offset="0" stop-color="rgba(255,224,130,.75)"/><stop offset="1" stop-color="rgba(255,190,80,0)"/></radialGradient>
      <linearGradient id="ff-capG" x1="0" x2="1">${GOLD_STOPS}</linearGradient>
      <linearGradient id="ff-crk" x1="0" x2="1"><stop offset="0" stop-color="#ff4b4b"/><stop offset=".5" stop-color="#d0101f"/><stop offset="1" stop-color="#7d0a14"/></linearGradient></defs>
    ${crackers(62, 1)}${crackers(538, -1)}
    <path d="M300 -700 V124" stroke="url(#ff-capG)" stroke-width="5"/>
    <rect x="248" y="118" width="104" height="18" rx="5" fill="url(#ff-capG)"/><rect x="214" y="134" width="172" height="28" rx="7" fill="url(#ff-capG)"/>
    <ellipse cx="300" cy="330" rx="200" ry="168" fill="url(#ff-silk)"/>
    <g class="Lamp noscale"><ellipse class="Flame" cx="300" cy="330" rx="170" ry="140" fill="url(#ff-inner)"/></g>
    ${ribs}<path d="M300 162 V498" stroke="rgba(110,0,12,.55)" stroke-width="3"/>
    <ellipse cx="236" cy="246" rx="44" ry="70" fill="#fff" opacity=".12" transform="rotate(20 236 246)"/>
    <rect x="214" y="494" width="172" height="28" rx="7" fill="url(#ff-capG)"/><rect x="262" y="520" width="76" height="14" rx="4" fill="url(#ff-capG)"/>
    <circle cx="300" cy="548" r="13" fill="url(#ff-capG)"/>
    ${Array.from({ length: 13 }, (_, i) => `<path d="M${294 + i} 558 Q${290 + i * 1.6} 590 ${286 + i * 2.3} 612" stroke="${i % 3 ? '#d6232f' : '#a5121e'}" stroke-width="2.4" fill="none"/>`).join('')}
    <rect x="284" y="556" width="32" height="10" rx="3" fill="url(#ff-capG)"/></svg>`;
}

/* Hanukkah: a menorah lit for tonight (night 4: shamash, then the newest candle first) */
export function menorahSVG(night = 4) {
  let arms = '',
    cups = '',
    candles = '';
  const cy = 330,
    slots = [];
  for (let k = 4; k >= 1; k--) slots.push(300 - 45 * k);
  for (let k = 1; k <= 4; k++) slots.push(300 + 45 * k);
  for (let k = 1; k <= 4; k++)
    arms += `<path d="M${300 - 45 * k} ${cy} A${45 * k} ${45 * k} 0 0 0 ${300 + 45 * k} ${cy}" fill="none" stroke="url(#ff-menG)" stroke-width="11" stroke-linecap="round"/>`;
  const cup = (x, y) =>
    `<path d="M${x - 15} ${y - 10} H${x + 15} L${x + 9} ${y + 4} H${x - 9}Z" fill="url(#ff-menG)"/><ellipse cx="${x}" cy="${y - 10}" rx="15" ry="4" fill="#fff3c4"/>`;
  slots.forEach((x) => (cups += cup(x, cy)));
  cups += cup(300, 286);
  // candles fill from the right; tonight's are lit newest (leftmost) first
  const tonight = slots.slice(8 - night);
  const candle = (
    x,
    top,
    h,
    c,
    order
  ) => `<g class="Lamp" data-order="${order}"><rect x="${x - 6}" y="${top}" width="12" height="${h}" rx="3" fill="${c}"/><rect x="${x - 6}" y="${top}" width="12" height="${h}" rx="3" fill="url(#ff-stripes)" opacity=".5"/>
      <path d="M${x} ${top} v-7" stroke="#2b2b2b" stroke-width="2" stroke-linecap="round"/>${flame(x, top - 5, 0.78, -order * 0.05)}</g>`;
  candles += candle(300, 226, 50, '#f4f6fb', 0);
  tonight.forEach((x, i) => (candles += candle(x, cy - 64, 54, i % 2 ? '#f4f6fb' : '#5c9ded', i + 1)));
  return `<svg viewBox="0 0 600 700"><defs>${DEFS}
      <linearGradient id="ff-menG" x1="0" x2="1">${GOLD_STOPS}</linearGradient>
      <radialGradient id="ff-halo2"><stop offset="0" stop-color="rgba(160,200,255,.45)"/><stop offset="1" stop-color="rgba(160,200,255,0)"/></radialGradient></defs>
    <circle cx="300" cy="330" r="290" fill="url(#ff-halo2)"/>
    ${arms}<rect x="292" y="286" width="16" height="262" rx="5" fill="url(#ff-menG)"/>
    <circle cx="300" cy="420" r="13" fill="url(#ff-menG)"/><circle cx="300" cy="476" r="11" fill="url(#ff-menG)"/>
    <path d="M228 590 Q300 560 372 590 Z" fill="url(#ff-menG)"/><path d="M262 556 H338 L362 594 H238Z" fill="url(#ff-menG)"/><ellipse cx="300" cy="594" rx="66" ry="9" fill="#a8761d"/>
    ${cups}${candles}</svg>`;
}

/* Eid: a crescent moon with hanging lanterns and twinkling stars */
export function eidSVG() {
  const fanoos = (x, top, len, i) => {
    const y = top + len;
    return `<path d="M${x} ${top} V${y}" stroke="#d9b45a" stroke-width="2"/>
      <g class="Lamp noscale" data-i="${i}">
        <circle class="Flame" cx="${x}" cy="${y + 46}" r="62" fill="url(#ff-glow)"/>
        <path d="M${x - 10} ${y + 8} Q${x} ${y - 6} ${x + 10} ${y + 8}Z" fill="url(#ff-menG)"/>
        <path d="M${x - 26} ${y + 22} Q${x} ${y + 2} ${x + 26} ${y + 22}Z" fill="url(#ff-menG)"/>
        <path d="M${x - 24} ${y + 22} H${x + 24} L${x + 20} ${y + 78} H${x - 20}Z" fill="#7a4c12"/>
        <path d="M${x - 17} ${y + 28} H${x - 3} V${y + 70} H${x - 15}Z M${x + 3} ${y + 28} H${x + 17} L${x + 15} ${y + 70} H${x + 3}Z" fill="#b8742a"/>
        <path class="Flame" d="M${x - 17} ${y + 28} H${x - 3} V${y + 70} H${x - 15}Z M${x + 3} ${y + 28} H${x + 17} L${x + 15} ${y + 70} H${x + 3}Z" fill="#ffd36b"/>
        <path d="M${x - 22} ${y + 78} H${x + 22} L${x + 12} ${y + 92} H${x - 12}Z" fill="url(#ff-menG)"/><circle cx="${x}" cy="${y + 98}" r="5" fill="url(#ff-menG)"/></g>`;
  };
  const sparkle = (x, y, s, d) =>
    `<path class="twk" style="animation-delay:${d}s" d="M${x} ${y - 12 * s} Q${x + 2 * s} ${y - 2 * s} ${x + 12 * s} ${y} Q${x + 2 * s} ${y + 2 * s} ${x} ${y + 12 * s} Q${x - 2 * s} ${y + 2 * s} ${x - 12 * s} ${y} Q${x - 2 * s} ${y - 2 * s} ${x} ${y - 12 * s}Z" fill="#fff3c4"/>`;
  return `<svg viewBox="0 0 600 700"><defs>${DEFS}
      <linearGradient id="ff-menG" x1="0" x2="1">${GOLD_STOPS}</linearGradient>
      <linearGradient id="ff-moonG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff6d0"/><stop offset=".45" stop-color="#f3cd62"/><stop offset="1" stop-color="#b8862a"/></linearGradient>
      <mask id="ff-cres"><rect width="600" height="700" fill="#fff"/><circle cx="384" cy="250" r="212" fill="#000"/></mask></defs>
    <circle cx="300" cy="290" r="250" fill="rgba(255,214,110,.35)" filter="url(#ff-blur)" mask="url(#ff-cres)"/>
    <circle cx="300" cy="290" r="236" fill="url(#ff-moonG)" mask="url(#ff-cres)"/>
    <circle cx="300" cy="290" r="226" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="3" mask="url(#ff-cres)"/>
    ${sparkle(470, 90, 1.2, 0)}${sparkle(545, 200, 0.8, -0.6)}${sparkle(520, 420, 1, -1.1)}${sparkle(420, 500, 0.7, -0.3)}${sparkle(150, 70, 0.7, -0.9)}
    ${fanoos(118, 452, 30, 0)}${fanoos(196, 508, 26, 1)}${fanoos(286, 526, 4, 2)}</svg>`;
}

/* Halloween: a carved jack-o'-lantern that lights up, a moon, and bats flying out */
export function pumpkinSVG() {
  const lobes = [
    [-150, 118, '#d9480f'],
    [150, 118, '#d9480f'],
    [-82, 142, '#f76707'],
    [82, 142, '#f76707'],
    [0, 152, '#ff922b'],
  ]
    .map(
      ([dx, rx, c]) =>
        `<ellipse cx="${300 + dx}" cy="430" rx="${rx}" ry="178" fill="${c}"/><ellipse cx="${300 + dx}" cy="430" rx="${rx}" ry="178" fill="url(#ff-pShade)"/>`
    )
    .join('');
  const face = `M206 352 L256 312 L268 372Z M394 352 L344 312 L332 372Z M300 392 L318 430 H282Z
    M176 452 Q300 560 424 452 L404 470 L388 452 L366 488 L346 468 L322 500 L300 474 L278 500 L254 468 L234 488 L212 452 L196 470Z`;
  const bat = (tx, ty, s, d) => `<g class="Bat" style="--tx:${tx}px;--ty:${ty}px;--s:${s};animation-delay:${d}s"><g class="wing">
      <path d="M0 0 C-10 -10 -24 -12 -34 -4 C-28 -2 -26 4 -28 8 C-22 4 -16 6 -14 10 C-10 4 -4 4 0 6 C4 4 10 4 14 10 C16 6 22 4 28 8 C26 4 28 -2 34 -4 C24 -12 10 -10 0 0Z" fill="#1d1426"/></g>
      <circle cx="-3" cy="1" r="1.3" fill="#ffb347"/><circle cx="3" cy="1" r="1.3" fill="#ffb347"/></g>`;
  return `<svg viewBox="0 0 600 700"><defs>${DEFS}
      <radialGradient id="ff-pShade" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="rgba(255,255,255,.28)"/><stop offset=".6" stop-color="rgba(0,0,0,0)"/><stop offset="1" stop-color="rgba(80,20,0,.45)"/></radialGradient>
      <radialGradient id="ff-carve" cx=".5" cy=".55" r=".6"><stop offset="0" stop-color="#fff6b0"/><stop offset=".5" stop-color="#ffc233"/><stop offset="1" stop-color="#ff7a00"/></radialGradient>
      <radialGradient id="ff-moon2" cx=".4" cy=".4"><stop offset="0" stop-color="#fffbe6"/><stop offset="1" stop-color="#f2dca0"/></radialGradient></defs>
    <circle cx="470" cy="160" r="120" fill="rgba(255,240,190,.25)" filter="url(#ff-blur)"/><circle cx="470" cy="160" r="96" fill="url(#ff-moon2)"/>
    <circle cx="440" cy="140" r="14" fill="rgba(200,170,100,.35)"/><circle cx="492" cy="190" r="9" fill="rgba(200,170,100,.3)"/>
    <ellipse cx="300" cy="612" rx="250" ry="22" fill="rgba(0,0,0,.4)"/>
    <path d="M292 262 C 288 226, 296 200, 322 186 L332 198 C 312 212, 308 236, 312 264Z" fill="#5c7a2e"/>
    <path d="M318 214 C 350 196, 380 214, 372 236 C 350 236, 332 228, 318 214Z" fill="#6f9a3a"/>
    ${lobes}
    <path d="${face}" fill="#3b1600"/>
    <g class="Lamp noscale"><circle class="Flame" cx="300" cy="420" r="210" fill="rgba(255,200,60,.22)" filter="url(#ff-blur)"/><path class="Flame flick" d="${face}" fill="url(#ff-carve)"/></g>
    ${bat(-220, -150, 2.4, 0)}${bat(205, -250, 2, 0.25)}${bat(-150, -275, 1.5, 0.5)}${bat(250, -40, 1.7, 0.7)}${bat(-40, -190, 1.3, 0.9)}</svg>`;
}

/* Thanksgiving: an autumn leaf wreath that grows in, with a burlap bow */
export function wreathSVG() {
  const leaf = 'M0 -30 L6 -14 L18 -20 L14 -6 L28 -4 L16 6 L20 18 L6 12 L2 26 L-2 26 L-6 12 L-20 18 L-16 6 L-28 -4 L-14 -6 L-18 -20 L-6 -14Z';
  const ring = (n, r, s, off, cols) =>
    Array.from(
      { length: n },
      (_, i) =>
        `<g transform="rotate(${nr((360 / n) * i + off)} 300 262) translate(300 ${262 - r}) rotate(${i % 2 ? 18 : -14}) scale(${s})"><path d="${leaf}" fill="${cols[i % cols.length]}"/><path d="M0 -24 V24" stroke="rgba(80,30,0,.45)" stroke-width="1.6"/></g>`
    ).join('');
  const berries = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * 6.283 + 0.2;
    return `<circle cx="${nr(300 + Math.cos(a) * 200)}" cy="${nr(262 + Math.sin(a) * 200)}" r="7" fill="#b3123a"/><circle cx="${nr(298 + Math.cos(a) * 200)}" cy="${nr(260 + Math.sin(a) * 200)}" r="2.2" fill="#fff" opacity=".6"/>`;
  }).join('');
  return `<svg viewBox="0 0 600 700"><defs>${DEFS}
      <radialGradient id="ff-disc2" cx=".5" cy=".42"><stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#f6e2bf"/></radialGradient></defs>
    <g class="Ring" style="--d:.1s">${ring(22, 222, 2, 0, ['#b8321f', '#e8590c', '#f2a516', '#c2410c', '#8f2d14'])}</g>
    <g class="Ring" style="--d:.35s">${ring(20, 190, 1.6, 9, ['#f2a516', '#c2410c', '#e8590c', '#a8a31d'])}${berries}</g>
    <g class="Ring" style="--d:.6s"><circle cx="300" cy="262" r="152" fill="url(#ff-disc2)" stroke="#a0522d" stroke-width="5"/><circle cx="300" cy="262" r="140" fill="none" stroke="rgba(160,82,45,.35)" stroke-dasharray="3 7" stroke-width="3"/></g>
    <g transform="translate(300 488)"><path d="M0 0 C-40 -36 -96 -20 -70 14 C-54 32 -20 16 0 0Z M0 0 C40 -36 96 -20 70 14 C54 32 20 16 0 0Z" fill="#c9a36b"/>
      <path d="M-6 6 L-34 74 L-20 66 L-12 80 L4 10Z M6 6 L34 74 L20 66 L12 80 L-4 10Z" fill="#b48c55"/><ellipse cx="0" cy="2" rx="15" ry="12" fill="#b48c55"/></g></svg>`;
}

/* The forum's own birthday: a foil number balloon, a balloon bunch and a plaque */
export function forumSVG(age = 6) {
  const b = (
    x,
    y,
    r,
    c,
    d
  ) => `<g class="Bob" style="animation-delay:${d}s"><path d="M${x} ${y + r} Q${x + (300 - x) * 0.3} ${y + r + 80} 300 548" stroke="rgba(255,255,255,.55)" stroke-width="1.6" fill="none"/>
      <ellipse cx="${x}" cy="${y}" rx="${r * 0.86}" ry="${r}" fill="${c}"/><ellipse cx="${x}" cy="${y}" rx="${r * 0.86}" ry="${r}" fill="url(#ff-bShade)"/>
      <ellipse cx="${x - r * 0.3}" cy="${y - r * 0.38}" rx="${r * 0.16}" ry="${r * 0.28}" fill="#fff" opacity=".6" transform="rotate(-25 ${x - r * 0.3} ${y - r * 0.38})"/>
      <path d="M${x - 6} ${y + r + 6} L${x + 6} ${y + r + 6} L${x} ${y + r - 2}Z" fill="${c}"/></g>`;
  return `<svg viewBox="0 0 600 700"><defs>${DEFS}
      <linearGradient id="ff-foil" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3c4"/><stop offset=".3" stop-color="#f2c94c"/><stop offset=".55" stop-color="#fff0b0"/><stop offset=".8" stop-color="#d4a12e"/><stop offset="1" stop-color="#9a6a16"/></linearGradient>
      <radialGradient id="ff-bShade" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="rgba(255,255,255,.25)"/><stop offset=".6" stop-color="rgba(0,0,0,0)"/><stop offset="1" stop-color="rgba(0,0,0,.3)"/></radialGradient>
      <linearGradient id="ff-plaque2" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#eef2f8"/></linearGradient></defs>
    ${b(112, 210, 68, '#ff6b9a', 0)}${b(178, 98, 56, '#5dade2', -0.8)}${b(486, 200, 70, '#58d68d', -0.4)}${b(424, 92, 56, '#b39cff', -1.2)}${b(98, 360, 58, '#ffd166', -1.6)}${b(504, 352, 60, '#ff7f50', -0.2)}
    <g class="Bob" style="animation-delay:-.6s"><path d="M300 470 Q290 510 300 548" stroke="rgba(255,255,255,.6)" stroke-width="2" fill="none"/>
      <text x="306" y="476" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="420" fill="rgba(0,0,0,.22)">${age}</text>
      <text x="300" y="466" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="420" fill="url(#ff-foil)" stroke="#b8862a" stroke-width="7" paint-order="stroke">${age}</text>
      <ellipse cx="248" cy="196" rx="20" ry="52" fill="#fff" opacity=".5" transform="rotate(28 248 196)"/></g>
    <rect x="80" y="494" width="440" height="198" rx="26" fill="url(#ff-plaque2)" stroke="url(#ff-gold)" stroke-width="4"/></svg>`;
}

export function clockSVG() {
  let ticks = '';
  for (let i = 0; i < 60; i++) {
    const a = (i * Math.PI) / 30 - Math.PI / 2;
    if (i % 5) ticks += `<circle cx="${nr(300 + Math.cos(a) * 200)}" cy="${nr(262 + Math.sin(a) * 200)}" r="2.4" fill="#8f9bd6"/>`;
    else ticks += `<rect x="296" y="56" width="8" height="30" rx="4" fill="url(#ff-gold)" transform="rotate(${i * 6} 300 262)"/>`;
  }
  return `<svg viewBox="0 0 600 700"><defs>${DEFS}
      <radialGradient id="ff-face" cx=".5" cy=".42"><stop offset="0" stop-color="#2a3283"/><stop offset="1" stop-color="#0a0f2e"/></radialGradient>
      <linearGradient id="ff-plaque" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#1f2560"/><stop offset="1" stop-color="#0c1033"/></linearGradient></defs>
    <circle class="Halo" cx="300" cy="262" r="252" fill="none" stroke="#ffd36b" stroke-width="10" filter="url(#ff-blur)"/>
    <path d="M270 496 L330 496 L344 552 L256 552Z" fill="url(#ff-gold)"/>
    <rect x="104" y="544" width="392" height="146" rx="24" fill="url(#ff-plaque)" stroke="url(#ff-gold)" stroke-width="4"/>
    <circle cx="300" cy="262" r="240" fill="url(#ff-gold)"/><circle cx="300" cy="262" r="224" fill="#151a44"/><circle cx="300" cy="262" r="218" fill="url(#ff-face)"/>
    ${ticks}
    <text x="300" y="124" text-anchor="middle" font-family="Georgia, serif" font-size="30" font-weight="700" fill="#f1c95a" letter-spacing="2">XII</text>
    <g class="Hand" id="ff-hHour"><rect x="294" y="152" width="12" height="118" rx="6" fill="url(#ff-gold)"/></g>
    <g class="Hand" id="ff-hMin"><rect x="296.5" y="96" width="7" height="174" rx="3.5" fill="url(#ff-gold)"/></g>
    <g class="Hand" id="ff-hSec"><rect x="298.7" y="76" width="2.6" height="226" rx="1.3" fill="#ff6b6b"/><circle cx="300" cy="292" r="7" fill="#ff6b6b"/></g>
    <circle cx="300" cy="262" r="12" fill="url(#ff-gold)"/><circle cx="300" cy="262" r="4" fill="#151a44"/></svg>`;
}

export function rangoliSVG() {
  const petal = (r0, r1, w) =>
    `M300 ${262 - r0} C${300 - w} ${nr(262 - r0 - (r1 - r0) * 0.35)} ${300 - w * 0.7} ${nr(262 - r1 + (r1 - r0) * 0.2)} 300 ${262 - r1} C${300 + w * 0.7} ${nr(262 - r1 + (r1 - r0) * 0.2)} ${300 + w} ${nr(262 - r0 - (r1 - r0) * 0.35)} 300 ${262 - r0}Z`;
  const ring = (n, r0, r1, w, cols, dot) =>
    Array.from(
      { length: n },
      (_, i) =>
        `<g transform="rotate(${nr((360 / n) * i)} 300 262)"><path d="${petal(r0, r1, w)}" fill="${cols[i % cols.length]}"/>${dot ? `<circle cx="300" cy="${262 - (r0 + r1) / 2}" r="3.4" fill="#fff8e1"/>` : ''}</g>`
    ).join('');
  const dots = (n, r, s, c) =>
    Array.from({ length: n }, (_, i) => {
      const a = (i / n) * 6.283;
      return `<circle cx="${nr(300 + Math.cos(a) * r)}" cy="${nr(262 + Math.sin(a) * r)}" r="${s}" fill="${c}"/>`;
    }).join('');
  const diyas = Array.from({ length: 7 }, (_, i) => {
    const x = 300 + (i - 3) * 74,
      y = 548 + Math.abs(i - 3) ** 2 * 2.5;
    return `<g class="Lamp" data-i="${i}">
      <ellipse cx="${x}" cy="${y + 22}" rx="34" ry="7" fill="rgba(0,0,0,.25)"/>
      <path d="M${x - 32} ${y} C${x - 30} ${y + 27} ${x + 30} ${y + 27} ${x + 32} ${y} L${x + 40} ${y - 6} L${x + 30} ${y - 1}Z" fill="url(#ff-clay)"/>
      <ellipse cx="${x}" cy="${y}" rx="32" ry="7" fill="#ffd43b"/><ellipse cx="${x}" cy="${y}" rx="26" ry="4.6" fill="#7a3b06"/>
      <circle cx="${x - 14}" cy="${y + 11}" r="2.4" fill="#ffd43b"/><circle cx="${x}" cy="${y + 14}" r="2.4" fill="#ffd43b"/><circle cx="${x + 14}" cy="${y + 11}" r="2.4" fill="#ffd43b"/>
      ${flame(x + 30, y - 4, 0.78, -i * 0.05)}</g>`;
  }).join('');
  return `<svg viewBox="0 0 600 700"><defs>${DEFS}
      <radialGradient id="ff-disc" cx=".5" cy=".45"><stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#ffe2b3"/></radialGradient>
      <linearGradient id="ff-clay" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#f76707"/><stop offset="1" stop-color="#a33a05"/></linearGradient></defs>
    <g class="Ring" style="--d:.15s"><g class="spin">${ring(24, 196, 252, 22, ['#e64980', '#f76707', '#ae3ec9'], true)}</g></g>
    <g class="Ring" style="--d:.45s">${dots(48, 190, 3.2, '#fff3bf')}${ring(16, 158, 194, 17, ['#fab005', '#2f9e44', '#fab005', '#1c7ed6'])}</g>
    <g class="Ring" style="--d:.75s"><circle cx="300" cy="262" r="152" fill="url(#ff-disc)" stroke="#f59f00" stroke-width="5"/>${dots(36, 140, 2.6, '#f59f00')}</g>
    ${diyas}</svg>`;
}

export function medalSVG(years) {
  const pleats = Array.from({ length: 36 }, (_, i) => {
    const a0 = (i / 36) * 6.283,
      a1 = ((i + 1) / 36) * 6.283,
      am = (a0 + a1) / 2;
    const p = (a, r) => `${nr(300 + Math.cos(a) * r)} ${nr(250 + Math.sin(a) * r)}`;
    return `<path d="M${p(a0, 170)} L${p(am, 240)} L${p(a1, 170)}Z" fill="${i % 2 ? '#3f5f8f' : '#5b7db3'}"/>`;
  }).join('');
  const star = (cx, cy, r1, r2) =>
    Array.from({ length: 10 }, (_, i) => {
      const a = -Math.PI / 2 + (i * Math.PI) / 5,
        r = i % 2 ? r2 : r1;
      return `${nr(cx + Math.cos(a) * r)},${nr(cy + Math.sin(a) * r)}`;
    }).join(' ');
  const n = Math.min(years, 10),
    span = Math.min(120, 24 * n);
  const stars = Array.from({ length: n }, (_, i) => {
    const a = ((-90 - span / 2 + (n === 1 ? span / 2 : (span * i) / (n - 1))) * Math.PI) / 180,
      x = 300 + Math.cos(a) * 128,
      y = 250 + Math.sin(a) * 128;
    return `<g class="Lamp YearStar" data-i="${i}"><circle class="Flame" style="transform-origin:${nr(x)}px ${nr(y)}px" cx="${nr(x)}" cy="${nr(y)}" r="26" fill="url(#ff-glow)"/>
      <polygon points="${star(x, y, 15, 6.5)}" fill="#1e2d4d"/><polygon class="Flame" style="transform-origin:${nr(x)}px ${nr(y)}px" points="${star(x, y, 15, 6.5)}" fill="url(#ff-gold)"/></g>`;
  }).join('');
  const leaf = (x, y, rot) => `<ellipse cx="${x}" cy="${y}" rx="13" ry="5" transform="rotate(${rot} ${x} ${y})" fill="url(#ff-gold)"/>`;
  let laurel = '';
  for (let i = 0; i < 9; i++) {
    for (const side of [1, -1]) {
      const deg = 168 - i * 9,
        a = ((side === 1 ? deg : 180 - deg) * Math.PI) / 180;
      for (const [r, tilt] of [
        [146, 32],
        [146, -32],
      ]) {
        const x = nr(300 + Math.cos(a) * r),
          y = nr(250 + Math.sin(a) * r);
        laurel += leaf(x, y, nr((side === 1 ? deg : 180 - deg) + 90 + tilt * side));
      }
    }
  }
  return `<svg viewBox="0 0 600 700"><defs>${DEFS}
      <radialGradient id="ff-medal" cx=".45" cy=".38"><stop offset="0" stop-color="#2f4c86"/><stop offset="1" stop-color="#14203f"/></radialGradient>
      <linearGradient id="ff-tail" x1="0" x2="1"><stop offset="0" stop-color="#2d4a7a"/><stop offset=".5" stop-color="#5b7db3"/><stop offset="1" stop-color="#2d4a7a"/></linearGradient>
      <linearGradient id="ff-plaque2" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#eef2f8"/></linearGradient></defs>
    <path d="M232 380 L188 610 L222 588 L250 622 L282 400Z" fill="url(#ff-tail)"/><path d="M368 380 L412 610 L378 588 L350 622 L318 400Z" fill="url(#ff-tail)"/>
    ${pleats}<circle cx="300" cy="250" r="176" fill="url(#ff-gold)"/><circle cx="300" cy="250" r="164" fill="url(#ff-medal)"/>
    <circle cx="300" cy="250" r="156" fill="none" stroke="rgba(255,226,140,.45)" stroke-width="1.5" stroke-dasharray="2 6"/>
    ${stars}
    <rect x="80" y="494" width="440" height="198" rx="26" fill="url(#ff-plaque2)" stroke="url(#ff-gold)" stroke-width="4"/></svg>`;
}
