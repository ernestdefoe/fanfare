/*
 * The stage: a big centrepiece rises onto the screen for the occasion, with
 * the greeting on it, a tune to tap and play, and effects behind it.
 *
 * This is a standalone script the server adds only on a day with a moment,
 * so forum.js stays small for everyone else. It draws with plain DOM and SVG
 * (no Mithril) and gets everything forum-specific — translations, names,
 * preferences — from the host object forum.js hands it.
 */
import CSS from './css';
import createFX from './fx';
import { playTune, stopTune } from './music';
import * as A from './art';

let host = null;
let fx = null;
let root = null;
let timers = [];
let ticker = 0;
let current = null;

const later = (fn, ms) => timers.push(setTimeout(fn, ms));
const $ = (s) => root.querySelector(s);
const $$ = (s) => [...root.querySelectorAll(s)];
const lamps = () => $$('.Piece .Lamp');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const t = (key, params) => esc(host.t(key, params));
const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches || !host.effects() || !!host.quiet;

const ANIMALS = ['rat', 'ox', 'tiger', 'rabbit', 'dragon', 'snake', 'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig'];

function ordinal(n) {
  if (!/^en/.test(host.locale)) return `${n}.`;
  const rule = new Intl.PluralRules('en', { type: 'ordinal' }).select(n);
  return n + ({ one: 'st', two: 'nd', few: 'rd' }[rule] || 'th');
}

