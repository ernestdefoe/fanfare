import app from 'flarum/forum/app';
import FieldSet from 'flarum/common/components/FieldSet';
import Switch from 'flarum/common/components/Switch';
import Select from 'flarum/common/components/Select';
import Button from 'flarum/common/components/Button';
import { t } from './util';

/**
 * Settings → Fanfare: the member's birthday (month and day, year optional),
 * who sees it, and their sound and effects switches. With the Birthdays
 * extension installed the birthday is set there instead.
 */
export default function settingsItems(items) {
  const user = this.user;
  const prefs = user.preferences() || {};
  const own = app.forum.attribute('fanfareOwnBirthday');
  const bd = (this.fanfare ??= read(user));

  const save = (attrs) => {
    bd.saving = true;
    user.save(attrs).finally(() => {
      bd.saving = false;
      m.redraw();
    });
  };

  const saveDate = () => {
    if (!bd.month || !bd.day) return;
    if (
      `${pad(bd.month)}-${pad(bd.day)}` === user.attribute('fanfareBirthday') &&
      String(bd.year || '') === String(user.attribute('fanfareBirthYear') || '')
    )
      return;
    const year = Number(bd.year);
    if (bd.year && (!Number.isInteger(year) || year < 1900 || year > new Date().getFullYear())) return;
    save({ fanfareBirthday: `${pad(bd.month)}-${pad(bd.day)}`, fanfareBirthYear: bd.year ? Number(bd.year) : null });
  };

  const months = {};
  const fmt = new Intl.DateTimeFormat(app.translator.getLocale?.() || 'en', { month: 'long' });
  for (let i = 1; i <= 12; i++) months[i] = fmt.format(new Date(2000, i - 1, 1));
  const days = {};
  for (let i = 1; i <= new Date(2000, bd.month || 1, 0).getDate(); i++) days[i] = String(i);

  const birthday = own ? (
    <div className="Form-group FanfareSettings-birthday">
      <label>{t('settings.birthday')}</label>
      <div className="FanfareSettings-row">
        <Select
          value={bd.month || ''}
          options={{ '': t('settings.month'), ...months }}
          disabled={bd.saving}
          onchange={(v) => {
            bd.month = Number(v) || null;
            if (bd.day > new Date(2000, bd.month || 1, 0).getDate()) bd.day = null;
            saveDate();
          }}
        />
        <Select
          value={bd.day || ''}
          options={{ '': t('settings.day'), ...days }}
          disabled={bd.saving}
          onchange={(v) => {
            bd.day = Number(v) || null;
            saveDate();
          }}
        />
        <input
          className="FormControl FanfareSettings-year"
          type="number"
          inputmode="numeric"
          min="1900"
          max={new Date().getFullYear()}
          placeholder={t('settings.year')}
          aria-label={t('settings.year')}
          value={bd.year || ''}
          oninput={(e) => {
            bd.year = e.target.value;
            // Android's keyboard can close without the field losing focus, so no change
            // event comes: a full four-digit year is saved as it is typed.
            if (/^\d{4}$/.test(bd.year)) saveDate();
          }}
          onchange={saveDate}
        />
        {bd.month || bd.day ? (
          <Button
            className="Button Button--link"
            disabled={bd.saving}
            onclick={() => {
              bd.month = bd.day = bd.year = null;
              save({ fanfareBirthday: null, fanfareBirthYear: null });
            }}
          >
            {t('settings.clear')}
          </Button>
        ) : null}
      </div>
      <label className="FanfareSettings-label">{t('settings.visibility')}</label>
      <Select
        value={String(bd.visibility)}
        options={{ 0: t('settings.visibility_0'), 1: t('settings.visibility_1'), 2: t('settings.visibility_2') }}
        disabled={bd.saving}
        onchange={(v) => {
          bd.visibility = Number(v);
          save({ fanfareBirthdayVisibility: bd.visibility });
        }}
      />
    </div>
  ) : (
    <p className="helpText">{t('settings.datlechin')}</p>
  );

  const pref = (key, label) => (
    <Switch
      state={prefs[key] !== false}
      onchange={(value, component) => {
        component.loading = true;
        user.savePreferences({ [key]: value }).then(() => {
          component.loading = false;
          m.redraw();
        });
      }}
    >
      {label}
    </Switch>
  );

  items.add(
    'fanfare',
    <FieldSet className="Settings-fanfare FieldSet--min" label={t('settings.heading')}>
      {birthday}
      {pref('fanfareSound', t('settings.sound'))}
      {pref('fanfareEffects', t('settings.effects'))}
    </FieldSet>,
    -5
  );
}

function read(user) {
  const md = user.attribute('fanfareBirthday');
  const visibility = user.attribute('fanfareBirthdayVisibility');

  return {
    month: md ? Number(md.slice(0, 2)) : null,
    day: md ? Number(md.slice(3, 5)) : null,
    year: user.attribute('fanfareBirthYear') || '',
    visibility: visibility === null || visibility === undefined ? 1 : visibility,
    saving: false,
  };
}

const pad = (n) => String(n).padStart(2, '0');
