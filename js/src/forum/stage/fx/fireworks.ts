import { R, pick } from './random';
import { run } from './run';
import { glow } from './sprites';
import type { Behaviour, FxState, Rocket, Spark } from './types';

function makeRocket(fx: FxState): Rocket {
  return {
    k: 'rocket',
    x: R(fx.W * 0.12, fx.W * 0.88),
    y: fx.H + 10,
    vx: R(-1, 1),
    vy: -R(fx.H * 0.016, fx.H * 0.021),
    top: R(fx.H * 0.1, fx.H * 0.42),
    col: pick(['#ffd54f', '#ff8ad8', '#7ee0ff', '#b9a7ff', '#ffffff', '#ff9a62']),
    life: 1,
  };
}

function makeSpark(x: number, y: number, col: string, sp = R(1, 5.5), a = R(0, Math.PI * 2)): Spark {
  return { k: 'spark', x, y, px: x, py: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, col, life: 1, decay: R(0.012, 0.022) };
}

export const rocketFx: Behaviour<Rocket> = {
  update(p, dt, fx) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy *= 0.985;
    if (p.y <= p.top) {
      const n = 70,
        kind = Math.random();
      for (let i = 0; i < n; i++)
        fx.parts.push(
          makeSpark(
            p.x,
            p.y,
            kind < 0.3 ? pick(['#ffd54f', '#ff8ad8', '#7ee0ff']) : p.col,
            kind < 0.5 ? R(1.5, 5.5) : 4.2 * R(0.9, 1.05),
            (i / n) * Math.PI * 2 + R(-0.05, 0.05)
          )
        );
      return false;
    }
    return true;
  },
  draw(p, { ctx, sprites }) {
    ctx.drawImage(glow(sprites, p.col), p.x - 6, p.y - 6, 12, 12);
    ctx.strokeStyle = 'rgba(255,220,160,.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x - p.vx * 3, p.y - p.vy * 3);
    ctx.stroke();
  },
};

export const sparkFx: Behaviour<Spark> = {
  update(p, dt) {
    p.px = p.x;
    p.py = p.y;
    p.vx *= 0.965;
    p.vy = p.vy * 0.965 + 0.045 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= p.decay * dt;
    return p.life > 0;
  },
  draw(p, { ctx, sprites }) {
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.strokeStyle = p.col;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.px - p.vx * 2, p.py - p.vy * 2);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    if (p.life > 0.6) ctx.drawImage(glow(sprites, p.col), p.x - 5, p.y - 5, 10, 10);
    ctx.globalAlpha = 1;
  },
};

export function sparkle(fx: FxState, x: number, y: number, n = 40, cols = ['#ffd56b', '#fff3c4', '#ff6b4b']) {
  if (fx.reduced()) return;
  for (let i = 0; i < n; i++) fx.parts.push(makeSpark(x, y, pick(cols), R(1, 4.5)));
  run(fx);
}

export function fireworks(fx: FxState, seconds = 9) {
  if (fx.reduced()) return;
  const end = Date.now() + seconds * 1000;
  const fire = () => {
    if (Date.now() > end) return;
    fx.parts.push(makeRocket(fx));
    if (Math.random() < 0.5) fx.parts.push(makeRocket(fx));
    setTimeout(fire, R(280, 650));
    run(fx);
  };
  fire();
}
