import { bottomWatch } from './bottom';
import { stopTune } from './music';
import { $, calm, st } from './state';

export function close() {
  if (!st.root || !st.current || st.root.classList.contains('leaving')) return;
  stopTune();
  st.fx.settle();
  const was = st.current;
  st.current = null;
  bottomWatch?.();
  st.root.classList.remove('up');
  st.root.classList.add('leaving');
  setTimeout(
    () => {
      if (st.current) return; // opened again meanwhile
      st.timers.forEach(clearTimeout);
      st.timers = [];
      clearInterval(st.ticker);
      st.root.className = 'FanfareStage';
      $('.Piece')!.innerHTML = '';
      $('.TopDeco')!.innerHTML = '';
      st.host.onClose?.(was);
    },
    calm() ? 0 : 720
  );
}
