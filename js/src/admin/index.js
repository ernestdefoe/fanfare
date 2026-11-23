import app from 'flarum/admin/app';
import { registerEditorWidgets } from '../common/fofWidgets';

export { default as extend } from './extend';

const NS = 'ernestdefoe-fanfare';

app.initializers.add(NS, () => {
  // FoF's layout editor lists only widgets the admin registers too.
  registerEditorWidgets(app, NS, [
    { key: 'fanfareToday', icon: 'fas fa-cake-candles', title: () => app.translator.trans(`${NS}.admin.widget_title`) },
  ]);
});
