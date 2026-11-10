import { fof, hasFofWidgets, placed } from '../common/fofWidgets';

/*
 * The birthday widget in the widget hosts Ernest's forums use: Bespoke's
 * widget zones and fof/forum-widgets-core. Both are resolved at runtime, never
 * imported, so the bundle is the same whether either is installed. Registering
 * offers the widget; only a placed, mounted copy makes the fallback stand down
 * (hosted(), below), so installing a theme never leaves it nowhere.
 */

const mounts = new Map();

export function claim(host) {
  mounts.set(host, (mounts.get(host) || 0) + 1);
  if (mounts.get(host) === 1) m.redraw();
}

export function release(host) {
  const n = (mounts.get(host) || 0) - 1;
  if (n > 0) mounts.set(host, n);
  else mounts.delete(host);
  if (n <= 0) m.redraw();
}

/** Whether a host the admin placed it in is showing it right now. */
export const hosted = () => mounts.size > 0;

export default function registerHosts(app, render) {
  const flarum = globalThis.flarum;

  if (hasFofWidgets()) {
    const Widgets = fof('common/extend/Widgets');
    const WidgetBase = fof('common/components/Widget');

    if (Widgets && WidgetBase && app.widgets) {
      class FanfareFofWidget extends WidgetBase {
        className() {
          return 'FanfareFofWidget';
        }
        icon() {
          return 'fas fa-cake-candles';
        }
        title() {
          return app.translator.trans('ernestdefoe-fanfare.forum.widget.heading');
        }
        content() {
          return render('fof');
        }
      }

      new Widgets()
        .add({
          key: 'fanfareToday',
          component: FanfareFofWidget,
          // Opt-in: only where the admin placed it in FoF's layout editor.
          isDisabled: () => !placed(app, 'ernestdefoe-fanfare', 'fanfareToday'),
          isUnique: true,
          placement: 'end',
          position: 1,
        })
        .extend(app, 'ernestdefoe-fanfare');
    }
  }

  if (flarum?.extensions && 'ernestdefoe-bespoke' in flarum.extensions) {
    globalThis.BespokeWidgetQueue = globalThis.BespokeWidgetQueue || [];
    globalThis.BespokeWidgetQueue.push({
      type: 'fanfare-today',
      // A key, not translated text: Bespoke resolves it in the reader's locale.
      label: 'ernestdefoe-fanfare.forum.widget.heading',
      icon: 'fas fa-cake-candles',
      zones: ['sidebar', 'above-list', 'below-list', 'footer'],
      schema: [],
      component: { view: () => render('bespoke') },
    });
  }
}
