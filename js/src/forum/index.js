import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import Badge from 'flarum/common/components/Badge';
import User from 'flarum/common/models/User';
import IndexSidebar from 'flarum/forum/components/IndexSidebar';
import IndexPage from 'flarum/forum/components/IndexPage';
import HeaderSecondary from 'flarum/forum/components/HeaderSecondary';
import Widget from './components/Widget';
import registerHosts from './hosts';
import settingsItems from './settings';
import { localDay, moments, peopleToday, emoji } from './today';
import { t, text, local } from './util';

/*
 * forum.js is on every page, so it only wires things up: member settings,
 * notifications, and on a day with something on, the badge, the widget, the
 * header button and the hand-off to the stage script (which the server adds
 * only on such a day).
 */

const state = { open: false, countdown: null };

app.initializers.add('ernestdefoe-fanfare', () => {
  extend('flarum/forum/components/SettingsPage', 'settingsItems', settingsItems);

  extend('flarum/forum/components/NotificationGrid', 'notificationTypes', (items) => {
    items.add('fanfareWish', { name: 'fanfareWish', icon: 'fas fa-gift', label: t('settings.notify_wish') });
    items.add('fanfareDay', { name: 'fanfareDay', icon: 'fas fa-cake-candles', label: t('settings.notify_day') });
  });

  const data = app.data.fanfare;
  if (!data) return;

  // Badges for the day, on posts, cards and profiles.
  const day = localDay();
  const today = peopleToday(data, day);
  const birthdays = new Set(today.birthdays.map((b) => b.id));
  const anniversaries = new Map(today.anniversaries.map((a) => [a.id, a.years]));
  const mine = moments(data, day);

  extend(User.prototype, 'badges', function (items) {
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

  if (birthdays.size || anniversaries.size) {
    registerHosts(app, (host) => <Widget host={host} />);
    extend(IndexSidebar.prototype, 'items', (items) => items.add('fanfare', <Widget host="sidebar" />, -20));
    extend(IndexPage.prototype, 'contentItems', (items) => items.add('fanfare', <Widget host="strip" />, 110));
  }

  if (!mine.length) return;

  // The header button: brings the moment back after it closes.
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
          {emoji(moment.id)}
        </span>
        {label ? <span className="FanfarePill-label">{label}</span> : null}
      </button>,
      25
    );
  });

  // New Year's Eve: the header button counts down while the moment is closed,
  // and at the member's own midnight the moment comes back for the fireworks.
  if (mine[0].id === 'newyear' && mine[0].eve) {
    const timer = setInterval(() => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const left = Math.round((midnight - now) / 1000);
      const struck = now.getFullYear() >= mine[0].year;

      if (struck) {
        clearInterval(timer);
        state.countdown = null;
        if (!state.open) openStage(mine[0]);
        m.redraw();
      } else if (!state.open) {
        state.countdown = left;
        m.redraw();
      }
    }, 1000);
  }

  // First visit of the day: the moment opens by itself (once, unless the admin wants it every time).
  setTimeout(() => {
    const first = mine[0];
    const key = first.id + ':' + day.ymd;
    if (data.settings?.onceADay && seen() === key && !data.settings?.preview) return;
    // A cookie or consent banner is answered first: the moment waits for it to go.
    const go = () => {
      if (consentShowing()) return setTimeout(go, 1000);
      markSeen(key);
      openStage(first);
    };
    go();
  }, 600);
});

/** A cookie or consent banner fixed on screen (Flarum cookie extensions and the common scripts). */
function consentShowing() {
  return [...document.querySelectorAll('[class*="ookie"], [class*="onsent"], [id*="ookie"], [id*="onsent"]')].some((el) => {
    const style = getComputedStyle(el);
    return (style.position === 'fixed' || style.position === 'sticky') && el.offsetHeight > 0 && style.visibility !== 'hidden';
  });
}

function openStage(moment) {
  const go = () => window.FanfareStage.open(moment, host());
  if (window.FanfareStage) go();
  else document.addEventListener('fanfare:stage', go, { once: true });
}

function host() {
  const user = app.session.user;
  const data = app.data.fanfare;

  return {
    t: (key, params) => text('stage.' + key, params),
    locale: app.translator.getLocale?.() || document.documentElement.lang || 'en',
    name: user?.displayName() || '',
    joined: user?.joinTime()?.toISOString?.() || null,
    posts: user?.commentCount() || 0,
    forum: app.forum.attribute('title'),
    assets: app.forum.attribute('assetsBaseUrl'),
    intensity: data.settings?.intensity || 'festive',
    quiet: !!data.settings?.quiet,
    sound: () => (user ? user.preferences()?.fanfareSound !== false : local.get('fanfareSound') !== '0'),
    setSound: (on) => (user ? user.savePreferences({ fanfareSound: on }) : local.set('fanfareSound', on ? '1' : '0')),
    effects: () =>
      (user ? user.preferences()?.fanfareEffects !== false : local.get('fanfareEffects') !== '0') &&
      !document.documentElement.classList.contains('Festoon-off'),
    festoonFalling: () => !!document.querySelector('.Festoon-fall'),
    alert: (message) => app.alerts.show({ type: 'success' }, message),
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

function countdown(left) {
  const h = Math.floor(left / 3600),
    mm = Math.floor(left / 60) % 60,
    s = left % 60;
  return (h ? h + ':' + String(mm).padStart(2, '0') : mm) + ':' + String(s).padStart(2, '0');
}

function seen() {
  const user = app.session.user;
  return user ? user.preferences()?.fanfareSeen || '' : local.get('fanfareSeen') || '';
}

function markSeen(key) {
  const user = app.session.user;
  if (user) {
    if (user.preferences()?.fanfareSeen !== key) user.savePreferences({ fanfareSeen: key });
  } else {
    local.set('fanfareSeen', key);
  }
}