function formatDate(iso) {
  const d = new Date(iso.length === 10 ? iso + 'T12:00:00' : iso);
  return new Intl.DateTimeFormat(host.locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(d);
}

const playBtn = (key = 'play') =>
  `<button class="Play" id="ffPlay" type="button"><span class="note" aria-hidden="true">♪</span><span class="eq" aria-hidden="true"><i></i><i></i><i></i></span><span class="lbl">${t(key)}</span><span class="prog"></span></button>`;
/** Titles past about 24 characters step down a size so they stay on the plaque. */
const long = (text) => (String(text).length > 24 ? ' long' : '');
const muteBtn = () => `<button class="PRound" id="ffMute" type="button"></button>`;

/* ------------------------------------------------------------------ */
/* the occasions                                                       */
/* ------------------------------------------------------------------ */
const SCENES = {
  birthday: (m) => {
    const names = m.wishedBy || [];
    const extra = Math.max(0, (m.wishedCount || 0) - names.length);
    const wished = !names.length
      ? ''
      : extra
        ? t('wished_by', { names: names.join(', '), count: extra })
        : t('wished_by_only', { names: names.join(', ') });
    return {
      tune: 'birthday',
      btn: '#e2557f',
      ink: '#c2385f',
      spot: 'rgba(255,128,176,.6)',
      svg: A.cakeSVG,
      title: [45.6, 16, 68, 20.6],
      foot: [71.6, 10, 80, 24],
      titleHtml: `<h2 class="Script t-bday" id="ffTitle" tabindex="-1"><small>${t('birthday_small')}</small>${t('birthday_name', { name: host.name })}</h2>`,
      footHtml: `${wished ? `<p class="Sub sub-bday">${wished}</p>` : ''}
        <div class="Acts">${playBtn()}<button class="PSoft" id="ffWish" type="button"><i class="fas fa-wind" aria-hidden="true"></i> ${t('make_a_wish')}</button>${muteBtn()}</div>`,
      play() {
        fx.confetti(240);
        later(() => fx.confetti(120), 1000);
        lamps().forEach((l, i) => later(() => l.classList.add('lit'), 1250 + i * 260));
      },
      calm() {
        lamps().forEach((l) => l.classList.add('lit'));
      },
    };
  },
  anniversary: (m) => ({
    tune: 'fanfare',
    btn: '#3f5f8f',
    ink: '#2d4a7a',
    spot: 'rgba(110,160,255,.55)',
    svg: () => A.medalSVG(m.years),
    title: [24.6, 27, 46, 24],
    foot: [71.6, 14.5, 71, 27],
    titleHtml: `<span class="yrs">${m.years}</span><span class="yrsl">${t(m.years === 1 ? 'anniversary_year' : 'anniversary_years', { forum: host.forum })}</span>`,
    footHtml: `<h2 class="Script t-anniv${long(host.t('anniversary_title', { name: host.name }))}" id="ffTitle" tabindex="-1">${t('anniversary_title', { name: host.name })}</h2>
      ${host.joined ? `<p class="Sub sub-anniv">${t('anniversary_since', { date: formatDate(host.joined), posts: host.posts || 0 })}</p>` : ''}
      <div class="Acts">${playBtn('play_fanfare')}${muteBtn()}</div>`,
    play() {
      fx.confetti(200);
      lamps().forEach((l, i) => later(() => l.classList.add('lit'), 1300 + i * 380));
      later(
        () => {
          const r = $('.Piece svg').getBoundingClientRect();
          fx.pop(r.left + r.width / 2, r.top + r.height * 0.2, 90);
        },
        1500 + lamps().length * 380
      );
    },
    calm() {
      lamps().forEach((l) => l.classList.add('lit'));
    },
  }),
  forum: (m) => ({
    tune: 'birthday',
    btn: '#e2557f',
    ink: '#c2385f',
    spot: 'rgba(120,200,255,.5)',
    deco: () => A.topDeco('bunting'),
    svg: () => A.forumSVG(m.age),
    title: [0, 0, 0, 0],
    foot: [71.6, 14.5, 71, 27],
    titleHtml: '',
    footHtml: `<h2 class="Script t-anniv${long(host.t('forum_title', { ordinal: ordinal(m.age), forum: host.forum }))}" id="ffTitle" tabindex="-1">${t('forum_title', { ordinal: ordinal(m.age), forum: host.forum })}</h2>
      <p class="Sub sub-anniv">${t('forum_since', { date: formatDate(m.since), members: m.members, posts: m.posts })}</p>
      <div class="Acts">${playBtn()}${muteBtn()}</div>`,
    play() {
      fx.confetti(220);
      later(() => fx.confetti(120), 900);
    },
    calm() {},
  }),
  newyear: (m) => ({
    tune: 'auld',
    btn: '#ffd36b',
    btnInk: '#1b1440',
    ink: '#fff',
    spot: 'rgba(120,100,255,.55)',
    svg: A.clockSVG,
    title: [42.4, 19, 62, 23.4],
    foot: [79.4, 19, 62, 17.8],
    titleHtml: `<div class="Dial"><span class="pre">${t('nye_pre')}</span><span class="digits" id="ffDigits"></span><span class="tz">${esc(Intl.DateTimeFormat().resolvedOptions().timeZone || '')}</span></div>
      <div class="Dial-after"><h2 class="Script t-nye" id="ffTitle" tabindex="-1">${t('nye_title')}</h2><span class="yr">${t('nye_year', { year: m.year })}</span></div>`,
    footHtml: `<p class="Sub sub-nye">${t('nye_thanks', { forum: host.forum, year: m.year - 1 })}</p><div class="Acts">${playBtn()}${muteBtn()}</div>`,
    play() {
      clock(m);
    },
    calm() {
      clock(m);
    },
  }),
  christmas: () => ({
    tune: 'christmas',
    btn: '#ffd43b',
    btnInk: '#5c1a00',
    ink: '#a51d2b',
    spot: 'rgba(255,90,90,.45)',
    deco: () => A.topDeco('lights'),
    svg: A.presentSVG,
    title: [0, 0, 100, 100],
    foot: [89, 4, 92, 10.6],
    titleHtml: `<div class="TagPivot"><div class="TagSwing"><span class="TagString"></span>
        <div class="Tag"><span class="hole"></span>${host.name ? `<span class="to">${t('christmas_to', { name: host.name })}</span>` : ''}<h2 class="mc" id="ffTitle" tabindex="-1">${t('christmas_title')}</h2><span class="from">${t('christmas_from', { forum: host.forum })}</span></div></div></div>`,
    footHtml: `<div class="Acts">${playBtn()}<button class="PSoft" id="ffOpen" type="button"><i class="fas fa-gift" aria-hidden="true"></i> ${t('open_it')}</button>${muteBtn()}</div>`,
    play() {
      if (!host.festoonFalling()) fx.snow(170);
    },
    calm() {},
  }),
  hanukkah: (m) => ({
    tune: 'chime',
    btn: '#3b6fd8',
    ink: '#2a55b0',
    spot: 'rgba(120,170,255,.55)',
    svg: () => A.menorahSVG(m.night),
    title: [4.5, 6, 88, 19],
    foot: [87, 10, 80, 12.4],
    titleHtml: `<h2 class="Script t-light" id="ffTitle" tabindex="-1">${t('hanukkah_title')}</h2><p class="Sub sub-light">${t('hanukkah_night', { ordinal: ordinal(m.night) })}</p>`,
    footHtml: `<div class="Acts">${playBtn('play_chime')}${muteBtn()}</div>`,
    play() {
      fx.confetti(90, ['#4dabf7', '#ffffff', '#c5d6f5', '#ffd43b']);
      lamps()
        .sort((a, b) => a.dataset.order - b.dataset.order)
        .forEach((l, i) => later(() => l.classList.add('lit'), 1300 + i * 520));
    },
    calm() {
      lamps().forEach((l) => l.classList.add('lit'));
    },
  }),
  lunar: (m) => ({
    tune: 'chime',
    btn: '#ffd56b',
    btnInk: '#6b0b12',
    ink: '#c0111f',
    spot: 'rgba(255,70,70,.5)',
    from: 'top',
    svg: A.lanternBigSVG,
    title: [31, 24, 52, 31],
    foot: [88.6, 10, 80, 11],
    titleHtml: `<span class="cn" lang="zh">新年快乐</span><h2 class="Script t-lunar" id="ffTitle" tabindex="-1">${t('lunar_title')}</h2>
      <span class="yr2">${t('lunar_year', { animal: host.t('lunar_animals.' + ANIMALS[(((m.year - 4) % 12) + 12) % 12]), year: m.year })}</span>`,
    footHtml: `<div class="Acts">${playBtn('play_chime')}${muteBtn()}</div>`,
    play() {
      fx.confetti(120, ['#e01e2e', '#ffd56b', '#ff8a3d', '#fff3c4']);
      later(() => lamps().forEach((l) => l.classList.add('lit')), 900);
      crackers(1700);
    },
    calm() {
      lamps().forEach((l) => l.classList.add('lit'));
    },
  }),
  diwali: () => ({
    tune: 'chime',
    btn: '#d9480f',
    ink: '#c2410c',
    spot: 'rgba(255,170,60,.6)',
    svg: A.rangoliSVG,
    title: [23.4, 26, 48, 29],
    foot: [86, 15, 70, 12.6],
    titleHtml: `<h2 class="Script t-diwali" id="ffTitle" tabindex="-1">${t('diwali_title')}</h2><p class="Sub sub-diwali">${t('diwali_sub')}</p>`,
    footHtml: `<div class="Acts">${playBtn('play_chime')}${muteBtn()}</div>`,
    play() {
      fx.lanterns('amber', 16);
      lamps().forEach((l, i) => later(() => l.classList.add('lit'), 1500 + i * 230));
    },
    calm() {
      lamps().forEach((l) => l.classList.add('lit'));
    },
  }),
  eid: () => ({
    tune: null,
    btn: '#1f8a6b',
    ink: '#16664f',
    spot: 'rgba(255,214,110,.45)',
    svg: A.eidSVG,
    title: [25, 40, 54, 30],
    foot: [0, 0, 0, 0],
    titleHtml: `<h2 class="Script t-eid" id="ffTitle" tabindex="-1">${t('eid_title')}</h2><p class="Sub sub-eid">${t('eid_sub')}</p>`,
    footHtml: '',
    play() {
      fx.confetti(90, ['#ffd36b', '#1f8a6b', '#fff3c4', '#4cc9a0']);
      lamps().forEach((l, i) => later(() => l.classList.add('lit'), 1300 + i * 380));
    },
    calm() {
      lamps().forEach((l) => l.classList.add('lit'));
    },
  }),
  halloween: () => ({
    tune: 'spooky',
    btn: '#ff7a00',
    ink: '#c2410c',
    spot: 'rgba(255,120,0,.45)',
    svg: A.pumpkinSVG,
    title: [3.5, 4, 70, 15],
    foot: [89, 10, 80, 10.6],
    titleHtml: `<h2 class="t-hallo" id="ffTitle" tabindex="-1">${t('halloween_title')}</h2>`,
    footHtml: `<div class="Acts">${playBtn('play_spooky')}${muteBtn()}</div>`,
    play() {
      fx.confetti(100, ['#ff7a00', '#8e44ad', '#2b2b2b', '#76d275']);
      later(() => lamps().forEach((l) => l.classList.add('lit')), 1250);
    },
    calm() {
      lamps().forEach((l) => l.classList.add('lit'));
    },
  }),
  thanksgiving: () => ({
    tune: 'chime',
    btn: '#c2410c',
    ink: '#9a3412',
    spot: 'rgba(255,150,60,.5)',
    svg: A.wreathSVG,
    title: [24, 26, 48, 28],
    foot: [87.5, 10, 80, 11.5],
    titleHtml: `<h2 class="Script t-thanks" id="ffTitle" tabindex="-1">${t('thanksgiving_title')}</h2><p class="Sub sub-thanks">${t('thanksgiving_sub')}</p>`,
    footHtml: `<div class="Acts">${playBtn('play_chime')}${muteBtn()}</div>`,
    play() {
      if (!host.festoonFalling()) fx.leaves(70);
    },
    calm() {},
  }),
};
SCENES.eidfitr = SCENES.eidadha = SCENES.eid;
SCENES.thanksgiving_ca = SCENES.thanksgiving;

/* ------------------------------------------------------------------ */
/* the moments that need a clock or a sequence                         */
/* ------------------------------------------------------------------ */

/** New Year: the dial shows the real time and counts down to each member's own midnight. */
function clock(m) {
  const tick = () => {
    const now = new Date();
    const set = (id, deg) => {
      const el = $('#' + id);
      if (el) el.style.transform = `rotate(${deg}deg)`;
    };
    const h = now.getHours(),
      min = now.getMinutes(),
      s = now.getSeconds();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const left = Math.round((midnight - now) / 1000);
    const after = !m.eve || now.getFullYear() >= m.year;

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
      const digits = $('#ffDigits');
      digits.textContent = (hh ? hh + ':' + String(mm).padStart(2, '0') : String(mm)) + ':' + String(ss).padStart(2, '0');
      digits.classList.toggle('long', digits.textContent.length > 5);
      host.countdown?.(left);
    } else if (!root.classList.contains('midnight')) {
      root.classList.add('midnight');
      host.countdown?.(0);
      if (m.eve) {
        fx.fireworks(14);
        later(() => fx.confetti(140), 1400);
      }
      setTimeout(() => focusTitle(), 300);
    }
  };
  clearInterval(ticker);
  tick();
  ticker = setInterval(tick, 1000);
}

