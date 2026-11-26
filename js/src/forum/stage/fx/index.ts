/*
 * The effects layer: one fixed canvas, a particle pool and a frame guard.
 * Two slow frames in a row halve the budget; the loop stops when the tab is
 * hidden and when nothing is left to draw.
 */
import { balloons } from './balloons';
import { CONF, pop, throwConfetti } from './confetti';
import { fireworks, sparkle } from './fireworks';
import { lanterns } from './lanterns';
import { leaves } from './leaves';
import { frame } from './loop';
import { run } from './run';
import { snow } from './snow';
import type { FxOptions, FxState } from './types';

export type FX = ReturnType<typeof createFX>;

export default function createFX(opts: FxOptions) {
  const { reduced, dark, scale = 1 } = opts;
  const c = document.createElement('canvas');
  c.id = 'FanfareFx';
  c.setAttribute('aria-hidden', 'true');
  document.body.appendChild(c);
  const fx: FxState = {
    ctx: c.getContext('2d')!,
    W: 0,
    H: 0,
    parts: [],
    raf: 0,
    last: 0,
    slow: 0,
    cap: Math.round(260 * scale),
    ambient: null,
    until: 0,
    pal: CONF,
    sprites: {},
    scale,
    reduced,
    dark,
    tick: (t) => frame(fx, t),
  };
  follow(c, fx);
  return effects(fx);
}

/** Keep the canvas the size of the window, and the loop paused while the tab is hidden. */
function follow(c: HTMLCanvasElement, fx: FxState) {
  function resize() {
    const dpr = Math.min(1.5, devicePixelRatio || 1);
    fx.W = innerWidth;
    fx.H = innerHeight;
    c.width = fx.W * dpr;
    c.height = fx.H * dpr;
    fx.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(fx.raf);
      fx.raf = 0;
    } else if (fx.parts.length || fx.ambient) run(fx);
  });
}

function effects(fx: FxState) {
  return {
    stop() {
      fx.parts = [];
      fx.ambient = null;
    },
    /** Nothing new falls; what is already falling finishes. */
    settle() {
      fx.ambient = null;
    },
    confetti: (n?: number, p?: string[]) => throwConfetti(fx, n, p),
    pop: (x: number, y: number, n?: number, p?: string[]) => pop(fx, x, y, n, p),
    sparkle: (x: number, y: number, n?: number, cols?: string[]) => sparkle(fx, x, y, n, cols),
    leaves: (n?: number) => leaves(fx, n),
    balloons: (n?: number) => balloons(fx, n),
    snow: (n?: number) => snow(fx, n),
    fireworks: (seconds?: number) => fireworks(fx, seconds),
    lanterns: (kind?: string, n?: number) => lanterns(fx, kind, n),
  };
}
