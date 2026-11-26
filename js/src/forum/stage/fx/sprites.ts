/* Sprites: drawn once on a small canvas, then stamped each frame. */
type Cache = Record<string, HTMLCanvasElement>;

function sprite(cache: Cache, key: string, size: number, draw: (g: CanvasRenderingContext2D, n: number) => void) {
  if (cache[key]) return cache[key];
  const s = document.createElement('canvas');
  s.width = s.height = size;
  draw(s.getContext('2d')!, size);
  return (cache[key] = s);
}

export const glow = (cache: Cache, color: string) =>
  sprite(cache, 'g' + color, 64, (g, n) => {
    const r = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
    r.addColorStop(0, color);
    r.addColorStop(0.25, color);
    r.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, n, n);
  });

export const balloon = (cache: Cache, color: string) =>
  sprite(cache, 'b' + color, 80, (g) => {
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

export const lantern = (cache: Cache, body: string, key: string) =>
  sprite(cache, 'l' + key, 96, (g) => {
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
