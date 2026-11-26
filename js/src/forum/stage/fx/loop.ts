import { balloonFx } from './balloons';
import { confettiFx } from './confetti';
import { rocketFx, sparkFx } from './fireworks';
import { emberFx, lanternFx } from './lanterns';
import { leafFx } from './leaves';
import { snowFx } from './snow';
import type { Behaviour, FxState, Particle } from './types';

const KINDS: { [K in Particle['k']]: Behaviour<Extract<Particle, { k: K }>> } = {
  confetti: confettiFx,
  balloon: balloonFx,
  snow: snowFx,
  rocket: rocketFx,
  spark: sparkFx,
  lantern: lanternFx,
  leaf: leafFx,
  ember: emberFx,
};

const kind = (p: Particle) => KINDS[p.k] as Behaviour<Particle>;

/** One frame: feed the ambient effect, move and draw every particle, and keep within budget. */
export function frame(fx: FxState, t: number) {
  const dt = fx.last ? Math.min(3, (t - fx.last) / 16.67) : 1;
  fx.last = t;
  const t0 = performance.now();
  fx.ctx.clearRect(0, 0, fx.W, fx.H);
  feed(fx, dt);
  fx.parts = fx.parts.filter((p) => {
    const b = kind(p);
    const keep = b.update(p, dt, fx);
    if (keep) b.draw(p, fx);
    return keep;
  });
  if (fx.parts.length > fx.cap * 2) fx.parts.splice(0, fx.parts.length - fx.cap * 2);
  guard(fx, t0);
  if (fx.parts.length || fx.ambient) fx.raf = requestAnimationFrame(fx.tick);
  else {
    fx.raf = 0;
    fx.last = 0;
    fx.ctx.clearRect(0, 0, fx.W, fx.H);
  }
}

/** While an ambient effect lasts, top it up: fuller during its burst, a trickle after. */
function feed(fx: FxState, dt: number) {
  const now = Date.now(),
    bursting = now < fx.until;
  const ambient = fx.ambient;
  if (ambient) {
    const want = Math.round(((bursting ? 1 : 0.3) * ambient.n * fx.cap) / 260);
    const count = fx.parts.reduce((n, p) => n + (p.k === ambient.k ? 1 : 0), 0);
    if (count < want && Math.random() < ambient.rate * dt) fx.parts.push(ambient.make());
  }
}

/** frame guard: two slow frames in a row halve the budget */
function guard(fx: FxState, t0: number) {
  if (performance.now() - t0 > 12) {
    if (++fx.slow >= 2) {
      fx.cap = Math.max(40, fx.cap >> 1);
      fx.slow = 0;
    }
  } else fx.slow = 0;
}
