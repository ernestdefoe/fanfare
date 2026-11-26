import { blow, openGift } from './moments';
import { playTune, stopTune } from './music';
import type { Scene } from './scenes';
import { $, $$, lamps, later, st } from './state';

/** Enter or Space on a role="button" element does what a click does. */
const pressable = (el: HTMLElement, action: () => void) => {
  el.onclick = action;
  el.onkeydown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };
};

export function wire(s: Scene) {
  wireSound(s);

  const wish = $('#ffWish');
  if (wish)
    wish.onclick = () =>
      lamps()
        .filter((l) => l.classList.contains('lit'))
        .forEach((l, i) => later(() => blow(l), i * 120));

  const open = $('#ffOpen');
  if (open) open.onclick = openGift;

  const gift = $('.Gift');
  if (gift) {
    gift.setAttribute('aria-label', st.host.t('open_present'));
    pressable(gift, openGift);
  }

  $$('.Piece .Candle').forEach((c, i) => {
    c.setAttribute('aria-label', st.host.t('blow_candle', { number: i + 1 }));
    pressable(c, () => blow(c));
  });
}

/** The mute button, and the play button, which waits while sound is off. */
function wireSound(s: Scene) {
  const muted = !st.host.sound();
  const mute = $('#ffMute');
  const play = $<HTMLButtonElement>('#ffPlay');

  if (mute) {
    mute.innerHTML = `<i class="fas ${muted ? 'fa-volume-xmark' : 'fa-volume-high'}" aria-hidden="true"></i>`;
    mute.setAttribute('aria-label', st.host.t(muted ? 'turn_sound_on' : 'turn_sound_off'));
    mute.title = mute.getAttribute('aria-label') as string;
    mute.onclick = () => {
      stopTune();
      st.host.setSound(muted);
      st.host.alert(st.host.t(muted ? 'sound_on_toast' : 'sound_off_toast'));
      wire(s);
    };
  }

  if (play) {
    const lbl = play.querySelector('.lbl')!;
    play.dataset.lbl = play.dataset.lbl || (lbl.textContent as string);
    play.disabled = muted;
    lbl.textContent = muted ? st.host.t('sound_off') : play.dataset.lbl;
    play.onclick = () => playTune(s.tune, play, st.host.t('playing'));
  }
}