/** Lunar New Year: the firecrackers pop from the bottom up, both strings at once. */
function crackers(start) {
  $$('.Piece .Cracker')
    .sort((a, b) => b.dataset.y - a.dataset.y)
    .forEach((c, i) =>
      later(
        () => {
          const b = c.getBoundingClientRect();
          c.classList.add('popped');
          fx.sparkle(b.left + b.width / 2, b.top + b.height / 2, 14, ['#ffd56b', '#ff6b4b', '#fff3c4']);
        },
        start + Math.floor(i / 2) * 260
      )
    );
}

/** Birthday: blowing out the candles, one tap each or all at once. */
function blow(c) {
  if (!c.classList.contains('lit')) return;
  c.classList.remove('lit');
  if (!calm()) {
    const [x, y] = c.querySelector('.Flame').style.transformOrigin.split(' ').map(parseFloat);
    c.querySelector('.Smoke').innerHTML = [0, 1, 2]
      .map((i) => `<circle class="Puff" cx="${x}" cy="${y - 4}" r="${6 + i * 2}" style="--dx:${(i - 1) * 14 + 6}px;animation-delay:${i * 0.14}s"/>`)
      .join('');
  }
  if (!lamps().some((l) => l.classList.contains('lit'))) {
    const r = $('.Piece svg').getBoundingClientRect();
    later(() => {
      fx.pop(r.left + r.width / 2, r.top + r.height * 0.18, 150);
      host.alert(host.t('wish_made', { name: host.name }));
    }, 450);
    later(close, 2400);
  }
}

