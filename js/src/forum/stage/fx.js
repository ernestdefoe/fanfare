/*
 * The effects layer: one fixed canvas, a particle pool and a frame guard.
 * Two slow frames in a row halve the budget; the loop stops when the tab is
 * hidden and when nothing is left to draw.
 */
export default function createFX(opts) {
  const { reduced, dark, scale = 1 } = opts;
  const c = document.createElement('canvas');
  c.id = 'FanfareFx';
  c.setAttribute('aria-hidden', 'true');
  document.body.appendChild(c);
  const ctx = c.getContext('2d');
  let W = 0,
    H = 0,
    parts = [],
    raf = 0,
    last = 0,
    slow = 0,
    cap = Math.round(260 * scale),
    ambient = null,
    until = 0;
  const sprites = {};
  function resize() {
    const dpr = Math.min(1.5, devicePixelRatio || 1);
    W = innerWidth;
    H = innerHeight;
    c.width = W * dpr;
    c.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();
  const R = (a, b) => a + Math.random() * (b - a);
  const pick = (a) => a[(Math.random() * a.length) | 0];

  function sprite(key, size, draw) {
    if (sprites[key]) return sprites[key];
    const s = document.createElement('canvas');
    s.width = s.height = size;
    draw(s.getContext('2d'), size);
    return (sprites[key] = s);
  }
  const glow = (color) =>
    sprite('g' + color, 64, (g, n) => {
      const r = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
      r.addColorStop(0, color);
      r.addColorStop(0.25, color);
      r.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = r;
      g.fillRect(0, 0, n, n);
    });
  const balloon = (color) =>
    sprite('b' + color, 80, (g) => {
      g.fillStyle = color;
      g.beginPath();
      g.ellipse(40, 34, 24, 30, 0, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.moveTo(36, 63);
      g.lineTo(44, 63);
      g.lineTo(40, 70);
      g.fill();
      g.fillStyle = 'rgba(255,255,255,.45)';
      g.beginPath();
      g.ellipse(31, 22, 6, 10, -0.5, 0, Math.PI * 2);
      g.fill();
    });
  const lantern = (body, key) =>
    sprite('l' + key, 96, (g) => {
      const r = g.createRadialGradient(48, 52, 2, 48, 52, 46);
      r.addColorStop(0, 'rgba(255,200,90,.55)');
      r.addColorStop(1, 'rgba(255,160,40,0)');
      g.fillStyle = r;
      g.fillRect(0, 0, 96, 96);
      g.fillStyle = body;
      g.beginPath();
      g.ellipse(48, 52, 17, 21, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#ffd36b';
      g.fillRect(40, 29, 16, 5);
      g.fillRect(40, 70, 16, 5);
      g.fillStyle = 'rgba(255,240,180,.75)';
      g.beginPath();
      g.ellipse(48, 54, 7, 12, 0, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = '#ffd36b';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(48, 75);
      g.lineTo(48, 88);
      g.stroke();
    });

  const CONF = ['#ff6b9a', '#ffb347', '#ffe066', '#58d68d', '#5dade2', '#a569bd', '#ff7f50'];
  let pal = CONF;
  const LEAF = new Path2D(
    'M0 -30 L6 -14 L18 -20 L14 -6 L28 -4 L16 6 L20 18 L6 12 L2 26 L-2 26 L-6 12 L-20 18 L-16 6 L-28 -4 L-14 -6 L-18 -20 L-6 -14Z'
  );
  const make = {
    confetti(x = R(0, W), y = R(-H * 0.3, -10), burst = false) {
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
        col: pick(pal),
        shape: Math.random() < 0.2 ? 'c' : 'r',
        wob: R(0, 6),
        life: 1,
      };
    },
    balloon() {
      return {
        k: 'balloon',
        x: R(20, W - 20),
        y: H + R(20, 200),
        vx: 0,
        vy: -R(1.3, 2.4),
        sway: R(0, 6),
        s: R(0.7, 1.15),
        col: pick(['#ff6b9a', '#ffb347', '#5dade2', '#a569bd', '#58d68d', '#ff7f50']),
        life: 1,
      };
    },
    snow() {
      return { k: 'snow', x: R(0, W), y: R(-40, -5), vx: R(-0.4, 0.4), vy: R(0.6, 1.8), r: R(1.6, 4.2), sway: R(0, 6), life: 1 };
    },
    rocket() {
      return {
        k: 'rocket',
        x: R(W * 0.12, W * 0.88),
        y: H + 10,
        vx: R(-1, 1),
        vy: -R(H * 0.016, H * 0.021),
        top: R(H * 0.1, H * 0.42),
        col: pick(['#ffd54f', '#ff8ad8', '#7ee0ff', '#b9a7ff', '#ffffff', '#ff9a62']),
        life: 1,
      };
    },
    spark(x, y, col, sp = R(1, 5.5), a = R(0, Math.PI * 2)) {
      return { k: 'spark', x, y, px: x, py: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, col, life: 1, decay: R(0.012, 0.022) };
    },
    lantern(kind) {
      // keep the middle clear for the centrepiece: lanterns rise beside it
      const band = Math.min(640, W * 0.5),
        side = Math.random() < 0.5;
      const x = W > 760 ? (side ? R(20, W / 2 - band / 2) : R(W / 2 + band / 2, W - 20)) : side ? R(10, W * 0.16) : R(W * 0.84, W - 10);
      return { k: 'lantern', x, y: H + R(20, 260), vx: 0, vy: -R(0.5, 1.1), sway: R(0, 6), s: W > 760 ? R(0.45, 0.95) : R(0.3, 0.5), kind, life: 1 };
    },
    leaf() {
      return {
        k: 'leaf',
        x: R(0, W),
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
    },
    ember() {
      return { k: 'ember', x: R(0, W), y: H + 10, vx: R(-0.3, 0.3), vy: -R(0.6, 1.8), r: R(1, 2.6), life: 1, decay: R(0.003, 0.007) };
    },
  };

  function update(p, dt) {
    switch (p.k) {
      case 'confetti':
        p.vy += 0.18 * dt;
        p.vx *= 0.985;
        p.vy = Math.min(p.vy, 4.2);
        p.wob += 0.1 * dt;
        p.x += (p.vx + Math.sin(p.wob) * 0.8) * dt;
        p.y += p.vy * dt;
        p.rot += p.spin * dt;
        return p.y < H + 20;
      case 'balloon':
        p.sway += 0.02 * dt;
        p.x += Math.sin(p.sway) * 0.6 * dt;
        p.y += p.vy * dt;
        return p.y > -120;
      case 'snow':
        p.sway += 0.02 * dt;
        p.x += (p.vx + Math.sin(p.sway) * 0.35) * dt;
        p.y += p.vy * dt;
        return p.y < H + 10;
      case 'rocket':
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy *= 0.985;
        if (p.y <= p.top) {
          const n = 70,
            kind = Math.random();
          for (let i = 0; i < n; i++)
            parts.push(
              make.spark(
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
      case 'spark':
        p.px = p.x;
        p.py = p.y;
        p.vx *= 0.965;
        p.vy = p.vy * 0.965 + 0.045 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= p.decay * dt;
        return p.life > 0;
      case 'lantern':
        p.sway += 0.015 * dt;
        p.x += Math.sin(p.sway) * 0.35 * dt;
        p.y += p.vy * dt;
        return p.y > -100;
      case 'leaf':
        p.sway += 0.03 * dt;
        p.x += (p.vx + Math.sin(p.sway) * 1.1) * dt;
        p.y += p.vy * dt;
        p.rot += p.spin * dt;
        return p.y < H + 40;
      case 'ember':
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= p.decay * dt;
        return p.life > 0 && p.y > -10;
    }
  }
  function draw(p) {
    switch (p.k) {
      case 'confetti':
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
        break;
      case 'balloon': {
        const s = 80 * p.s,
          img = balloon(p.col);
        ctx.strokeStyle = dark() ? 'rgba(255,255,255,.35)' : 'rgba(60,60,80,.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y + s * 0.4);
        ctx.quadraticCurveTo(p.x + Math.sin(p.sway * 2) * 10, p.y + s * 0.8, p.x, p.y + s * 1.25);
        ctx.stroke();
        ctx.drawImage(img, p.x - s / 2, p.y - s / 2, s, s);
        break;
      }
      case 'snow':
        ctx.fillStyle = dark() ? 'rgba(255,255,255,.85)' : 'rgba(150,180,215,.85)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 7);
        ctx.fill();
        break;
      case 'rocket':
        ctx.drawImage(glow(p.col), p.x - 6, p.y - 6, 12, 12);
        ctx.strokeStyle = 'rgba(255,220,160,.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 3, p.y - p.vy * 3);
        ctx.stroke();
        break;
      case 'spark':
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.strokeStyle = p.col;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.px - p.vx * 2, p.py - p.vy * 2);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        if (p.life > 0.6) ctx.drawImage(glow(p.col), p.x - 5, p.y - 5, 10, 10);
        ctx.globalAlpha = 1;
        break;
      case 'lantern': {
        const s = 96 * p.s,
          img = p.kind === 'red' ? lantern('#d7263d', 'red') : lantern('#f29e38', 'amber');
        ctx.drawImage(img, p.x - s / 2, p.y - s / 2, s, s);
        break;
      }
      case 'leaf':
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(p.s, p.s * Math.abs(Math.cos(p.sway)));
        ctx.fillStyle = p.col;
        ctx.fill(LEAF);
        ctx.restore();
        break;
      case 'ember':
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.drawImage(glow('#ffc861'), p.x - p.r * 3, p.y - p.r * 3, p.r * 6, p.r * 6);
        ctx.globalAlpha = 1;
        break;
    }
  }
  function loop(t) {
    const dt = last ? Math.min(3, (t - last) / 16.67) : 1;
    last = t;
    const t0 = performance.now();
    ctx.clearRect(0, 0, W, H);
    const now = Date.now(),
      bursting = now < until;
    if (ambient) {
      const want = Math.round(((bursting ? 1 : 0.3) * ambient.n * cap) / 260);
      if (ambient.count() < want && Math.random() < ambient.rate * dt) parts.push(ambient.make());
    }
    parts = parts.filter((p) => {
      const keep = update(p, dt);
      if (keep) draw(p);
      return keep;
    });
    if (parts.length > cap * 2) parts.splice(0, parts.length - cap * 2);
    // frame guard: two slow frames in a row halve the budget
    if (performance.now() - t0 > 12) {
      if (++slow >= 2) {
        cap = Math.max(40, cap >> 1);
        slow = 0;
      }
    } else slow = 0;
    if (parts.length || ambient) raf = requestAnimationFrame(loop);
    else {
      raf = 0;
      last = 0;
      ctx.clearRect(0, 0, W, H);
    }
  }
  function run() {
    if (!raf && !reduced()) {
      last = 0;
      raf = requestAnimationFrame(loop);
    }
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else if (parts.length || ambient) run();
  });
  const counter = (k) => () => parts.reduce((n, p) => n + (p.k === k), 0);

  return {
    stop() {
      parts = [];
      ambient = null;
    },
    /** Nothing new falls; what is already falling finishes. */
    settle() {
      ambient = null;
    },
    confetti(n = 160, p) {
      if (reduced()) return;
      n = Math.round(n * scale);
      pal = p || CONF;
      until = Date.now() + 6000;
      for (let i = 0; i < n * 0.55; i++) parts.push(make.confetti(R(0, W), R(-H * 0.5, -10)));
      for (let i = 0; i < n * 0.45; i++) parts.push(make.confetti(R(W * 0.1, W * 0.9), H * 0.38, true));
      run();
    },
    pop(x, y, n = 120, p) {
      if (reduced()) return;
      n = Math.round(n * scale);
      pal = p || CONF;
      for (let i = 0; i < n; i++) parts.push(make.confetti(x, y, true));
      run();
    },
    sparkle(x, y, n = 40, cols = ['#ffd56b', '#fff3c4', '#ff6b4b']) {
      if (reduced()) return;
      for (let i = 0; i < n; i++) parts.push(make.spark(x, y, pick(cols), R(1, 4.5)));
      run();
    },
    leaves(n = 70) {
      if (reduced()) return;
      until = Date.now() + 7000;
      ambient = { n, rate: 0.5, make: make.leaf, count: counter('leaf') };
      run();
    },
    balloons(n = 14) {
      if (reduced()) return;
      for (let i = 0; i < n; i++) parts.push(make.balloon());
      run();
    },
    snow(n = 160) {
      if (reduced()) return;
      until = Date.now() + 7000;
      ambient = { n, rate: 0.9, make: make.snow, count: counter('snow') };
      for (let i = 0; i < n * 0.5; i++) {
        const p = make.snow();
        p.y = R(-10, H);
        parts.push(p);
      }
      run();
    },
    fireworks(seconds = 9) {
      if (reduced()) return;
      const end = Date.now() + seconds * 1000;
      const fire = () => {
        if (Date.now() > end) return;
        parts.push(make.rocket());
        if (Math.random() < 0.5) parts.push(make.rocket());
        setTimeout(fire, R(280, 650));
        run();
      };
      fire();
    },
    lanterns(kind = 'amber', n = 18) {
      if (reduced()) return;
      until = Date.now() + 8000;
      for (let i = 0; i < n; i++) parts.push(make.lantern(kind));
      ambient = { n: 70, rate: 0.5, make: make.ember, count: counter('ember') };
      run();
      setTimeout(() => {
        if (ambient && ambient.make === make.ember) ambient = null;
      }, 14000);
    },
  };
}
