import app from 'flarum/forum/app';
import Component from 'flarum/common/Component';
import Link from 'flarum/common/components/Link';
import stringToColor from 'flarum/common/utils/stringToColor';
import { peopleToday } from '../today';
import { t } from '../util';
import { claim, release, hosted } from '../hosts';

/**
 * Today's birthdays and join anniversaries, and who finished a course lately,
 * with a one-tap wish (Congratulate, for a course).
 *
 * host: 'sidebar' (the index sidebar), 'strip' (chips above the discussion
 * list: on phones, and on wide screens whenever the sidebar copy isn't
 * visible, as under Bespoke), or a widget host the admin placed it in
 * ('bespoke', 'fof'). A placed copy makes the two fallbacks stand down.
 */
export default class Widget extends Component {
  oncreate(vnode) {
    super.oncreate(vnode);
    if (!this.fallback()) claim(this.attrs.host);
    this.measure();
  }

  onupdate(vnode) {
    super.onupdate(vnode);
    this.measure();
  }

  onremove(vnode) {
    super.onremove(vnode);
    if (!this.fallback()) release(this.attrs.host);
  }

  fallback() {
    return this.attrs.host === 'sidebar' || this.attrs.host === 'strip';
  }

  /** The strip shows on wide screens too when the sidebar copy is not on screen. */
  measure() {
    if (this.attrs.host !== 'strip') return;
    const side = document.querySelector('.FanfareWidget--sidebar');
    const wanted = !side || !side.offsetParent;
    if (wanted !== !!this.wide) {
      this.wide = wanted;
      m.redraw();
    }
  }

  view() {
    const data = app.data.fanfare;
    const today = peopleToday(data);
    const strip = this.attrs.host === 'strip';

    const courses = data.courses?.list || [];

    if ((!today.birthdays.length && !today.anniversaries.length && !courses.length) || (this.fallback() && hosted())) return null;

    const rows = (list, kind) =>
      list.map((p) => {
        const u = data.people?.users[p.id];
        if (!u) return null;
        const sub = kind === 'birthday' ? (p.age ? t('widget.turns', { age: p.age }) : null) : t('widget.years', { count: p.years });

        return (
          <div className="FanfareWidget-row" key={kind + p.id}>
            <Link href={app.route('user', { username: u.slug })} className="FanfareWidget-person">
              {avatar(u)}
              <span className="FanfareWidget-who">
                <span className="FanfareWidget-name">{u.name}</span>
                {sub && !strip ? <span className="FanfareWidget-sub">{sub}</span> : null}
              </span>
            </Link>
            {this.wishButton(p.id, kind, u.name)}
          </div>
        );
      });

    const more = (n) => (n > 0 && !strip ? <div className="FanfareWidget-more">{t('widget.more', { count: n })}</div> : null);

    return (
      <section
        className={'FanfareWidget FanfareWidget--' + this.attrs.host + (strip && this.wide ? ' is-wide' : '')}
        aria-label={t('widget.heading')}
      >
        {today.birthdays.length ? (
          <div className="FanfareWidget-group">
            <h4 className="FanfareWidget-heading">🎂 {strip ? t('widget.today') : t('widget.heading')}</h4>
            {rows(today.birthdays, 'birthday')}
            {more(data.people.more.birthdays)}
          </div>
        ) : null}
        {today.anniversaries.length ? (
          <div className="FanfareWidget-group">
            <h4 className="FanfareWidget-heading">🏅 {t('widget.anniversaries')}</h4>
            {rows(today.anniversaries, 'anniversary')}
            {more(data.people.more.anniversaries)}
          </div>
        ) : null}
        {courses.length ? (
          <div className="FanfareWidget-group">
            <h4 className="FanfareWidget-heading">🎓 {t('widget.courses')}</h4>
            {courses.map((c) => this.courseRow(c, strip))}
            {more(data.courses.more)}
          </div>
        ) : null}
      </section>
    );
  }

  /** Who finished a course: the course links to its certificate's public page. */
  courseRow(c, strip) {
    const u = app.data.fanfare.courses.users[c.user];
    if (!u) return null;
    const title = c.url ? (
      <a href={c.url} className="FanfareWidget-sub FanfareWidget-course">
        {c.title}
      </a>
    ) : (
      <span className="FanfareWidget-sub">{c.title}</span>
    );

    return (
      <div className="FanfareWidget-row" key={'course' + c.id}>
        <span className="FanfareWidget-person">
          <Link href={app.route('user', { username: u.slug })}>{avatar(u)}</Link>
          <span className="FanfareWidget-who">
            <Link href={app.route('user', { username: u.slug })} className="FanfareWidget-name">
              {u.name}
            </Link>
            {strip ? null : title}
          </span>
        </span>
        {this.wishButton(c.user, 'course', u.name, c.id)}
      </div>
    );
  }

  /** ref: the course completion a Congratulate is for. */
  wishButton(id, kind, name, ref) {
    const data = app.data.fanfare;
    if (!data.canWish || Number(app.session.user?.id()) === id) return null;
    const key = kind + ':' + (kind === 'course' ? ref : id);

    if ((data.wished || []).includes(key)) {
      return (
        <span className="FanfareWidget-wished">
          <i className="fas fa-check" aria-hidden="true" /> {t(kind === 'course' ? 'widget.congratulated' : 'widget.wished')}
        </span>
      );
    }

    return (
      <button
        type="button"
        className="Button Button--flat FanfareWidget-wish"
        aria-label={t(kind === 'course' ? 'widget.congratulate_label' : 'widget.wish_label', { name })}
        disabled={this.busy}
        onclick={() => this.wish(id, kind, name, ref, key)}
      >
        🎉 {t(kind === 'course' ? 'widget.congratulate' : 'widget.wish')}
      </button>
    );
  }

  wish(id, kind, name, ref, key) {
    this.busy = true;
    app
      .request({ method: 'POST', url: app.forum.attribute('apiUrl') + '/fanfare/wishes', body: { userId: id, kind, achievementId: ref } })
      .then(() => {
        const data = app.data.fanfare;
        data.wished = [...(data.wished || []), key];
        app.alerts.show({ type: 'success' }, t('widget.wish_sent', { name }));
      })
      .finally(() => {
        this.busy = false;
        m.redraw();
      });
  }
}

function avatar(u) {
  return u.avatar ? (
    <img className="Avatar FanfareWidget-avatar" src={u.avatar} alt="" loading="lazy" />
  ) : (
    <span className="Avatar FanfareWidget-avatar" style={{ '--avatar-bg': '#' + stringToColor(u.username) }} aria-hidden="true">
      {(u.name || u.username || '?').charAt(0).toUpperCase()}
    </span>
  );
}
