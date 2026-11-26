/*
 * What the stage's modules share: the host forum.js handed over, the effects,
 * the stage element, pending timers, and small DOM and text helpers.
 */
import type { Moment, StageHost } from '../types';
import type { FX } from './fx';

export interface StageState {
  host: StageHost;
  fx: FX;
  root: HTMLElement;
  timers: number[];
  ticker: number;
  current: Moment | null;
}

/** Set by open() before anything else reads it. */
export const st: StageState = {
  host: null as unknown as StageHost,
  fx: null as unknown as FX,
  root: null as unknown as HTMLElement,
  timers: [],
  ticker: 0,
  current: null,
};

export const later = (fn: () => void, ms: number) => st.timers.push(window.setTimeout(fn, ms));
export const $ = <E extends Element = HTMLElement>(s: string) => st.root.querySelector<E>(s);
export const $$ = <E extends Element = HTMLElement>(s: string) => Array.from(st.root.querySelectorAll<E>(s));
export const lamps = () => $$('.Piece .Lamp');
export const esc = (s: unknown) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) => (({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }) as Record<string, string>)[c]
  );
export const t = (key: string, params?: Record<string, unknown>) => esc(st.host.t(key, params));
export const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches || !st.host.effects() || !!st.host.quiet;

export function focusTitle() {
  const el = st.root && st.root.querySelector<HTMLElement>('#ffTitle');
  if (el && el.offsetParent) el.focus({ preventScroll: true });
}
