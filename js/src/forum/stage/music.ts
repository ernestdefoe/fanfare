/*
 * Tunes as note lists ([midi, beats]), played on a small WebAudio music box:
 * no audio files, nothing to license. All melodies are public domain or our
 * own. Nothing plays without a tap.
 */
/** A tune: its title, tempo and notes as [midi, beats]. */
export interface Tune {
  title: string;
  bpm: number;
  notes: [number, number][];
}

export const TUNES: Record<string, Tune> = {
  birthday: {
    title: 'Happy Birthday',
    bpm: 104,
    notes: [
      [67, 0.75],
      [67, 0.25],
      [69, 1],
      [67, 1],
      [72, 1],
      [71, 2],
      [67, 0.75],
      [67, 0.25],
      [69, 1],
      [67, 1],
      [74, 1],
      [72, 2],
      [67, 0.75],
      [67, 0.25],
      [79, 1],
      [76, 1],
      [72, 1],
      [71, 1],
      [69, 2],
      [77, 0.75],
      [77, 0.25],
      [76, 1],
      [72, 1],
      [74, 1],
      [72, 3],
    ],
  },
  christmas: {
    title: 'We Wish You a Merry Christmas',
    bpm: 150,
    notes: [
      [62, 1],
      [67, 1],
      [67, 0.5],
      [69, 0.5],
      [67, 0.5],
      [66, 0.5],
      [64, 1],
      [64, 1],
      [64, 1],
      [69, 1],
      [69, 0.5],
      [71, 0.5],
      [69, 0.5],
      [67, 0.5],
      [66, 1],
      [62, 1],
      [62, 1],
      [71, 1],
      [71, 0.5],
      [72, 0.5],
      [71, 0.5],
      [69, 0.5],
      [67, 1],
      [64, 1],
      [62, 0.5],
      [62, 0.5],
      [64, 1],
      [69, 1],
      [66, 1],
      [67, 3],
    ],
  },
  jingle: {
    title: 'Jingle Bells',
    bpm: 170,
    notes: [
      [76, 1],
      [76, 1],
      [76, 2],
      [76, 1],
      [76, 1],
      [76, 2],
      [76, 1],
      [79, 1],
      [72, 1.5],
      [74, 0.5],
      [76, 4],
      [77, 1],
      [77, 1],
      [77, 1.5],
      [77, 0.5],
      [77, 1],
      [76, 1],
      [76, 1],
      [76, 0.5],
      [76, 0.5],
      [76, 1],
      [74, 1],
      [74, 1],
      [76, 1],
      [74, 2],
      [79, 2],
    ],
  },
  auld: {
    title: 'Auld Lang Syne',
    bpm: 92,
    notes: [
      [60, 1],
      [65, 1.5],
      [65, 0.5],
      [65, 1],
      [69, 1],
      [67, 1.5],
      [65, 0.5],
      [67, 1],
      [69, 0.5],
      [67, 0.5],
      [65, 1.5],
      [65, 0.5],
      [69, 1],
      [72, 1],
      [74, 3],
      [74, 1],
      [72, 1.5],
      [69, 0.5],
      [69, 1],
      [65, 1],
      [67, 1.5],
      [65, 0.5],
      [67, 1],
      [69, 0.5],
      [67, 0.5],
      [65, 1.5],
      [62, 0.5],
      [62, 1],
      [60, 1],
      [65, 3],
    ],
  },
  fanfare: {
    title: 'a fanfare',
    bpm: 132,
    notes: [
      [67, 0.5],
      [72, 0.5],
      [76, 0.5],
      [79, 1.5],
      [76, 0.5],
      [79, 1],
      [84, 3],
      [79, 0.5],
      [84, 0.5],
      [88, 3],
    ],
  },
  spooky: {
    title: 'a spooky tune',
    bpm: 110,
    notes: [
      [69, 0.5],
      [72, 0.5],
      [76, 0.5],
      [75, 1],
      [72, 0.5],
      [69, 0.5],
      [68, 1.5],
      [64, 0.5],
      [65, 0.5],
      [68, 0.5],
      [71, 0.5],
      [69, 3],
    ],
  },
  chime: {
    title: 'a festive chime',
    bpm: 200,
    notes: [
      [72, 1],
      [76, 1],
      [79, 1],
      [84, 2],
      [81, 1],
      [79, 1],
      [76, 1],
      [79, 3],
      [72, 0.5],
      [76, 0.5],
      [79, 0.5],
      [84, 4],
    ],
  },
};

