import app from 'flarum/forum/app';
import m from 'mithril';
import { extend } from 'flarum/common/extend';
import type ItemList from 'flarum/common/utils/ItemList';
import Badge from 'flarum/common/components/Badge';
import User from 'flarum/common/models/User';
import IndexSidebar from 'flarum/forum/components/IndexSidebar';
import IndexPage from 'flarum/forum/components/IndexPage';
import HeaderSecondary from 'flarum/forum/components/HeaderSecondary';
import type { AlertIdentifier } from 'flarum/common/states/AlertManagerState';
import Widget from './components/Widget';
import registerHosts from './hosts';
import settingsItems from './settings';
import { localDay, moments, peopleToday, emoji, type LocalDay } from './today';
import type { FanfareData, Moment, StageHost } from './types';
import { t, text, local } from './util';

export { default as extend } from './extend';

/*
 * forum.js is on every page, so it only wires things up: member settings,
 * notifications, and on a day with something on, the badge, the widget, the
 * header button and the hand-off to the stage script (which the server adds
 * only on such a day).
 */

const state: { open: boolean; countdown: number | null; toast: AlertIdentifier | null } = { open: false, countdown: null, toast: null };

app.initializers.add('ernestdefoe-fanfare', () => {
  extend('flarum/forum/components/SettingsPage', 'settingsItems', settingsItems);

  extend('flarum/forum/components/NotificationGrid', 'notificationTypes', (items: ItemList<unknown>) => {
    items.add('fanfareWish', { name: 'fanfareWish', icon: 'fas fa-gift', label: t('settings.notify_wish') });
    items.add('fanfareDay', { name: 'fanfareDay', icon: 'fas fa-cake-candles', label: t('settings.notify_day') });
  });

  const data = app.data.fanfare as FanfareData | undefined;
  if (!data) return;

  const day = localDay();
  const mine = moments(data, day);
  const today = peopleToday(data, day);
  badges(today, mine);

  if (today.birthdays.length || today.anniversaries.length || data.courses?.list.length) {
    registerHosts(app, (host) => <Widget host={host} />);
    extend(IndexSidebar.prototype, 'items', (items) => items.add('fanfare', <Widget host="sidebar" />, -20));
    extend(IndexPage.prototype, 'contentItems', (items) => items.add('fanfare', <Widget host="strip" />, 110));
  }

  if (!mine.length) return;

  headerButton(mine);
  if (mine[0].id === 'newyear' && mine[0].eve) newYearCountdown(mine[0]);
  autoOpen(data, mine, day);
});

/** Badges for the day, on posts, cards and profiles. */
function badges(today: ReturnType<typeof peopleToday>, mine: Moment[]) {
  const birthdays = new Set(today.birthdays.map((b) => b.id));
  const anniversaries = new Map(today.anniversaries.map((a) => [a.id, a.years]));

  extend(User.prototype, 'badges', function (this: User, items) {
    const id = Number(this.id());
    const own = Number(app.session.user?.id()) === id;

    if (birthdays.has(id) || (own && mine.some((x) => x.id === 'birthday'))) {
      items.add('fanfareBirthday', <Badge type="fanfareBirthday" icon="fas fa-cake-candles" label={text('badge.birthday')} />, 5);
    }

    const years = anniversaries.get(id) || (own && mine.find((x) => x.id === 'anniversary')?.years);
    if (years) {
      items.add('fanfareAnniversary', <Badge type="fanfareAnniversary" icon="fas fa-medal" label={text('badge.anniversary', { count: years })} />, 4);
    }
  });
}

/** The header button: brings the moment back after it closes. */
function headerButton(mine: Moment[]) {
  extend(HeaderSecondary.prototype, 'items', (items) => {
    if (state.open) return;
    const moment = mine[0];
    const label = state.countdown ? countdown(state.countdown) : null;
    items.add(
      'fanfare',
      <button
        type="button"
        className="Button Button--flat FanfarePill"
        aria-label={text('pill.open')}
        title={text('pill.open')}
        onclick={() => openStage(moment)}
      >
        <span className="FanfarePill-emoji" aria-hidden="true">
          {emoji(moment)}
        </span>
        {label ? <span className="FanfarePill-label">{label}</span> : null}
      </button>,
      25
    );
  });
}

/**
 * New Year's Eve: the header button counts down while the moment is closed,
 * and at the member's own midnight the moment comes back for the fireworks.
 */
