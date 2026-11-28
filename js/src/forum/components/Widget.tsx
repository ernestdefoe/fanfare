import app from 'flarum/forum/app';
import m from 'mithril';
import type Mithril from 'mithril';
import Component, { type ComponentAttrs } from 'flarum/common/Component';
import Link from 'flarum/common/components/Link';
import stringToColor from 'flarum/common/utils/stringToColor';
import { peopleToday } from '../today';
import { t } from '../util';
import { claim, release, hosted } from '../hosts';
import { close, isClosed } from '../dismiss';
import type { AnniversaryPerson, BirthdayPerson, CourseCompletion, FanfareData, PersonUser } from '../types';

export interface WidgetAttrs extends ComponentAttrs {
  host: string;
}

type Kind = 'birthday' | 'anniversary' | 'course';

/** A birthday or an anniversary today. */
type Person = Partial<BirthdayPerson & AnniversaryPerson> & { id: number };

const fanfare = () => app.data.fanfare as FanfareData;

/**
 * Today's birthdays and join anniversaries, and who finished a course lately,
 * with a one-tap wish (Congratulate, for a course).
 *
 * host: 'sidebar' (the index sidebar), 'strip' (chips above the discussion
 * list: on phones, and on wide screens whenever the sidebar copy isn't
 * visible, as under Bespoke), or a widget host the admin placed it in
 * ('bespoke', 'fof'). A placed copy makes the two fallbacks stand down.
 */
export default class Widget extends Component<WidgetAttrs> {
  wide = false;
  busy = false;
  scrollCue?: () => void;

  oncreate(vnode: Mithril.VnodeDOM<WidgetAttrs, this>) {
    super.oncreate(vnode);
    if (!this.fallback()) claim(this.attrs.host);
    this.measure();
  }

  onupdate(vnode: Mithril.VnodeDOM<WidgetAttrs, this>) {
    super.onupdate(vnode);
    this.measure();
  }

  onremove(vnode: Mithril.VnodeDOM<WidgetAttrs, this>) {
    super.onremove(vnode);
    if (!this.fallback()) release(this.attrs.host);
    if (this.scrollCue) window.removeEventListener('resize', this.scrollCue);
  }

  fallback(): boolean {
    return this.attrs.host === 'sidebar' || this.attrs.host === 'strip';
  }

  /**
   * The strip shows on wide screens too when the sidebar copy is not on screen,
   * and fades at the right while more chips are out of view.
   */
  measure() {
    if (this.attrs.host !== 'strip') return;
    const side = document.querySelector<HTMLElement>('.FanfareWidget--sidebar');
    const wanted = !side || !side.offsetParent;
    if (wanted !== !!this.wide) {
      this.wide = wanted;
      m.redraw();
    }

    const el = (this.element as HTMLElement | undefined)?.querySelector<HTMLElement>('.FanfareWidget-scroll');
    if (!el) return;
    if (!this.scrollCue) {
      this.scrollCue = () => el.classList.toggle('is-more', el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
      el.addEventListener('scroll', this.scrollCue, { passive: true });
      window.addEventListener('resize', this.scrollCue);
    }
    this.scrollCue();
  }

  view() {
    const data = fanfare();
    const today = peopleToday(data);
    const strip = this.attrs.host === 'strip';

    const courses = data.courses?.list || [];

    if ((!today.birthdays.length && !today.anniversaries.length && !courses.length) || (this.fallback() && hosted()) || isClosed(data)) return null;

    return (
      <section
        className={'FanfareWidget FanfareWidget--' + this.attrs.host + (strip && this.wide ? ' is-wide' : '')}
        aria-label={t('widget.heading')}
      >
        <div className="FanfareWidget-scroll">{this.groups(data, strip)}</div>
        <button
          type="button"
          className="Button Button--icon Button--flat FanfareWidget-close"
          aria-label={t('widget.close')}
          title={t('widget.close')}
          onclick={() => close(data)}
        >
          <i className="fas fa-xmark" aria-hidden="true" />
        </button>
      </section>
    );
  }

  /** The widget's groups: today's birthdays, anniversaries and course completions. */
  groups(data: FanfareData, strip: boolean): Mithril.Children {
    const today = peopleToday(data);
    const courses = data.courses?.list || [];

    return [
      today.birthdays.length
        ? group(
            '🎂',
            strip ? t('widget.today') : t('widget.heading'),
            this.rows(today.birthdays, 'birthday', strip),
            more(data.people!.more.birthdays, strip)
          )
        : null,
      today.anniversaries.length
        ? group('🏅', t('widget.anniversaries'), this.rows(today.anniversaries, 'anniversary', strip), more(data.people!.more.anniversaries, strip))
        : null,
      courses.length
        ? group(
            '🎓',
            t('widget.courses'),
            courses.map((c) => this.courseRow(c, strip)),
            more(data.courses!.more, strip)
          )
        : null,
    ];
  }

  /** Today's birthdays or anniversaries: each person, and a wish for them. */
  rows(list: Person[], kind: Kind, strip: boolean) {
    const data = fanfare();
    return list.map((p) => {
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
  }

  /** Who finished a course: the course links to its certificate's public page. */
  courseRow(c: CourseCompletion, strip: boolean) {
    const u = fanfare().courses!.users[c.user];
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
  wishButton(id: number, kind: Kind, name: string | undefined, ref?: number) {
    const data = fanfare();
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

  wish(id: number, kind: Kind, name: string | undefined, ref: number | undefined, key: string) {
    this.busy = true;
    app
      .request({
        method: 'POST',
        url: app.forum.attribute('apiUrl') + '/fanfare-wishes',
        body: { data: { type: 'fanfare-wishes', attributes: { userId: id, kind, achievementId: ref ?? null } } },
      })
      .then(() => {
        const data = fanfare();
        data.wished = [...(data.wished || []), key];
        app.alerts.show({ type: 'success' }, t(kind === 'course' ? 'widget.congratulate_sent' : 'widget.wish_sent', { name }));
      })
      .finally(() => {
        this.busy = false;
        m.redraw();
      });
  }
}

/** A group of the widget: its heading, its rows and how many more there are. */
function group(emoji: string, heading: Mithril.Children, rows: Mithril.Children, rest: Mithril.Children) {
  return (
    <div className="FanfareWidget-group">
      <h4 className="FanfareWidget-heading">
        {emoji + ' '}
        {heading}
      </h4>
      {rows}
      {rest}
    </div>
  );
}

function more(n: number, strip: boolean) {
  return n > 0 && !strip ? <div className="FanfareWidget-more">{t('widget.more', { count: n })}</div> : null;
}

function avatar(u: PersonUser) {
  return u.avatar ? (
    <img className="Avatar FanfareWidget-avatar" src={u.avatar} alt="" loading="lazy" />
  ) : (
    <span className="Avatar FanfareWidget-avatar" style={{ '--avatar-bg': '#' + stringToColor(u.username) }} aria-hidden="true">
      {(u.name || u.username || '?').charAt(0).toUpperCase()}
    </span>
  );
}
