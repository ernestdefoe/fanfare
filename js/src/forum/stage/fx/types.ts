/* The effects layer's shapes: its state, one interface per particle kind, and what each kind does per frame. */

export interface FxOptions {
  reduced: () => boolean;
  dark: () => boolean;
  scale?: number;
}

interface Base {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

export interface Confetti extends Base {
  k: 'confetti';
  rot: number;
  spin: number;
  w: number;
  h: number;
  col: string;
  shape: 'c' | 'r';
  wob: number;
}

export interface Balloon extends Base {
  k: 'balloon';
  sway: number;
  s: number;
  col: string;
}

export interface Snow extends Base {
  k: 'snow';
  r: number;
  sway: number;
}

export interface Rocket extends Base {
  k: 'rocket';
  top: number;
  col: string;
}

export interface Spark extends Base {
  k: 'spark';
  px: number;
  py: number;
  col: string;
  decay: number;
}

export interface Lantern extends Base {
  k: 'lantern';
  sway: number;
  s: number;
  kind: string;
}

export interface Leaf extends Base {
  k: 'leaf';
  rot: number;
  spin: number;
  s: number;
  sway: number;
  col: string;
}

export interface Ember extends Base {
  k: 'ember';
  r: number;
  decay: number;
}

export type Particle = Confetti | Balloon | Snow | Rocket | Spark | Lantern | Leaf | Ember;

/** What keeps falling (or rising) on its own while an effect lasts. */
export interface Ambient {
  k: Particle['k'];
  n: number;
  rate: number;
  make: () => Particle;
}

/** The canvas, the particle pool and the frame guard's budget, shared by the loop and every effect. */
export interface FxState {
  ctx: CanvasRenderingContext2D;
  W: number;
  H: number;
  parts: Particle[];
  raf: number;
  last: number;
  slow: number;
  cap: number;
  ambient: Ambient | null;
  until: number;
  pal: string[];
  sprites: Record<string, HTMLCanvasElement>;
  scale: number;
  reduced: () => boolean;
  dark: () => boolean;
  /** One frame of the loop, made once so each frame doesn't make a new function. */
  tick: FrameRequestCallback;
}

/** A particle kind: moves it one frame (false once it's gone) and draws it. */
export interface Behaviour<P extends Particle> {
  update(p: P, dt: number, fx: FxState): boolean;
  draw(p: P, fx: FxState): void;
}
