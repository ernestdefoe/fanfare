/*
 * The stage: a big centrepiece rises onto the screen for the occasion, with
 * the greeting on it, a tune to tap and play, and effects behind it.
 *
 * This is a standalone script the server adds only on a day with a moment,
 * so forum.js stays small for everyone else. It draws with plain DOM and SVG
 * (no Mithril) and gets everything forum-specific — translations, names,
 * preferences — from the host object forum.js hands it.
 */
import type { Moment, StageHost } from '../types';
import CSS from './css';
import createFX from './fx';
import { stopTune } from './music';
import { SCENES, type Scene } from './scenes';
import { watchBottom } from './bottom';
import { close } from './close';
import { wire } from './wire';
import { $, calm, focusTitle, st } from './state';

/* ------------------------------------------------------------------ */
/* open, wire, close                                                   */
/* ------------------------------------------------------------------ */
function ensure() {
  if (st.root) return;
  const style = document.createElement('style');
  style.textContent = fonts() + CSS;
  document.head.appendChild(style);

  st.root = document.createElement('section');
  st.root.className = 'FanfareStage';
  st.root.setAttribute('role', 'dialog');
  st.root.setAttribute('aria-modal', 'false');
  st.root.setAttribute('aria-labelledby', 'ffTitle');
  st.root.innerHTML =
    '<div class="Stage-back"></div><button class="Skip" type="button"><i class="fas fa-xmark" aria-hidden="true"></i> <span></span></button><div class="TopDeco"></div><div class="Piece"></div>';
  document.body.appendChild(st.root);
  $('.Skip')!.onclick = close;
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && st.current) close();
  });

  st.fx = createFX({
    reduced: calm,
    dark: () => (document.documentElement.getAttribute('data-theme') || '').startsWith('dark'),
    scale: ({ subtle: 0.5, festive: 1, full: 1.6 } as Record<string, number>)[st.host.intensity] || 1,
  });
}

/** The two display fonts ship with Fanfare (OFL): no request to a font service. */
function fonts() {
  const base = st.host.assets + '/extensions/ernestdefoe-fanfare/fonts/';
  return `@font-face{font-family:Pacifico;font-display:swap;src:url(${base}pacifico.woff2) format("woff2")}
@font-face{font-family:Creepster;font-display:swap;src:url(${base}creepster.woff2) format("woff2")}\n`;
}

function open(moment: Moment, h: StageHost) {
  st.host = h;
  ensure();
  const make = SCENES[moment.id];
  if (!make) return;

  st.timers.forEach(clearTimeout);
  st.timers = [];
  clearInterval(st.ticker);
  st.fx.stop();
  stopTune();

  const s = make(moment);
  const quiet = calm();
  st.current = moment;

  st.root.className =
    'FanfareStage show occ-' + moment.id.replace(/[^a-z_]/g, '') + (s.from === 'top' ? ' from-top' : '') + (quiet ? ' calm instant' : '');
  st.root.style.setProperty('--occ-btn', s.btn);
  st.root.style.setProperty('--occ-btn-ink', s.btnInk || '#fff');
  st.root.style.setProperty('--occ-ink', s.ink);
  st.root.style.setProperty('--spot', s.spot);
  watchBottom();
  $('.Skip span')!.textContent = st.host.t('close');
  $('.TopDeco')!.innerHTML = s.deco ? s.deco() : '';
  $('.Piece')!.innerHTML = piece(s);

  wire(s);
  st.host.onOpen?.();

  if (quiet) {
    st.root.classList.add('up');
    s.calm();
  } else {
    requestAnimationFrame(() => requestAnimationFrame(() => st.root.classList.add('up')));
    s.play();
  }

  setTimeout(focusTitle, quiet ? 0 : 1300);
}

/** The centrepiece, with the title and the plaque placed on it. */
function piece(s: Scene) {
  const box = ([top, left, width, height]: number[]) => `top:${top}%;left:${left}%;width:${width}%;height:${height}%`;
  return (
    s.svg() +
    (s.titleHtml ? `<div class="Piece-title" style="${box(s.title)}">${s.titleHtml}</div>` : '') +
    (s.footHtml ? `<div class="Piece-foot" style="${box(s.foot)}">${s.footHtml}</div>` : '')
  );
}

window.FanfareStage = { open, close, isOpen: () => !!st.current };
document.dispatchEvent(new Event('fanfare:stage'));
