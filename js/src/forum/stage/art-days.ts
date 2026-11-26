/* Centrepieces for days that come from other extensions: a Syllabus course completed, a Festoon day of the admin's own. viewBox 600 x 700. */
import { nr, DEFS } from './art';

/* A course completed: a mortarboard over a rolled diploma tied with a ribbon, and a plaque */
export function gradSVG() {
  const sparkle = (x: number, y: number, s: number, d: number) =>
    `<path class="twk" style="animation-delay:${d}s" d="M${x} ${y - 12 * s} Q${x + 2 * s} ${y - 2 * s} ${x + 12 * s} ${y} Q${x + 2 * s} ${y + 2 * s} ${x} ${y + 12 * s} Q${x - 2 * s} ${y + 2 * s} ${x - 12 * s} ${y} Q${x - 2 * s} ${y - 2 * s} ${x} ${y - 12 * s}Z" fill="#ffe08a"/>`;
  return `<svg viewBox="0 0 600 700"><defs>${DEFS}
      <linearGradient id="ff-paper" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#efe2c4"/></linearGradient>
      <linearGradient id="ff-roll" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#e9dbb8"/><stop offset=".5" stop-color="#fffaf0"/><stop offset="1" stop-color="#d8c69c"/></linearGradient>
      <linearGradient id="ff-board" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#3a3f58"/><stop offset="1" stop-color="#141726"/></linearGradient>
      <linearGradient id="ff-gplaque" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#f1f4fa"/></linearGradient></defs>
    <circle cx="300" cy="300" r="230" fill="rgba(255,214,110,.28)" filter="url(#ff-blur)"/>
    ${sparkle(110, 120, 1, 0)}${sparkle(500, 150, 1.2, -0.7)}${sparkle(470, 400, 0.8, -1.2)}${sparkle(130, 380, 0.7, -0.4)}
    <g class="Diploma">
      <path d="M150 330 L450 300 L450 380 L150 410Z" fill="url(#ff-paper)" stroke="#c9b27a" stroke-width="2"/>
      <ellipse cx="150" cy="370" rx="22" ry="40" fill="url(#ff-roll)" stroke="#c9b27a" stroke-width="2"/>
      <ellipse cx="450" cy="340" rx="22" ry="40" fill="url(#ff-roll)" stroke="#c9b27a" stroke-width="2"/>
      <path d="M200 352 L400 331 M200 372 L380 353 M200 392 L360 375" stroke="#d8c69c" stroke-width="4" stroke-linecap="round"/>
      <path d="M292 312 L292 404 M312 310 L312 402" stroke="#b3123a" stroke-width="14"/>
      <path d="M302 400 L282 470 L298 458 L310 478 Z M302 400 L330 466 L314 458 L306 480Z" fill="#c2385f"/>
      <g class="Lamp" data-i="0"><circle class="Flame" cx="302" cy="400" r="40" fill="url(#ff-glow)"/>
        <circle cx="302" cy="400" r="24" fill="url(#ff-gold)" stroke="#a8761d" stroke-width="2"/>
        <circle cx="302" cy="400" r="15" fill="none" stroke="#fff3c4" stroke-width="2" stroke-dasharray="3 4"/></g>
    </g>
    <g class="Cap">
      <path d="M220 214 Q300 262 380 214 L380 268 Q300 312 220 268Z" fill="#1f2335"/>
      <path d="M300 120 L470 190 L300 262 L130 190Z" fill="url(#ff-board)"/>
      <path d="M300 120 L470 190 L300 262 L130 190Z" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="2"/>
      <circle cx="300" cy="191" r="9" fill="url(#ff-gold)"/>
      <path class="Tassel" d="M300 191 Q380 196 418 214 L418 272" stroke="url(#ff-gold)" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path class="Tassel" d="M408 266 L428 266 L434 318 L402 318Z" fill="url(#ff-gold)"/>
    </g>
    <rect x="60" y="500" width="480" height="192" rx="26" fill="url(#ff-gplaque)" stroke="url(#ff-gold)" stroke-width="4"/></svg>`;
}

/* A Festoon day of the admin's own: a ribbon rosette in its two colors with its emoji at the heart */
export function rosetteSVG(primary: string, secondary: string, emoji: string) {
  const pleats = Array.from({ length: 40 }, (_, i) => {
    const a0 = (i / 40) * 6.283,
      a1 = ((i + 1) / 40) * 6.283,
      am = (a0 + a1) / 2;
    const p = (a: number, r: number) => `${nr(300 + Math.cos(a) * r)} ${nr(250 + Math.sin(a) * r)}`;
    return `<path d="M${p(a0, 150)} L${p(am, 226)} L${p(a1, 150)}Z" fill="${i % 2 ? primary : secondary}"/>`;
  }).join('');
  const sparkle = (x: number, y: number, s: number, d: number) =>
    `<path class="twk" style="animation-delay:${d}s" d="M${x} ${y - 12 * s} Q${x + 2 * s} ${y - 2 * s} ${x + 12 * s} ${y} Q${x + 2 * s} ${y + 2 * s} ${x} ${y + 12 * s} Q${x - 2 * s} ${y + 2 * s} ${x - 12 * s} ${y} Q${x - 2 * s} ${y - 2 * s} ${x} ${y - 12 * s}Z" fill="#fff"/>`;
  return `<svg viewBox="0 0 600 700"><defs>${DEFS}
      <radialGradient id="ff-heart" cx=".42" cy=".36"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#eef1f6"/></radialGradient>
      <linearGradient id="ff-cplaque" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#f1f4fa"/></linearGradient></defs>
    <circle cx="300" cy="250" r="250" fill="${primary}" opacity=".22" filter="url(#ff-blur)"/>
    <path d="M236 360 L190 600 L226 578 L254 614 L284 380Z" fill="${primary}"/><path d="M364 360 L410 600 L374 578 L346 614 L316 380Z" fill="${secondary}"/>
    ${pleats}
    <circle cx="300" cy="250" r="158" fill="url(#ff-gold)"/>
    <g class="Lamp" data-i="0"><circle class="Flame" cx="300" cy="250" r="170" fill="url(#ff-glow)" opacity=".55"/></g>
    <circle cx="300" cy="250" r="144" fill="url(#ff-heart)"/>
    <circle cx="300" cy="250" r="132" fill="none" stroke="${primary}" stroke-width="2" stroke-dasharray="3 7" opacity=".6"/>
    ${emoji ? `<text class="RosetteEmoji" x="300" y="252" text-anchor="middle" dominant-baseline="central" font-size="150">${emoji}</text>` : `<circle cx="300" cy="250" r="40" fill="url(#ff-gold)"/>`}
    ${sparkle(120, 90, 1, 0)}${sparkle(500, 110, 1.2, -0.6)}${sparkle(530, 380, 0.8, -1.1)}${sparkle(80, 330, 0.7, -0.3)}
    <rect x="70" y="500" width="460" height="192" rx="26" fill="url(#ff-cplaque)" stroke="url(#ff-gold)" stroke-width="4"/></svg>`;
}
