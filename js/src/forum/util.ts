import app from 'flarum/forum/app';
import extractText from 'flarum/common/utils/extractText';

export const t = (key: string, params: Record<string, unknown> = {}) => app.translator.trans('ernestdefoe-fanfare.forum.' + key, params);
export const text = (key: string, params: Record<string, unknown> = {}) => extractText(t(key, params));

/** Guests' choices live in the browser; it may refuse storage (private windows). */
export const local = {
  get(k: string): string | null {
    try {
      return window.localStorage.getItem(k);
    } catch (e) {
      return null;
    }
  },
  set(k: string, v: string): void {
    try {
      window.localStorage.setItem(k, v);
    } catch (e) {
      // Storage refused: the choice lasts for this page only, which is all a guest can have.
    }
  },
};
