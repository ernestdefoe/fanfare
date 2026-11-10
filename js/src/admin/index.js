import app from 'flarum/admin/app';
import Occasions from './Occasions';
import { registerEditorWidgets } from '../common/fofWidgets';

const NS = 'ernestdefoe-fanfare';
const t = (key, params) => app.translator.trans(`${NS}.admin.settings.${key}`, params);

app.initializers.add(NS, () => {
  const data = app.data.fanfareAdmin || {};

  // FoF's layout editor lists only widgets the admin registers too.
  registerEditorWidgets(app, NS, [
    { key: 'fanfareToday', icon: 'fas fa-cake-candles', title: () => app.translator.trans(`${NS}.admin.widget_title`) },
  ]);

  app.registry
    .for(NS)
    .registerPermission(
      {
        icon: 'fas fa-cake-candles',
        label: app.translator.trans(`${NS}.admin.permissions.view_people`),
        permission: `${NS}.viewPeople`,
        allowGuest: true,
      },
      'view'
    )
    .registerPermission({ icon: 'fas fa-gift', label: app.translator.trans(`${NS}.admin.permissions.wish`), permission: `${NS}.wish` }, 'reply')
    .registerSetting(function () {
      return <Occasions setting={this.setting(`${NS}.occasions`)} data={data} />;
    })
    .registerSetting(() => <h3 className="FanfareAdmin-heading">{t('people_heading')}</h3>)
    .registerSetting(() => <p className="helpText">{data.datlechin ? t('datlechin_help') : t('people_help')}</p>)
    .registerSetting({ setting: `${NS}.milestones`, type: 'boolean', label: t('milestones') })
    .registerSetting({ setting: `${NS}.forum_birthday`, type: 'date', label: t('forum_birthday'), help: t('forum_birthday_help') })
    .registerSetting(() => <h3 className="FanfareAdmin-heading">{t('effects_heading')}</h3>)
    .registerSetting(() => <p className="helpText">{t('effects_help')}</p>)
    .registerSetting({
      setting: `${NS}.intensity`,
      type: 'select',
      label: t('intensity'),
      options: { subtle: t('intensity_subtle'), festive: t('intensity_festive'), full: t('intensity_full') },
      default: 'festive',
    })
    .registerSetting({ setting: `${NS}.once_a_day`, type: 'boolean', label: t('once_a_day') })
    .registerSetting({ setting: `${NS}.quiet_from`, type: 'time', label: t('quiet_from') })
    .registerSetting({ setting: `${NS}.quiet_to`, type: 'time', label: t('quiet_to'), help: t('quiet_help') })
    .registerSetting({ setting: `${NS}.timezone`, type: 'text', label: t('timezone'), help: t('timezone_help'), placeholder: data.timezone });
});
