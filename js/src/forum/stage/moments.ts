/* ------------------------------------------------------------------ */
/* the moments that need a clock or a sequence                         */
/* ------------------------------------------------------------------ */
import type { Moment } from '../types';
import { close } from './close';
import { $, $$, calm, focusTitle, lamps, later, st } from './state';

/** New Year: the dial shows the real time and counts down to each member's own midnight. */
export function clock(m: Moment) {
  const tick = () => {
    const now = new Date();
    const set = (id: string, deg: number) => {
      const el = $('#' + id);
      if (el) el.style.transform = `rotate(${deg}deg)`;
    };
    const h = now.getHours(),
      min = now.getMinutes(),
      s = now.getSeconds();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const left = Math.round((midnight.getTime() - now.getTime()) / 1000);
    const after = !m.eve || now.getFullYear() >= (m.year as number);

    // Counting down, the hands keep real time; once it's the new year they meet at XII.
    if (after) {
      set('ff-hSec', 0);
      set('ff-hMin', 0);
      set('ff-hHour', 0);
    } else {
      set('ff-hSec', s * 6);
      set('ff-hMin', (min + s / 60) * 6);
      set('ff-hHour', ((h % 12) + min / 60) * 30);
    }

    if (!after) {
      const hh = Math.floor(left / 3600),
        mm = Math.floor(left / 60) % 60,
        ss = left % 60;
      const digits = $('#ffDigits')!;
      digits.textContent = (hh ? hh + ':' + String(mm).padStart(2, '0') : String(mm)) + ':' + String(ss).padStart(2, '0');
      digits.classList.toggle('long', digits.textContent.length > 5);
      st.host.countdown?.(left);
    } else if (!st.root.classList.contains('midnight')) {
      st.root.classList.add('midnight');
      st.host.countdown?.(0);
      if (m.eve) {
        st.fx.fireworks(14);
        later(() => st.fx.confetti(140), 1400);
      }
      setTimeout(() => focusTitle(), 300);
    }
  };
  clearInterval(st.ticker);
  tick();
  st.ticker = window.setInterval(tick, 1000);
}

/** Lunar New Year: the firecrackers pop from the bottom up, both strings at once. */
export function crackers(start: number) {
  $$('.Piece .Cracker')
    .sort((a, b) => Number(b.dataset.y) - Number(a.dataset.y))
    .forEach((c, i) =>
      later(
        () => {
          const b = c.getBoundingClientRect();
          c.classList.add('popped');
          st.fx.sparkle(b.left + b.width / 2, b.top + b.height / 2, 14, ['#ffd56b', '#ff6b4b', '#fff3c4']);
        },
        start + Math.floor(i / 2) * 260
      )
    );
}

/** Birthday: blowing out the candles, one tap each or all at once. */
export function blow(c: HTMLElement) {
  if (!c.classList.contains('lit')) return;
  c.classList.remove('lit');
  if (!calm()) {
    const [x, y] = c.querySelector<HTMLElement>('.Flame')!.style.transformOrigin.split(' ').map(parseFloat);
    c.querySelector('.Smoke')!.innerHTML = [0, 1, 2]
      .map((i) => `<circle class="Puff" cx="${x}" cy="${y - 4}" r="${6 + i * 2}" style="--dx:${(i - 1) * 14 + 6}px;animation-delay:${i * 0.14}s"/>`)
      .join('');
  }
  if (!lamps().some((l) => l.classList.contains('lit'))) {
    const r = $('.Piece svg')!.getBoundingClientRect();
    later(() => {
      st.fx.pop(r.left + r.width / 2, r.top + r.height * 0.18, 150);
      st.host.alert(st.host.t('wish_made', { name: st.host.name }));
    }, 450);
    later(close, 2400);
  }
}

/** Christmas: the lid pops off, light pours out, then it all slides away. */
export function openGift() {
  if (st.root.classList.contains('opened')) return;
  st.root.classList.add('opened');
  const r = $('.Piece svg')!.getBoundingClientRect(),
    x = r.left + r.width * 0.5,
    y = r.top + r.height * 0.42;
  later(() => {
    st.fx.sparkle(x, y, 70, ['#fff3c4', '#ffd56b', '#ffffff']);
    st.fx.pop(x, y, 140, ['#ffd56b', '#ff4d5e', '#ffffff', '#51cf66']);
    if (st.host.name) st.host.alert(st.host.t('opened', { name: st.host.name }));
  }, 250);
  later(close, 2600);
}
