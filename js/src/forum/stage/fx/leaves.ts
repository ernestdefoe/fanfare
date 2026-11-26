import { R, pick } from './random';
import { run } from './run';
import type { Behaviour, FxState, Leaf } from './types';

const LEAF = new Path2D(
  'M0 -30 L6 -14 L18 -20 L14 -6 L28 -4 L16 6 L20 18 L6 12 L2 26 L-2 26 L-6 12 L-20 18 L-16 6 L-28 -4 L-14 -6 L-18 -20 L-6 -14Z'
);

function makeLeaf(fx: FxState): Leaf {
  return {
    k: 'leaf',
    x: R(0, fx.W),
    y: R(-60, -10),
    vx: R(-0.6, 0.6),
    vy: R(0.8, 1.8),
    rot: R(0, 6.3),
    spin: R(-0.04, 0.04),
    s: R(0.35, 0.7),
    sway: R(0, 6),
    col: pick(['#c0392b', '#e67e22', '#f1c40f', '#d35400', '#a04000']),
    life: 1,
  };
}

export const leafFx: Behaviour<Leaf> = {
  update(p, dt, fx) {
    p.sway += 0.03 * dt;
    p.x += (p.vx + Math.sin(p.sway) * 1.1) * dt;
    p.y += p.vy * dt;
    p.rot += p.spin * dt;
    return p.y < fx.H + 40;
  },
  draw(p, { ctx }) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.scale(p.s, p.s * Math.abs(Math.cos(p.sway)));
    ctx.fillStyle = p.col;
    ctx.fill(LEAF);
    ctx.restore();
  },
};

export function leaves(fx: FxState, n = 70) {
  if (fx.reduced()) return;
  fx.until = Date.now() + 7000;
  fx.ambient = { k: 'leaf', n, rate: 0.5, make: () => makeLeaf(fx) };
  run(fx);
}
