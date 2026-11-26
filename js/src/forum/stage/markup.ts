/* The scenes' small pieces: dates and ordinals in the member's locale, the buttons, and safe colors and links. */
import { st, t } from './state';

export const ANIMALS = ['rat', 'ox', 'tiger', 'rabbit', 'dragon', 'snake', 'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig'];

export function ordinal(n: number) {
  if (!/^en/.test(st.host.locale)) return `${n}.`;
  const rule = new Intl.PluralRules('en', { type: 'ordinal' }).select(n);
  return n + (({ one: 'st', two: 'nd', few: 'rd' } as Record<string, string>)[rule] || 'th');
}

export function formatDate(iso: string) {
  const d = new Date(iso.length === 10 ? iso + 'T12:00:00' : iso);
  return new Intl.DateTimeFormat(st.host.locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(d);
}

export const playBtn = (key = 'play') =>
  `<button class="Play" id="ffPlay" type="button"><span class="note" aria-hidden="true">♪</span><span class="eq" aria-hidden="true"><i></i><i></i><i></i></span><span class="lbl">${t(key)}</span><span class="prog"></span></button>`;
/** Titles past about 24 characters step down a size so they stay on the plaque. */
export const long = (text: unknown) => (String(text).length > 24 ? ' long' : '');
export const muteBtn = () => `<button class="PRound" id="ffMute" type="button"></button>`;
/** A color from Festoon: a hex value or the fallback, never anything that could leave the attribute. */
export const color = (value: unknown, fallback: string) => (/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(String(value)) ? (value as string) : fallback);
export const hexA = (hex: string, a: number) => {
  const h = hex.length === 4 ? hex.replace(/[0-9a-f]/gi, (c) => c + c).slice(1) : hex.slice(1);
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
};
/** Only http(s) links: the certificate's page on this forum. */
export const safeUrl = (url: unknown) => (/^https?:\/\//i.test(String(url)) ? url : '#');
