/* ------------------------------------------------------------------ */
/* the occasions                                                       */
/* ------------------------------------------------------------------ */
import type { Moment } from '../types';
import * as A from './art';
import { ANIMALS, color, formatDate, hexA, long, muteBtn, ordinal, playBtn, safeUrl } from './markup';
import { clock, crackers } from './moments';
import { $, esc, lamps, later, st, t } from './state';

/** An occasion's centrepiece: its colors, art, title and plaque, and what happens as it rises. */
export interface Scene {
  tune: string | null;
  btn: string;
  btnInk?: string;
  ink: string;
  spot: string;
  from?: string;
  deco?: () => string;
  svg: () => string;
  /** Where the title and the plaque sit on the art: [top, left, width, height] in %. */
  title: number[];
  foot: number[];
  titleHtml: string;
  footHtml: string;
  play(): void;
  calm(): void;
}

export const SCENES: Record<string, (m: Moment) => Scene> = {
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
      titleHtml: `<h2 class="Script t-bday" id="ffTitle" tabindex="-1"><small>${t('birthday_small')}</small>${t('birthday_name', { name: st.host.name })}</h2>`,
      footHtml: `${wished ? `<p class="Sub sub-bday">${wished}</p>` : ''}
        <div class="Acts">${playBtn()}<button class="PSoft" id="ffWish" type="button"><i class="fas fa-wind" aria-hidden="true"></i> ${t('make_a_wish')}</button>${muteBtn()}</div>`,
      play() {
        st.fx.confetti(240);
        later(() => st.fx.confetti(120), 1000);
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
    svg: () => A.medalSVG(m.years as number),
    title: [24.6, 27, 46, 24],
    foot: [71.6, 14.5, 71, 27],
    titleHtml: `<span class="yrs">${m.years}</span><span class="yrsl">${t(m.years === 1 ? 'anniversary_year' : 'anniversary_years', { forum: st.host.forum })}</span>`,
    footHtml: `<h2 class="Script t-anniv${long(st.host.t('anniversary_title', { name: st.host.name }))}" id="ffTitle" tabindex="-1">${t('anniversary_title', { name: st.host.name })}</h2>
      ${st.host.joined ? `<p class="Sub sub-anniv">${t('anniversary_since', { date: formatDate(st.host.joined), posts: st.host.posts || 0 })}</p>` : ''}
      <div class="Acts">${playBtn('play_fanfare')}${muteBtn()}</div>`,
    play() {
      st.fx.confetti(200);
      lamps().forEach((l, i) => later(() => l.classList.add('lit'), 1300 + i * 380));
      later(
        () => {
          const r = $('.Piece svg')!.getBoundingClientRect();
          st.fx.pop(r.left + r.width / 2, r.top + r.height * 0.2, 90);
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
    footHtml: `<h2 class="Script t-anniv${long(st.host.t('forum_title', { ordinal: ordinal(m.age as number), forum: st.host.forum }))}" id="ffTitle" tabindex="-1">${t('forum_title', { ordinal: ordinal(m.age as number), forum: st.host.forum })}</h2>
      <p class="Sub sub-anniv">${t('forum_since', { date: formatDate(m.since as string), members: m.members, posts: m.posts })}</p>
      <div class="Acts">${playBtn()}${muteBtn()}</div>`,
    play() {
      st.fx.confetti(220);
      later(() => st.fx.confetti(120), 900);
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
    footHtml: `<p class="Sub sub-nye">${t('nye_thanks', { forum: st.host.forum, year: (m.year as number) - 1 })}</p><div class="Acts">${playBtn()}${muteBtn()}</div>`,
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
        <div class="Tag"><span class="hole"></span>${st.host.name ? `<span class="to">${t('christmas_to', { name: st.host.name })}</span>` : ''}<h2 class="mc" id="ffTitle" tabindex="-1">${t('christmas_title')}</h2><span class="from">${t('christmas_from', { forum: st.host.forum })}</span></div></div></div>`,
    footHtml: `<div class="Acts">${playBtn()}<button class="PSoft" id="ffOpen" type="button"><i class="fas fa-gift" aria-hidden="true"></i> ${t('open_it')}</button>${muteBtn()}</div>`,
    play() {
      if (!st.host.festoonFalling()) st.fx.snow(170);
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
    titleHtml: `<h2 class="Script t-light" id="ffTitle" tabindex="-1">${t('hanukkah_title')}</h2><p class="Sub sub-light">${t('hanukkah_night', { ordinal: ordinal(m.night as number) })}</p>`,
    footHtml: `<div class="Acts">${playBtn('play_chime')}${muteBtn()}</div>`,
    play() {
      st.fx.confetti(90, ['#4dabf7', '#ffffff', '#c5d6f5', '#ffd43b']);
      lamps()
        .sort((a, b) => Number(a.dataset.order) - Number(b.dataset.order))
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
      <span class="yr2">${t('lunar_year', { animal: st.host.t('lunar_animals.' + ANIMALS[((((m.year as number) - 4) % 12) + 12) % 12]), year: m.year })}</span>`,
    footHtml: `<div class="Acts">${playBtn('play_chime')}${muteBtn()}</div>`,
    play() {
      st.fx.confetti(120, ['#e01e2e', '#ffd56b', '#ff8a3d', '#fff3c4']);
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
      st.fx.lanterns('amber', 16);
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
      st.fx.confetti(90, ['#ffd36b', '#1f8a6b', '#fff3c4', '#4cc9a0']);
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
      st.fx.confetti(100, ['#ff7a00', '#8e44ad', '#2b2b2b', '#76d275']);
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
      if (!st.host.festoonFalling()) st.fx.leaves(70);
    },
    calm() {},
  }),
  course: (m) => ({
    tune: 'fanfare',
    btn: '#2d4a7a',
    ink: '#24365c',
    spot: 'rgba(255,214,110,.5)',
    svg: A.gradSVG,
    title: [0, 0, 0, 0],
    foot: [72.6, 12, 76, 25.5],
    titleHtml: '',
    footHtml: `<h2 class="Script t-anniv${long(st.host.t('course_title', { name: st.host.name }))}" id="ffTitle" tabindex="-1">${t('course_title', { name: st.host.name })}</h2>
      <p class="Sub sub-anniv">${t('course_sub', { course: m.course || st.host.t('course_sample') })}</p>
      <div class="Acts">${playBtn('play_fanfare')}${m.url ? `<a class="PSoft Cert" href="${esc(safeUrl(m.url))}" aria-label="${t('view_certificate')}" title="${t('view_certificate')}"><i class="fas fa-award" aria-hidden="true"></i><span class="lbl"> ${t('view_certificate')}</span></a>` : ''}${muteBtn()}</div>`,
    play() {
      st.fx.confetti(200, ['#ffd36b', '#2d4a7a', '#ffffff', '#c2385f']);
      later(() => $('.Piece .Cap')?.classList.add('toss'), 900);
      later(() => lamps().forEach((l) => l.classList.add('lit')), 1500);
    },
    calm() {
      lamps().forEach((l) => l.classList.add('lit'));
    },
  }),
  // A day the admin made in Festoon: its name, emoji and two colors.
  custom: (m) => {
    const primary = color(m.primary, '#536f90');
    const secondary = color(m.secondary, primary);
    const title = m.name ? st.host.t('custom_title', { name: m.name }) : st.host.t('custom_title_unnamed');
    return {
      tune: 'chime',
      btn: primary,
      ink: '#24324a',
      spot: hexA(primary, 0.5),
      svg: () => A.rosetteSVG(primary, secondary, esc(m.emoji || '')),
      title: [0, 0, 0, 0],
      foot: [74.5, 14, 72, 23],
      titleHtml: '',
      footHtml: `<h2 class="Script t-anniv${long(title)}${title.length > 40 ? ' longer' : ''}" id="ffTitle" tabindex="-1">${esc(title)}</h2>
        <div class="Acts">${playBtn('play_chime')}${muteBtn()}</div>`,
      play() {
        st.fx.confetti(180, [primary, secondary, '#ffffff', '#ffd36b']);
        later(() => lamps().forEach((l) => l.classList.add('lit')), 1200);
      },
      calm() {
        lamps().forEach((l) => l.classList.add('lit'));
      },
    };
  },
};
SCENES.eidfitr = SCENES.eidadha = SCENES.eid;
SCENES.thanksgiving_ca = SCENES.thanksgiving;
