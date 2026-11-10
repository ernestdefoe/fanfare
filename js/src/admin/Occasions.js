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
    const stored = parse(setting());
    const catalogue = data.catalogue || {};
    const base = app.forum.attribute('baseUrl');
    const fmt = new Intl.DateTimeFormat(app.translator.getLocale?.() || 'en', { month: 'short', day: 'numeric', year: 'numeric' });

    const update = (id, change) => {
      const next = { ...stored, [id]: { ...(stored[id] || {}), ...change } };
      setting(JSON.stringify(next));
    };

    return (
      <div className="Form-group FanfareOccasions">
        <h3 className="FanfareAdmin-heading">{t('settings.occasions_heading')}</h3>
        <p className="helpText">
          {t('settings.occasions_help', { timezone: data.timezone })} {data.festoon ? t('settings.festoon_help') : null}
        </p>
        <p className="FanfareOccasions-people">
          {t('settings.preview_people')}{' '}
          {['birthday', 'anniversary', 'forum'].map((id) => (
            <a className="Button Button--flat" href={`${base}/?fanfare=${id}`} target="_blank" rel="noopener">
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
              {Object.keys(catalogue).map((id) => {
                const c = catalogue[id];
                const row = stored[id] || {};
                const on = row.on ?? c.on;
                const next = data.next?.[id];

                return (
                  <tr key={id}>
                    <td className="FanfareOccasions-name">
                      <Switch state={on} onchange={(v) => update(id, { on: v })}>
                        <span aria-hidden="true">{EMOJI[id]}</span> {t('occasions.' + id)}
                      </Switch>
                      {data.festoon && c.festoon ? <span className="FanfareOccasions-festoon">{t('settings.from_festoon')}</span> : null}
                    </td>
                    <td className="FanfareOccasions-next">{next ? fmt.format(new Date(next + 'T12:00')) : '—'}</td>
                    <td>
                      {c.shift ? (
                        <Select
                          value={String(row.shift || 0)}
                          options={{ '-1': t('settings.shift_minus'), 0: t('settings.shift_0'), 1: t('settings.shift_plus') }}
                          onchange={(v) => update(id, { shift: Number(v) })}
                        />
                      ) : null}
                    </td>
                    <td>
                      <a className="Button Button--flat" href={`${base}/?fanfare=${id}`} target="_blank" rel="noopener">
                        <i className="fas fa-eye" aria-hidden="true" /> {t('settings.preview')}
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

function parse(value) {
  try {
    const v = JSON.parse(value || '{}');
    return v && typeof v === 'object' ? v : {};
  } catch (e) {
    return {};
  }
}
