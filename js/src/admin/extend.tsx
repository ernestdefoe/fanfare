import app from 'flarum/admin/app';
import m from 'mithril';
import Extend from 'flarum/common/extenders';
import type Mithril from 'mithril';
import type AdminPage from 'flarum/admin/components/AdminPage';
import Occasions, { type OccasionsData } from './Occasions';

const NS = 'ernestdefoe-fanfare';
const t = (key: string, params: Record<string, unknown> = {}) => app.translator.trans(`${NS}.admin.settings.${key}`, params);
/** What the server tells the settings page: the catalogue, Festoon's days, Syllabus and the timezone. */
export interface FanfareAdminData extends OccasionsData {
  datlechin?: boolean;
  syllabus?: boolean;
}

const data = (): FanfareAdminData => (app.data.fanfareAdmin as FanfareAdminData | undefined) || {};

export default [
  new Extend.Admin()
    .permission(
      () => ({
        icon: 'fas fa-cake-candles',
        label: app.translator.trans(`${NS}.admin.permissions.view_people`),
        permission: `${NS}.viewPeople`,
        allowGuest: true,
      }),
      'view'
    )
    .permission(() => ({ icon: 'fas fa-gift', label: app.translator.trans(`${NS}.admin.permissions.wish`), permission: `${NS}.wish` }), 'reply')
    // Called with the settings page as `this`, which owns the setting streams.
    .customSetting(function (this: AdminPage) {
      return <Occasions setting={this.setting(`${NS}.occasions`)} data={data()} />;
    }, 100)
    .customSetting(() => <h3 className="FanfareAdmin-heading">{t('people_heading')}</h3>, 90)
    .customSetting(() => <p className="helpText">{data().datlechin ? t('datlechin_help') : t('people_help')}</p>, 89)
    .setting(() => ({ setting: `${NS}.milestones`, type: 'boolean', label: t('milestones') }), 88)
    .setting(() => ({ setting: `${NS}.forum_birthday`, type: 'date', label: t('forum_birthday'), help: t('forum_birthday_help') }), 87)
    // Course completions: only while Syllabus is enabled.
    .customSetting(() => (data().syllabus ? <h3 className="FanfareAdmin-heading">{t('courses_heading')}</h3> : null), 80)
    .customSetting(() => (data().syllabus ? <p className="helpText">{t('courses_help')}</p> : null), 79)
    .setting(() => (data().syllabus ? { setting: `${NS}.courses`, type: 'boolean', label: t('courses') } : null), 78)
    .setting(
      () =>
        data().syllabus ? { setting: `${NS}.courses_public`, type: 'boolean', label: t('courses_public'), help: t('courses_public_help') } : null,
      77
    )
    .customSetting(() => (data().syllabus ? m(CoursePreview) : null), 76)
    .customSetting(() => <h3 className="FanfareAdmin-heading">{t('effects_heading')}</h3>, 70)
    .customSetting(() => <p className="helpText">{t('effects_help')}</p>, 69)
    .setting(
      () => ({
        setting: `${NS}.intensity`,
        type: 'select',
        label: t('intensity'),
        options: { subtle: t('intensity_subtle'), festive: t('intensity_festive'), full: t('intensity_full') },
      }),
      68
    )
    .setting(() => ({ setting: `${NS}.once_a_day`, type: 'boolean', label: t('once_a_day') }), 67)
    .setting(() => ({ setting: `${NS}.quiet_from`, type: 'time', label: t('quiet_from') }), 66)
    .setting(() => ({ setting: `${NS}.quiet_to`, type: 'time', label: t('quiet_to'), help: t('quiet_help') }), 65)
    .setting(() => ({ setting: `${NS}.timezone`, type: 'text', label: t('timezone'), help: t('timezone_help'), placeholder: data().timezone }), 64),
];

function CoursePreview(): Mithril.Component {
  return {
    view: () => (
      <p className="FanfareOccasions-people">
        <a className="Button Button--flat" href={`${app.forum.attribute('baseUrl')}/?fanfare=course`} target="_blank" rel="noopener">
          <i className="fas fa-eye" aria-hidden="true" /> {t('preview_course')}
        </a>
      </p>
    ),
  };
}
