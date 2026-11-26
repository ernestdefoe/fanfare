/*
 * The shapes forum.js and the stage script share: what the server puts in
 * app.data.fanfare, a moment, and the host object forum.js hands the stage.
 * Types only, so neither bundle carries any of it.
 */

/** A member as the widget shows them. */
export interface PersonUser {
  slug: string;
  name?: string;
  username: string;
  avatar?: string | null;
}

export interface BirthdayPerson {
  id: number;
  md: string;
  age?: number | null;
}

export interface AnniversaryPerson {
  id: number;
  md: string;
  years: number;
}

/** A course someone completed lately: Syllabus. */
export interface CourseCompletion {
  id: number;
  user: number;
  title: string;
  url?: string | null;
}

export interface Occasion {
  id: string;
  from: string;
  to: string;
  day: string;
  /** A Festoon day: its own name, emoji and colors. */
  custom?: { name?: string; emoji?: string; primary?: string; secondary?: string };
}

export interface FanfareData {
  mine?: {
    birthday?: boolean;
    md?: string;
    wishedBy?: string[];
    wishedCount?: number;
    years?: number;
    joined?: string;
  } | null;
  myCourses?: { id: number; title: string; url?: string | null }[];
  forum?: { md: string; age: number; since: string; members: number; posts: number } | null;
  occasions?: Occasion[];
  people?: {
    birthdays: BirthdayPerson[];
    anniversaries: AnniversaryPerson[];
    users: Record<number, PersonUser>;
    more: { birthdays: number; anniversaries: number };
  } | null;
  courses?: {
    list: CourseCompletion[];
    users: Record<number, PersonUser>;
    more: number;
  } | null;
  settings?: { intensity?: string; quiet?: boolean; onceADay?: boolean; preview?: boolean } | null;
  canWish?: boolean;
  wished?: string[];
}

/** A moment to celebrate today: the occasion's id and whatever its scene needs. */
export interface Moment {
  id: string;
  key?: string | number;
  achievement?: number;
  course?: string;
  url?: string | null;
  wishedBy?: string[];
  wishedCount?: number;
  years?: number;
  year?: number;
  eve?: boolean;
  night?: number;
  md?: string;
  age?: number;
  since?: string;
  members?: number;
  posts?: number;
  name?: string;
  emoji?: string;
  primary?: string;
  secondary?: string;
}

/** Everything forum-specific the stage needs, handed over by forum.js. */
export interface StageHost {
  t(key: string, params?: Record<string, unknown>): string;
  locale: string;
  name: string;
  joined: string | null;
  posts: number;
  forum: string;
  assets: string;
  intensity: string;
  quiet: boolean;
  sound(): boolean;
  setSound(on: boolean): unknown;
  effects(): boolean;
  festoonFalling(): boolean;
  alert(message: string): void;
  onOpen?(): void;
  onClose?(moment: Moment): void;
  countdown?(left: number): void;
}

export interface FanfareStageApi {
  open(moment: Moment, host: StageHost): void;
  close(): void;
  isOpen(): boolean;
}

declare global {
  interface Window {
    FanfareStage?: FanfareStageApi;
    webkitAudioContext?: typeof AudioContext;
  }
}
