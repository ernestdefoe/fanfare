import { R } from './random';
import { run } from './run';
import type { Behaviour, FxState, Snow } from './types';

function makeSnow(fx: FxState): Snow {
  return { k: 'snow', x: R(0, fx.W), y: R(-40, -5), vx: R(-0.4, 0.4), vy: R(0.6, 1.8), r: R(1.6, 4.2), sway: R(0, 6), life: 1 };
}

export const snowFx: Behaviour<Snow> = {
  update(p, dt, fx) {
    p.sway += 0.02 * dt;
    p.x += (p.vx + Math.sin(p.sway) * 0.35) * dt;
    p.y += p.vy * dt;
    return p.y < fx.H + 10;
  },
  draw(p, { ctx, dark }) {
    ctx.fillStyle = dark() ? 'rgba(255,255,255,.85)' : 'rgba(150,180,215,.85)';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, 7);
    ctx.fill();
  },
};

export function snow(fx: FxState, n = 160) {
  if (fx.reduced()) return;
  fx.until = Date.now() + 7000;
  fx.ambient = { k: 'snow', n, rate: 0.9, make: () => makeSnow(fx) };
  for (let i = 0; i < n * 0.5; i++) {
    const p = makeSnow(fx);
    p.y = R(-10, fx.H);
    fx.parts.push(p);
  }
  run(fx);
}
