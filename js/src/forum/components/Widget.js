import app from 'flarum/forum/app';
import Component from 'flarum/common/Component';
import Link from 'flarum/common/components/Link';
import stringToColor from 'flarum/common/utils/stringToColor';
import { peopleToday } from '../today';
import { t } from '../util';

/**
 * Today's birthdays and join anniversaries, with a one-tap wish. In the index
 * sidebar on wide screens; a strip of chips above the discussion list on phones.
 */
export default class Widget extends Component {
  view() {
    const data = app.data.fanfare;
    const today = peopleToday(data);
    const strip = this.attrs.strip;

    if (!today.birthdays.length && !today.anniversaries.length) return null;

    const rows = (list, kind) =>
      list.map((p) => {
        const u = data.people.users[p.id];
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
      <section className={'FanfareWidget' + (strip ? ' FanfareWidget--strip' : '')} aria-label={t('widget.heading')}>
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
      </section>
    );
  }

  wishButton(id, kind, name) {
    const data = app.data.fanfare;
    if (!data.canWish || Number(app.session.user?.id()) === id) return null;

    if ((data.wished || []).includes(kind + ':' + id)) {
      return (
        <span className="FanfareWidget-wished">
          <i className="fas fa-check" aria-hidden="true" /> {t('widget.wished')}
        </span>
      );
    }

    return (
      <button
        type="button"
        className="Button Button--flat FanfareWidget-wish"
        aria-label={t('widget.wish_label', { name })}
        disabled={this.busy}
        onclick={() => this.wish(id, kind, name)}
      >
        🎉 {t('widget.wish')}
      </button>
    );
  }

  wish(id, kind, name) {
    this.busy = true;
    app
      .request({ method: 'POST', url: app.forum.attribute('apiUrl') + '/fanfare/wishes', body: { userId: id, kind } })
      .then(() => {
        const data = app.data.fanfare;
        data.wished = [...(data.wished || []), kind + ':' + id];
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
