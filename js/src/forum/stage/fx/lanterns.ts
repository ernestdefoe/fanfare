import { R } from './random';
import { run } from './run';
import { glow, lantern } from './sprites';
import type { Behaviour, Ember, FxState, Lantern } from './types';

function makeLantern(fx: FxState, kind: string): Lantern {
  const { W, H } = fx;
  // keep the middle clear for the centrepiece: lanterns rise beside it
  const band = Math.min(640, W * 0.5),
    side = Math.random() < 0.5;
  const x = W > 760 ? (side ? R(20, W / 2 - band / 2) : R(W / 2 + band / 2, W - 20)) : side ? R(10, W * 0.16) : R(W * 0.84, W - 10);
  return { k: 'lantern', x, y: H + R(20, 260), vx: 0, vy: -R(0.5, 1.1), sway: R(0, 6), s: W > 760 ? R(0.45, 0.95) : R(0.3, 0.5), kind, life: 1 };
}

function makeEmber(fx: FxState): Ember {
  return { k: 'ember', x: R(0, fx.W), y: fx.H + 10, vx: R(-0.3, 0.3), vy: -R(0.6, 1.8), r: R(1, 2.6), life: 1, decay: R(0.003, 0.007) };
}

export const lanternFx: Behaviour<Lantern> = {
  update(p, dt) {
    p.sway += 0.015 * dt;
    p.x += Math.sin(p.sway) * 0.35 * dt;
    p.y += p.vy * dt;
    return p.y > -100;
  },
  draw(p, { ctx, sprites }) {
    const s = 96 * p.s,
      img = p.kind === 'red' ? lantern(sprites, '#d7263d', 'red') : lantern(sprites, '#f29e38', 'amber');
    ctx.drawImage(img, p.x - s / 2, p.y - s / 2, s, s);
  },
};

export const emberFx: Behaviour<Ember> = {
  update(p, dt) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= p.decay * dt;
    return p.life > 0 && p.y > -10;
  },
  draw(p, { ctx, sprites }) {
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.drawImage(glow(sprites, '#ffc861'), p.x - p.r * 3, p.y - p.r * 3, p.r * 6, p.r * 6);
    ctx.globalAlpha = 1;
  },
};

export function lanterns(fx: FxState, kind = 'amber', n = 18) {
  if (fx.reduced()) return;
  fx.until = Date.now() + 8000;
  for (let i = 0; i < n; i++) fx.parts.push(makeLantern(fx, kind));
  fx.ambient = { k: 'ember', n: 70, rate: 0.5, make: () => makeEmber(fx) };
  run(fx);
  setTimeout(() => {
    if (fx.ambient && fx.ambient.k === 'ember') fx.ambient = null;
  }, 14000);
}
