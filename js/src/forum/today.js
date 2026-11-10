/*
 * What today is in the member's own clock. The server sends yesterday to
 * tomorrow in the forum's timezone; each browser picks its own day, so a
 * member in Tokyo gets New Year before one in Chicago.
 */

const pad = (n) => String(n).padStart(2, '0');

export function localDay(now = new Date()) {
  return {
    ymd: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    md: `${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    year: now.getFullYear(),
  };
}

/** A month-day matches today; February 29 birthdays are kept on the 28th in other years. */
export function isToday(md, day) {
  if (md === day.md) return true;
  const leap = new Date(day.year, 1, 29).getMonth() === 1;
  return md === '02-29' && day.md === '02-28' && !leap;
}

const EMOJI = {
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
};

export const emoji = (id) => EMOJI[id] || '🎉';

/**
 * The moments for this member today, most personal first: their birthday,
 * their join anniversary, the forum's birthday, then the holidays.
 */
export function moments(data, day = localDay()) {
  const out = [];
  const mine = data.mine;

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

    const m = { id: o.id, year: day.year };
    if (o.id === 'newyear') {
      m.eve = day.ymd < o.day;
      m.year = Number(o.day.slice(0, 4));
    }
    if (o.id === 'hanukkah') {
      m.night = Math.min(8, Math.max(1, Math.round((new Date(day.ymd + 'T12:00') - new Date(o.day + 'T12:00')) / 864e5) + 1));
    }
    out.push(m);
  }

  return out;
}

/** People celebrating on the member's own today. */
export function peopleToday(data, day = localDay()) {
  const p = data.people;
  if (!p) return { birthdays: [], anniversaries: [] };

  return {
    birthdays: p.birthdays.filter((b) => isToday(b.md, day)),
    anniversaries: p.anniversaries.filter((a) => isToday(a.md, day)),
  };
}
