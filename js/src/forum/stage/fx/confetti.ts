import { R, pick } from './random';
import { run } from './run';
import type { Behaviour, Confetti, FxState } from './types';

export const CONF = ['#ff6b9a', '#ffb347', '#ffe066', '#58d68d', '#5dade2', '#a569bd', '#ff7f50'];

function makeConfetti(fx: FxState, x = R(0, fx.W), y = R(-fx.H * 0.3, -10), burst = false): Confetti {
  const a = R(-Math.PI * 0.85, -Math.PI * 0.15),
    sp = R(6, 13);
  return {
    k: 'confetti',
    x,
    y,
    vx: burst ? Math.cos(a) * sp : R(-1, 1),
    vy: burst ? Math.sin(a) * sp : R(1, 3),
    rot: R(0, 6.3),
    spin: R(-0.25, 0.25),
    w: R(6, 11),
    h: R(4, 7),
    col: pick(fx.pal),
    shape: Math.random() < 0.2 ? 'c' : 'r',
    wob: R(0, 6),
    life: 1,
  };
}

export const confettiFx: Behaviour<Confetti> = {
  update(p, dt, fx) {
    p.vy += 0.18 * dt;
    p.vx *= 0.985;
    p.vy = Math.min(p.vy, 4.2);
    p.wob += 0.1 * dt;
    p.x += (p.vx + Math.sin(p.wob) * 0.8) * dt;
    p.y += p.vy * dt;
    p.rot += p.spin * dt;
    return p.y < fx.H + 20;
  },
  draw(p, { ctx }) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.scale(1, Math.cos(p.wob * 1.7));
    ctx.fillStyle = p.col;
    if (p.shape === 'c') {
      ctx.beginPath();
      ctx.arc(0, 0, p.h * 0.6, 0, 7);
      ctx.fill();
    } else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    ctx.restore();
  },
};

export function throwConfetti(fx: FxState, n = 160, p?: string[]) {
  if (fx.reduced()) return;
  n = Math.round(n * fx.scale);
  fx.pal = p || CONF;
  fx.until = Date.now() + 6000;
  for (let i = 0; i < n * 0.55; i++) fx.parts.push(makeConfetti(fx, R(0, fx.W), R(-fx.H * 0.5, -10)));
  for (let i = 0; i < n * 0.45; i++) fx.parts.push(makeConfetti(fx, R(fx.W * 0.1, fx.W * 0.9), fx.H * 0.38, true));
  run(fx);
}

export function pop(fx: FxState, x: number, y: number, n = 120, p?: string[]) {
  if (fx.reduced()) return;
  n = Math.round(n * fx.scale);
  fx.pal = p || CONF;
  for (let i = 0; i < n; i++) fx.parts.push(makeConfetti(fx, x, y, true));
  run(fx);
}
