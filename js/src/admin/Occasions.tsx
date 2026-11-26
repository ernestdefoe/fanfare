import app from 'flarum/admin/app';
import Component, { type ComponentAttrs } from 'flarum/common/Component';
import type Stream from 'flarum/common/utils/Stream';
import Switch from 'flarum/common/components/Switch';
import Select from 'flarum/common/components/Select';
import type Mithril from 'mithril';

const NS = 'ernestdefoe-fanfare';
const t = (key: string, params: Record<string, unknown> = {}) => app.translator.trans(`${NS}.admin.${key}`, params);

const EMOJI: Record<string, string> = {
  newyear: '🎆',
  christmas: '🎁',
  thanksgiving: '🍂',
  thanksgiving_ca: '🍂',
  halloween: '🎃',
  lunar: '🏮',
  diwali: '🪔',
  eidfitr: '🌙',
  eidadha: '🌙',
  hanukkah: '🕎',
};

/** An occasion in the server's catalogue: on by default, from Festoon, and whether it takes a day's shift. */
interface CatalogueEntry {
  on: boolean;
  festoon?: boolean;
  shift?: boolean;
}

/** One occasion as stored in the setting: the admin's switch and shift. */
interface StoredOccasion {
  on?: boolean;
  shift?: number;
}

export interface OccasionsData {
  catalogue?: Record<string, CatalogueEntry>;
  custom?: Record<string, { emoji?: string; name?: string }>;
  next?: Record<string, string>;
  festoon?: boolean;
  timezone?: string;
}

export interface OccasionsAttrs extends ComponentAttrs {
  setting: Stream<string>;
  data: OccasionsData;
}

/**
 * The occasions table: on or off, the next date (worked out on the server),
 * a day's shift for moon-sighted holidays, and a preview of the moment. All of
 * it is one JSON setting, saved with the page's Save button.
 */
export default class Occasions extends Component<OccasionsAttrs> {
  stored: Record<string, StoredOccasion> = {};
  base = '';
  fmt!: Intl.DateTimeFormat;

  view() {
    const { setting, data } = this.attrs;
    this.stored = parse(setting());
    this.base = app.forum.attribute('baseUrl');
    this.fmt = new Intl.DateTimeFormat(app.translator.getLocale?.() || 'en', { month: 'short', day: 'numeric', year: 'numeric' });
    const catalogue = data.catalogue || {};
    const custom = data.custom || {};

    return (
      <div className="Form-group FanfareOccasions">
        <h3 className="FanfareAdmin-heading">{t('settings.occasions_heading')}</h3>
        <p className="helpText">
          {t('settings.occasions_help', { timezone: data.timezone })} {data.festoon ? t('settings.festoon_help') : null}
        </p>
        <p className="FanfareOccasions-people">
          {t('settings.preview_people')}{' '}
          {['birthday', 'anniversary', 'forum'].map((id) => (
            <a className="Button Button--flat" href={`${this.base}/?fanfare=${id}`} target="_blank" rel="noopener">
              <i className="fas fa-eye" aria-hidden="true" /> {t('occasions.' + id)}
            </a>
          ))}
        </p>
        <div className="FanfareOccasions-scroll">
          <table className="FanfareOccasions-table">
            <thead>
              <tr>
                <th>{t('settings.occasion')}</th>
                <th>{t('settings.next')}</th>
                <th>{t('settings.shift')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {Object.keys(catalogue).map((id) =>
                this.row(id, catalogue[id].on, EMOJI[id], t('occasions.' + id), data.festoon && catalogue[id].festoon, catalogue[id].shift)
              )}
              {/* The days an admin made in Festoon: on unless turned off here. */}
              {Object.keys(custom).map((id) => this.row(id, true, custom[id].emoji || '🎉', custom[id].name || id, true, false))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  row(
    id: string,
    onByDefault: boolean,
    emoji: string | undefined,
    label: Mithril.Children,
    fromFestoon: boolean | undefined,
    shift: boolean | undefined
  ) {
    const { setting, data } = this.attrs;
    const row = this.stored[id] || {};
    const next = data.next?.[id];
    const update = (change: StoredOccasion) => setting(JSON.stringify({ ...this.stored, [id]: { ...row, ...change } }));

    return (
      <tr key={id}>
        <td className="FanfareOccasions-name">
          <Switch state={row.on ?? onByDefault} onchange={(v: boolean) => update({ on: v })}>
            <span aria-hidden="true">{emoji}</span> {label}
          </Switch>
          {fromFestoon ? <span className="FanfareOccasions-festoon">{t('settings.from_festoon')}</span> : null}
        </td>
        <td className="FanfareOccasions-next">{next ? this.fmt.format(new Date(next + 'T12:00')) : '—'}</td>
        <td>
          {shift ? (
            <Select
              value={String(row.shift || 0)}
              options={{ '-1': t('settings.shift_minus'), 0: t('settings.shift_0'), 1: t('settings.shift_plus') }}
              onchange={(v: string) => update({ shift: Number(v) })}
            />
          ) : null}
        </td>
        <td>
          <a className="Button Button--flat" href={`${this.base}/?fanfare=${id}`} target="_blank" rel="noopener">
            <i className="fas fa-eye" aria-hidden="true" /> {t('settings.preview')}
          </a>
        </td>
      </tr>
    );
  }
}

function parse(value: string): Record<string, StoredOccasion> {
  try {
    const v = JSON.parse(value || '{}');
    return v && typeof v === 'object' ? v : {};
  } catch (e) {
    // A setting saved by hand that isn't JSON: start from the defaults.
    return {};
  }
}