/** Christmas: the lid pops off, light pours out, then it all slides away. */
function openGift() {
  if (root.classList.contains('opened')) return;
  root.classList.add('opened');
  const r = $('.Piece svg').getBoundingClientRect(),
    x = r.left + r.width * 0.5,
    y = r.top + r.height * 0.42;
  later(() => {
    fx.sparkle(x, y, 70, ['#fff3c4', '#ffd56b', '#ffffff']);
    fx.pop(x, y, 140, ['#ffd56b', '#ff4d5e', '#ffffff', '#51cf66']);
    if (host.name) host.alert(host.t('opened', { name: host.name }));
  }, 250);
  later(close, 2600);
}

/* ------------------------------------------------------------------ */
/* open, wire, close                                                   */
/* ------------------------------------------------------------------ */
function ensure() {
  if (root) return;
  const style = document.createElement('style');
  style.textContent = fonts() + CSS;
  document.head.appendChild(style);

  root = document.createElement('section');
  root.className = 'FanfareStage';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'false');
  root.setAttribute('aria-labelledby', 'ffTitle');
  root.innerHTML =
    '<div class="Stage-back"></div><button class="Skip" type="button"><i class="fas fa-xmark" aria-hidden="true"></i> <span></span></button><div class="TopDeco"></div><div class="Piece"></div>';
  document.body.appendChild(root);
  $('.Skip').onclick = close;
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && current) close();
  });

  fx = createFX({
    reduced: calm,
    dark: () => (document.documentElement.getAttribute('data-theme') || '').startsWith('dark'),
    scale: { subtle: 0.5, festive: 1, full: 1.6 }[host.intensity] || 1,
  });
}

