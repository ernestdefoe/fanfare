import type { FxState } from './types';

/** Start the loop if it isn't running (and motion isn't reduced). */
export function run(fx: FxState) {
  if (!fx.raf && !fx.reduced()) {
    fx.last = 0;
    fx.raf = requestAnimationFrame(fx.tick);
  }
}
