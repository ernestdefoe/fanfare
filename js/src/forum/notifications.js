import app from 'flarum/forum/app';
import Notification from 'flarum/forum/components/Notification';
import { t } from './util';

/** "Mira wished you a happy birthday", or congratulated you on a course. Links to Mira's profile. */
export class WishNotification extends Notification {
  icon() {
    return 'fas fa-gift';
  }

  href() {
    const from = this.attrs.notification.fromUser();
    return from ? app.route.user(from) : app.route('index');
  }

  content() {
    const n = this.attrs.notification;
    const data = n.content() || {};
    const username = n.fromUser()?.displayName();
    if (data.kind === 'course') return t('notifications.wish_course', { username, course: data.title || '' });
    return t('notifications.wish_' + (data.kind === 'anniversary' ? 'anniversary' : 'birthday'), { username });
  }

  excerpt() {
    return null;
  }
}

/** The forum's own greeting on a member's day. */
export class DayNotification extends Notification {
  icon() {
    return (this.attrs.notification.content() || {}).kind === 'anniversary' ? 'fas fa-medal' : 'fas fa-cake-candles';
  }

  href() {
    return app.route('index');
  }

  content() {
    const data = this.attrs.notification.content() || {};
    const forum = app.forum.attribute('title');
    return data.kind === 'anniversary'
      ? t('notifications.day_anniversary', { count: data.years, forum })
      : t('notifications.day_birthday', { forum });
  }

  excerpt() {
    return null;
  }
}