/** The two display fonts ship with Fanfare (OFL): no request to a font service. */
function fonts() {
  const base = host.assets + '/extensions/ernestdefoe-fanfare/fonts/';
  return `@font-face{font-family:Pacifico;font-display:swap;src:url(${base}pacifico.woff2) format("woff2")}
@font-face{font-family:Creepster;font-display:swap;src:url(${base}creepster.woff2) format("woff2")}\n`;
}

function focusTitle() {
  const el = root && root.querySelector('#ffTitle');
  if (el && el.offsetParent) el.focus({ preventScroll: true });
}

function wire(s) {
  const muted = !host.sound();
  const mute = $('#ffMute');
  const play = $('#ffPlay');

  if (mute) {
    mute.innerHTML = `<i class="fas ${muted ? 'fa-volume-xmark' : 'fa-volume-high'}" aria-hidden="true"></i>`;
    mute.setAttribute('aria-label', host.t(muted ? 'turn_sound_on' : 'turn_sound_off'));
    mute.title = mute.getAttribute('aria-label');
    mute.onclick = () => {
      stopTune();
      host.setSound(muted);
      host.alert(host.t(muted ? 'sound_on_toast' : 'sound_off_toast'));
      wire(s);
    };
  }

  if (play) {
    const lbl = play.querySelector('.lbl');
    play.dataset.lbl = play.dataset.lbl || lbl.textContent;
    play.disabled = muted;
    lbl.textContent = muted ? host.t('sound_off') : play.dataset.lbl;
    play.onclick = () => playTune(s.tune, play, host.t('playing'));
  }

  const wish = $('#ffWish');
  if (wish)
    wish.onclick = () =>
      lamps()
        .filter((l) => l.classList.contains('lit'))
        .forEach((l, i) => later(() => blow(l), i * 120));

  const open = $('#ffOpen');
  if (open) open.onclick = openGift;

  const gift = $('.Gift');
  if (gift) {
    gift.setAttribute('aria-label', host.t('open_present'));
    gift.onclick = openGift;
    gift.onkeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openGift();
      }
    };
  }

  $$('.Piece .Candle').forEach((c, i) => {
    c.setAttribute('aria-label', host.t('blow_candle', { number: i + 1 }));
    c.onclick = () => blow(c);
    c.onkeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        blow(c);
      }
    };
  });
}

