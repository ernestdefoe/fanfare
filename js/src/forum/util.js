import app from 'flarum/forum/app';
import extractText from 'flarum/common/utils/extractText';

export const t = (key, params) => app.translator.trans('ernestdefoe-fanfare.forum.' + key, params);
export const text = (key, params) => extractText(t(key, params));

/** Guests' choices live in the browser; it may refuse storage (private windows). */
export const local = {
  get(k) {
    try {
      return window.localStorage.getItem(k);
    } catch (e) {
      return null;
    }
  },
  set(k, v) {
    try {
      window.localStorage.setItem(k, v);
    } catch (e) {}
  },
};