let audio: AudioContext | null = null;
let stop: (() => void) | null = null;

export function stopTune() {
  if (stop) stop();
}

/** Play a tune on a button with .lbl / .prog / .eq inside; a second tap stops it. */
export function playTune(id: string | null, btn: HTMLElement, playingLabel: string) {
  if (stop) {
    stop();
    return;
  }
  const tune = TUNES[id as string];
  if (!tune) return;
  audio = audio || new (window.AudioContext || window.webkitAudioContext!)();
  audio.resume();
  const ctx = audio,
    { out, wet } = musicBox(ctx);
  const { end, nodes } = schedule(ctx, tune, out);
  const total = (end - ctx.currentTime) * 1000;
  const finish = progress(btn, playingLabel, total);
  stop = () => {
    nodes.forEach((n) => {
      try {
        n.stop();
      } catch (e) {
        // A note that already ended throws on stop(); there is nothing left to silence.
      }
    });
    out.disconnect();
    wet.disconnect();
    finish();
  };
}

/** The music box's output: a gain into the speakers, and an echo beside it. */
function musicBox(ctx: AudioContext) {
  const out = ctx.createGain();
  out.gain.value = 0.4;
  // a tiny echo for a music-box room
  const delay = ctx.createDelay(),
    fb = ctx.createGain(),
    wet = ctx.createGain();
  delay.delayTime.value = 0.18;
  fb.gain.value = 0.25;
  wet.gain.value = 0.22;
  out.connect(ctx.destination);
  out.connect(delay);
  delay.connect(fb);
  fb.connect(delay);
  delay.connect(wet);
  wet.connect(ctx.destination);
  return { out, wet };
}

/** Every note, three partials each, scheduled from now; returns when the last one ends and the oscillators. */
function schedule(ctx: AudioContext, tune: Tune, out: GainNode) {
  const beat = 60 / tune.bpm;
  let t = ctx.currentTime + 0.05;
  const nodes: OscillatorNode[] = [];
  for (const [midi, beats] of tune.notes) {
    const f = 440 * Math.pow(2, (midi - 69) / 12),
      len = beats * beat;
    for (const [type, mult, vol] of [
      ['triangle', 1, 0.55],
      ['sine', 2, 0.18],
      ['sine', 3.01, 0.05],
    ] as [OscillatorType, number, number][]) {
      const o = ctx.createOscillator(),
        g = ctx.createGain();
      o.type = type;
      o.frequency.value = f * mult;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0008, t + Math.max(0.35, len * 1.6));
      o.connect(g);
      g.connect(out);
      o.start(t);
      o.stop(t + len * 1.7 + 0.05);
      nodes.push(o);
    }
    t += len;
  }
  return { end: t, nodes };
}

/** The button shows the tune playing, with its progress; returns what puts it back. */
function progress(btn: HTMLElement, playingLabel: string, total: number) {
  const start = performance.now();
  btn.classList.add('playing');
  const label = btn.querySelector('.lbl')!,
    was = label.textContent;
  label.textContent = playingLabel;
  const prog = btn.querySelector<HTMLElement>('.prog')!;
  let raf = 0;
  const tick = () => {
    prog.style.width = Math.min(100, ((performance.now() - start) / total) * 100) + '%';
    raf = requestAnimationFrame(tick);
  };
  tick();
  const done = setTimeout(() => finish(), total + 300);
  function finish() {
    clearTimeout(done);
    cancelAnimationFrame(raf);
    btn.classList.remove('playing');
    label.textContent = was;
    prog.style.width = '0';
    stop = null;
  }
  return finish;
}
