import app from 'flarum/forum/app';
import { local } from './util';
import { peopleToday } from './today';
import type { FanfareData } from './types';

/**
 * Today's people can be put away: the × hides the widget until someone NEW is
 * in it (a birthday, an anniversary, a course completion), so the dismissal is
 * keyed by who is listed. Members keep it in a preference (every device), guests
 * in the browser. Once a member has wished everyone listed it stays away too,
 * from their next page on (never under their finger as they tap Congratulate).
 */

const PREF = 'fanfareWidgetClosed';

/** Who the widget lists now, as a short fingerprint. */
export function listKey(data: FanfareData): string {
  const today = peopleToday(data);
  const ids = [
    ...today.birthdays.map((p) => 'b' + p.id),
    ...today.anniversaries.map((p) => 'a' + p.id),
    ...(data.courses?.list || []).map((c) => 'c' + c.id),
  ].sort();

  // djb2: short enough for a preference, and a new person changes it.
  let h = 5381;
  for (const ch of ids.join(',')) h = ((h << 5) + h + ch.charCodeAt(0)) | 0;
  return (h >>> 0).toString(36) + '.' + ids.length;
}

function stored(): string {
  const user = app.session.user;
  return user ? String(user.preferences()?.[PREF] || '') : local.get(PREF) || '';
}

/** Whether the member wished everyone they can in the list (and there was someone to wish). */
function allWished(data: FanfareData): boolean {
  if (!data.canWish) return false;
  const me = Number(app.session.user?.id());
  const today = peopleToday(data);
  const keys = [
    ...today.birthdays.filter((p) => p.id !== me).map((p) => 'birthday:' + p.id),
    ...today.anniversaries.filter((p) => p.id !== me).map((p) => 'anniversary:' + p.id),
    ...(data.courses?.list || []).filter((c) => c.user !== me).map((c) => 'course:' + c.id),
  ];
  return keys.length > 0 && keys.every((k) => (data.wished || []).includes(k));
}

let closedAtLoad: boolean | undefined;
let closedNow = false;

/** Hidden: put away for this list, or everyone already wished when the page loaded. */
export function isClosed(data: FanfareData): boolean {
  closedAtLoad ??= stored() === listKey(data) || allWished(data);
  return closedAtLoad || closedNow;
}

export function close(data: FanfareData): void {
  closedNow = true;
  const key = listKey(data);
  const user = app.session.user;
  if (user) user.savePreferences({ [PREF]: key });
  else local.set(PREF, key);
}
