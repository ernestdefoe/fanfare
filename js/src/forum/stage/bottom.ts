import { $, st } from './state';

/**
 * Rise from just above whatever sits over the bottom of the screen: a tab bar
 * (FoF Mobile Tab and the like) and Flarum's alerts (a push prompt, "Saved"),
 * which stay on top. Followed while the stage is open, as alerts come and go.
 *
 * Only the tab bar sizes the piece. Alerts move it up, never further than the
 * room above it, so a stack of toasts can't shrink it (Claudius, d/244/13).
 */
export let bottomWatch: (() => void) | null = null;

function bottom() {
  let bar = 0;
  let alerts = 0;
  const tabs = document.querySelector('.MobileTab-bar, .MobileTab');
  const rect = tabs && getComputedStyle(tabs).position === 'fixed' ? tabs.getBoundingClientRect() : null;
  if (rect && rect.height && rect.bottom >= innerHeight - 2) bar = rect.height;
  for (const alert of Array.from(document.querySelectorAll('.AlertManager .Alert'))) {
    const r = alert.getBoundingClientRect();
    if (r.height) alerts = Math.max(alerts, innerHeight - r.top + 10);
  }
  st.root.style.setProperty('--ff-bar', Math.round(bar) + 'px');

  // The piece's height doesn't depend on the lift, so it can be read before setting it.
  const room = Math.max(0, innerHeight - bar - ($('.Piece')?.offsetHeight || 0) - 12);
  st.root.style.setProperty('--ff-lift', Math.round(Math.min(Math.max(0, alerts - bar), room)) + 'px');
}

export function watchBottom() {
  bottom();
  if (bottomWatch) return;
  const alerts = document.getElementById('alerts');
  const mo = new MutationObserver(bottom);
  if (alerts) mo.observe(alerts, { childList: true, subtree: true });
  addEventListener('resize', bottom);
  bottomWatch = () => {
    mo.disconnect();
    removeEventListener('resize', bottom);
    bottomWatch = null;
  };
}
