import app from 'flarum/admin/app';
import Component from 'flarum/common/Component';
import Switch from 'flarum/common/components/Switch';
import Select from 'flarum/common/components/Select';

const NS = 'ernestdefoe-fanfare';
const t = (key, params) => app.translator.trans(`${NS}.admin.${key}`, params);

const EMOJI = {
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

/**
 * The occasions table: on or off, the next date (worked out on the server),
 * a day's shift for moon-sighted holidays, and a preview of the moment. All of
 * it is one JSON setting, saved with the page's Save button.
 */
export default class Occasions extends Component {
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

  row(id, onByDefault, emoji, label, fromFestoon, shift) {
    const { setting, data } = this.attrs;
    const row = this.stored[id] || {};
    const next = data.next?.[id];
    const update = (change) => setting(JSON.stringify({ ...this.stored, [id]: { ...row, ...change } }));

    return (
      <tr key={id}>
        <td className="FanfareOccasions-name">
          <Switch state={row.on ?? onByDefault} onchange={(v) => update({ on: v })}>
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
              onchange={(v) => update({ shift: Number(v) })}
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

function parse(value) {
  try {
    const v = JSON.parse(value || '{}');
    return v && typeof v === 'object' ? v : {};
  } catch (e) {
    // A setting saved by hand that isn't JSON: start from the defaults.
    return {};
  }
}