function open(moment, h) {
  host = h;
  ensure();
  const make = SCENES[moment.id];
  if (!make) return;

  timers.forEach(clearTimeout);
  timers = [];
  clearInterval(ticker);
  fx.stop();
  stopTune();

  const s = make(moment);
  const quiet = calm();
  current = moment;

  root.className =
    'FanfareStage show occ-' + moment.id.replace(/[^a-z_]/g, '') + (s.from === 'top' ? ' from-top' : '') + (quiet ? ' calm instant' : '');
  root.style.setProperty('--occ-btn', s.btn);
  root.style.setProperty('--occ-btn-ink', s.btnInk || '#fff');
  root.style.setProperty('--occ-ink', s.ink);
  root.style.setProperty('--spot', s.spot);
  watchBottom();
  $('.Skip span').textContent = host.t('close');
  $('.TopDeco').innerHTML = s.deco ? s.deco() : '';

  const box = ([top, left, width, height]) => `top:${top}%;left:${left}%;width:${width}%;height:${height}%`;
  $('.Piece').innerHTML =
    s.svg() +
    (s.titleHtml ? `<div class="Piece-title" style="${box(s.title)}">${s.titleHtml}</div>` : '') +
    (s.footHtml ? `<div class="Piece-foot" style="${box(s.foot)}">${s.footHtml}</div>` : '');

  wire(s);
  host.onOpen?.();

  if (quiet) {
    root.classList.add('up');
    s.calm();
  } else {
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('up')));
    s.play();
  }

  setTimeout(focusTitle, quiet ? 0 : 1300);
}

/**
 * Rise from just above whatever sits over the bottom of the screen: a tab bar
 * (FoF Mobile Tab and the like) and Flarum's alerts (a push prompt, "Saved"),
 * which stay on top. Followed while the stage is open, as alerts come and go.
 */
let bottomWatch = null;

function bottom() {
  let lift = 0;
  const bar = document.querySelector('.MobileTab-bar, .MobileTab');
  const rect = bar && getComputedStyle(bar).position === 'fixed' ? bar.getBoundingClientRect() : null;
  if (rect && rect.height && rect.bottom >= innerHeight - 2) lift = rect.height;
  for (const alert of document.querySelectorAll('.AlertManager .Alert')) {
    const r = alert.getBoundingClientRect();
    if (r.height) lift = Math.max(lift, innerHeight - r.top + 10);
  }
  root.style.setProperty('--ff-bottom', Math.round(lift) + 'px');
}

function watchBottom() {
  bottom();
  if (bottomWatch) return;
  const alerts = document.getElementById('alerts');
  const mo = new MutationObserver(bottom);
  if (alerts) mo.observe(alerts, { childList: true, subtree: true });
  addEventListener('resize', bottom);
  bottomWatch = () => {
    mo.disconnect();
    removeEventListener('resize', bottom);
    bottomWatch = null;
  };
}

function close() {
  if (!root || !current || root.classList.contains('leaving')) return;
  stopTune();
  fx.settle();
  const was = current;
  current = null;
  bottomWatch?.();
  root.classList.remove('up');
  root.classList.add('leaving');
  setTimeout(
    () => {
      if (current) return; // opened again meanwhile
      timers.forEach(clearTimeout);
      timers = [];
      clearInterval(ticker);
      root.className = 'FanfareStage';
      $('.Piece').innerHTML = '';
      $('.TopDeco').innerHTML = '';
      host.onClose?.(was);
    },
    calm() ? 0 : 720
  );
}

window.FanfareStage = { open, close, isOpen: () => !!current };
document.dispatchEvent(new Event('fanfare:stage'));