function newYearCountdown(moment: Moment) {
  const timer = setInterval(() => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const left = Math.round((midnight.getTime() - now.getTime()) / 1000);
    const struck = now.getFullYear() >= (moment.year as number);

    if (struck) {
      clearInterval(timer);
      state.countdown = null;
      if (!state.open) openStage(moment);
      m.redraw();
    } else if (!state.open) {
      state.countdown = left;
      m.redraw();
    }
  }, 1000);
}

/**
 * First visit of the day: the moment opens by itself (once, unless the admin wants it every time).
 * A course completion opens by itself once, ever; afterwards it waits behind the header button.
 */
function autoOpen(data: FanfareData, mine: Moment[], day: LocalDay) {
  setTimeout(() => {
    const course = mine.find((x) => x.id === 'course');
    const fresh = course && ((course.achievement as number) > courseSeen() || data.settings?.preview);
    const first = fresh ? course : mine.find((x) => x.id !== 'course');
    if (!first) return;
    const key = (first.key || first.id) + ':' + day.ymd;
    if (!fresh && data.settings?.onceADay && seen() === key && !data.settings?.preview) return;
    // A cookie or consent banner is answered first: the moment waits for it to go.
    const go = (): void => {
      if (consentShowing()) {
        setTimeout(go, 1000);
        return;
      }
      if (fresh) markCourseSeen(course.achievement as number);
      else markSeen(key);
      openStage(first);
    };
    go();
  }, 600);
}

/** A cookie or consent banner fixed on screen (Flarum cookie extensions and the common scripts). */
function consentShowing(): boolean {
  return Array.from(document.querySelectorAll<HTMLElement>('[class*="ookie"], [class*="onsent"], [id*="ookie"], [id*="onsent"]')).some((el) => {
    const style = getComputedStyle(el);
    return (style.position === 'fixed' || style.position === 'sticky') && el.offsetHeight > 0 && style.visibility !== 'hidden';
  });
}

function openStage(moment: Moment) {
  const go = () => window.FanfareStage!.open(moment, host());
  if (window.FanfareStage) go();
  else document.addEventListener('fanfare:stage', go, { once: true });
}

function host(): StageHost {
  const user = app.session.user;
  const data = app.data.fanfare as FanfareData;

  return {
    t: (key, params) => text('stage.' + key, params),
    locale: app.translator.getLocale?.() || document.documentElement.lang || 'en',
    name: user?.displayName() || '',
    joined: user?.joinTime()?.toISOString?.() || null,
    posts: user?.commentCount() || 0,
    forum: app.forum.attribute<string>('title'),
    assets: app.forum.attribute<string>('assetsBaseUrl'),
    intensity: data.settings?.intensity || 'festive',
    quiet: !!data.settings?.quiet,
    sound: () => (user ? user.preferences()?.fanfareSound !== false : local.get('fanfareSound') !== '0'),
    setSound: (on) => (user ? user.savePreferences({ fanfareSound: on }) : local.set('fanfareSound', on ? '1' : '0')),
    effects: () =>
      (user ? user.preferences()?.fanfareEffects !== false : local.get('fanfareEffects') !== '0') &&
      !document.documentElement.classList.contains('Festoon-off'),
    festoonFalling: () => !!document.querySelector('.Festoon-fall'),
    // One sound toast at a time: a new one replaces the last, so toggling doesn't stack them.
    alert: (message) => {
      if (state.toast) app.alerts.dismiss(state.toast);
      state.toast = app.alerts.show({ type: 'success' }, message);
    },
    onOpen: () => {
      state.open = true;
      m.redraw();
    },
    onClose: () => {
      state.open = false;
      m.redraw();
    },
  };
}

function countdown(left: number) {
  const h = Math.floor(left / 3600),
    mm = Math.floor(left / 60) % 60,
    s = left % 60;
  return (h ? h + ':' + String(mm).padStart(2, '0') : mm) + ':' + String(s).padStart(2, '0');
}

function seen(): string {
  const user = app.session.user;
  return user ? user.preferences()?.fanfareSeen || '' : local.get('fanfareSeen') || '';
}

function courseSeen(): number {
  return Number(app.session.user?.preferences()?.fanfareCourseSeen) || 0;
}

function markCourseSeen(id: number) {
  if (id > courseSeen()) app.session.user!.savePreferences({ fanfareCourseSeen: id });
}

function markSeen(key: string) {
  const user = app.session.user;
  if (user) {
    if (user.preferences()?.fanfareSeen !== key) user.savePreferences({ fanfareSeen: key });
  } else {
    local.set('fanfareSeen', key);
  }
}
