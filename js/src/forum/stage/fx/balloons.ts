import { R, pick } from './random';
import { run } from './run';
import { balloon } from './sprites';
import type { Balloon, Behaviour, FxState } from './types';

function makeBalloon(fx: FxState): Balloon {
  return {
    k: 'balloon',
    x: R(20, fx.W - 20),
    y: fx.H + R(20, 200),
    vx: 0,
    vy: -R(1.3, 2.4),
    sway: R(0, 6),
    s: R(0.7, 1.15),
    col: pick(['#ff6b9a', '#ffb347', '#5dade2', '#a569bd', '#58d68d', '#ff7f50']),
    life: 1,
  };
}

export const balloonFx: Behaviour<Balloon> = {
  update(p, dt) {
    p.sway += 0.02 * dt;
    p.x += Math.sin(p.sway) * 0.6 * dt;
    p.y += p.vy * dt;
    return p.y > -120;
  },
  draw(p, fx) {
    const ctx = fx.ctx;
    const s = 80 * p.s,
      img = balloon(fx.sprites, p.col);
    ctx.strokeStyle = fx.dark() ? 'rgba(255,255,255,.35)' : 'rgba(60,60,80,.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y + s * 0.4);
    ctx.quadraticCurveTo(p.x + Math.sin(p.sway * 2) * 10, p.y + s * 0.8, p.x, p.y + s * 1.25);
    ctx.stroke();
    ctx.drawImage(img, p.x - s / 2, p.y - s / 2, s, s);
  },
};

export function balloons(fx: FxState, n = 14) {
  if (fx.reduced()) return;
  for (let i = 0; i < n; i++) fx.parts.push(makeBalloon(fx));
  run(fx);
}
