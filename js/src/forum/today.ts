/*
 * What today is in the member's own clock. The server sends yesterday to
 * tomorrow in the forum's timezone; each browser picks its own day, so a
 * member in Tokyo gets New Year before one in Chicago.
 */
import type { FanfareData, Moment } from './types';

/** Today in the member's own clock: the date, the month-day and the year. */
export interface LocalDay {
  ymd: string;
  md: string;
  year: number;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function localDay(now = new Date()): LocalDay {
  return {
    ymd: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    md: `${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    year: now.getFullYear(),
  };
}

/** A month-day matches today; February 29 birthdays are kept on the 28th in other years. */
export function isToday(md: string, day: LocalDay): boolean {
  if (md === day.md) return true;
  const leap = new Date(day.year, 1, 29).getMonth() === 1;
  return md === '02-29' && day.md === '02-28' && !leap;
}

const EMOJI: Record<string, string> = {
  birthday: '🎂',
  anniversary: '🏅',
  forum: '🎈',
  newyear: '🎆',
  christmas: '🎁',
  hanukkah: '🕎',
  lunar: '🏮',
  diwali: '🪔',
  eidfitr: '🌙',
  eidadha: '🌙',
  halloween: '🎃',
  thanksgiving: '🍂',
  thanksgiving_ca: '🍂',
  course: '🎓',
};

/** A moment's emoji: a Festoon day brings its own. */
export const emoji = (moment: Moment): string => (moment.id === 'custom' && moment.emoji) || EMOJI[moment.id] || '🎉';

/**
 * The moments for this member today, most personal first: a course they just
 * completed, their birthday, their join anniversary, the forum's birthday,
 * then the holidays (Festoon's own days among them).
 */
export function moments(data: FanfareData, day = localDay()): Moment[] {
  const out: Moment[] = [];
  const mine = data.mine;

  // Completions stay a few days; the newest is the one celebrated.
  const course = (data.myCourses || [])[0];
  if (course) {
    out.push({ id: 'course', key: 'course:' + course.id, achievement: course.id, course: course.title, url: course.url });
  }

  if (mine?.birthday && mine.md && isToday(mine.md, day)) {
    out.push({ id: 'birthday', wishedBy: mine.wishedBy, wishedCount: mine.wishedCount });
  }

  if (mine?.years && mine.joined && isToday(mine.joined, day)) {
    out.push({ id: 'anniversary', years: mine.years });
  }

  if (data.forum && isToday(data.forum.md, day)) {
    out.push({ id: 'forum', ...data.forum });
  }

  for (const o of data.occasions || []) {
    if (o.from > day.ymd || o.to < day.ymd) continue;

    // A Festoon day: its own name, emoji and colors on a shared centrepiece.
    const m: Moment = o.custom ? { id: 'custom', key: o.id, ...o.custom, year: day.year } : { id: o.id, year: day.year };
    if (o.id === 'newyear') {
      m.eve = day.ymd < o.day;
      m.year = Number(o.day.slice(0, 4));
    }
    if (o.id === 'hanukkah') {
      m.night = Math.min(8, Math.max(1, Math.round((new Date(day.ymd + 'T12:00').getTime() - new Date(o.day + 'T12:00').getTime()) / 864e5) + 1));
    }
    out.push(m);
  }

  return out;
}

/** People celebrating on the member's own today. */
export function peopleToday(data: FanfareData, day = localDay()) {
  const p = data.people;
  if (!p) return { birthdays: [], anniversaries: [] };

  return {
    birthdays: p.birthdays.filter((b) => isToday(b.md, day)),
    anniversaries: p.anniversaries.filter((a) => isToday(a.md, day)),
  };
}
