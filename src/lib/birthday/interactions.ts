"use client";

import { useSyncExternalStore } from "react";
import type { BeatId, StoryBeat, Track } from "./types";
import { story } from "./timeline";

/* ─────────────────────────────────────────────────────────────────────────────
   Two kinds of state, kept apart on purpose:

   • `clock` — per-frame values (scroll progress, film time). Read inside
     requestAnimationFrame callbacks registered with `onFrame`; never React state.

   • `story` store — things that change a few times per visit (which beat is
     active, which wish is open…). Components subscribe with `useStory`.
   ───────────────────────────────────────────────────────────────────────────── */

export const clock = {
  /** Scroll progress 0..1 (smoothed by Lenis). */
  progress: 0,
  /** Film time in seconds that the page is showing. */
  time: 0,
  /** Rendered video rectangle in CSS pixels, for anchoring UI to things in the film. */
  frame: { x: 0, y: 0, w: 1, h: 1 },
  ready: false,
  /** How much of the film has downloaded (0..1). */
  loaded: 0,
  /** The welcome screen has gone and the story is on show. */
  revealed: false,
  /** True while the upright-phone film (9:16) is showing. Tracks and focus switch with it. */
  portrait: false,
};

type FrameFn = (c: typeof clock) => void;
const frameFns = new Set<FrameFn>();
export function onFrame(fn: FrameFn) {
  frameFns.add(fn);
  return () => {
    frameFns.delete(fn);
  };
}
export function runFrame() {
  frameFns.forEach((fn) => fn(clock));
}

/* ---------- discrete story state ---------- */

export interface StoryState {
  active: BeatId;
  started: boolean;
  wished: boolean;
  openWish: number;
  photosTaken: number;
  viewPhoto: number;
  openMemory: number;
  giftOpened: boolean;
  sound: boolean;
  /** Gates the visitor has opened (by doing the beat's action). */
  passed: BeatId[];
  /** Counts attempts to scroll past a closed gate (drives the hint). */
  bump: number;
  /** "Watch it again": the film is rewinding to its first frame. */
  rewinding: boolean;
  /** A pop-up that pauses the story ("wish", "letter", "finale"), or "". */
  modal: string;
  /** The name the visitor typed on the welcome screen. */
  viewer: string;
}

const initial: StoryState = {
  active: "hero",
  started: false,
  wished: false,
  openWish: -1,
  photosTaken: 0,
  viewPhoto: -1,
  openMemory: -1,
  giftOpened: false,
  sound: false,
  passed: [],
  bump: 0,
  rewinding: false,
  modal: "",
  viewer: "",
};
let state = initial;
const listeners = new Set<() => void>();

export const storyStore = {
  get: () => state,
  set(patch: Partial<StoryState> | ((s: StoryState) => Partial<StoryState>)) {
    const next = typeof patch === "function" ? patch(state) : patch;
    if (Object.keys(next).every((k) => (next as Record<string, unknown>)[k] === (state as unknown as Record<string, unknown>)[k])) return;
    state = { ...state, ...next };
    listeners.forEach((l) => l());
  },
  reset() {
    state = { ...initial, sound: state.sound, started: state.started, viewer: state.viewer };
    listeners.forEach((l) => l());
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

export function useStory<T>(sel: (s: StoryState) => T): T {
  return useSyncExternalStore(storyStore.subscribe, () => sel(state), () => sel(initial));
}

/* ---------- scroll gates ---------- */

/** The first gate the visitor has not opened yet, or null when the way is clear. */
export function lockedGate(): StoryBeat | null {
  return story.find((b) => b.gate && !state.passed.includes(b.id)) ?? null;
}
/** Open a beat's gate (call when the visitor does the beat's action). */
export function pass(id: BeatId) {
  storyStore.set((s) => (s.passed.includes(id) ? {} : { passed: [...s.passed, id] }));
}

/* ---------- navigation ---------- */

export interface GoToOptions {
  /** Seconds; defaults to a pace based on distance. */
  duration?: number;
  easing?: (t: number) => number;
  /** Hold off the visitor's own scrolling until it arrives. */
  lock?: boolean;
  onComplete?: () => void;
}
let scrollToProgress: (p: number, o?: GoToOptions) => void = () => {};
export const registerScroll = (fn: (p: number, o?: GoToOptions) => void) => (scrollToProgress = fn);
export const goTo = (p: number, o?: GoToOptions) => scrollToProgress(p, o);

/* ---------- anchoring UI to things in the film ---------- */

/**
 * Where things are in the 16:9 website film (0..1 of the frame), measured from its
 * frames. Hotspots and piles follow these, so they stay on the cake, the card, the
 * camera, the laptop, the photo wall and the gift as the shot moves.
 */
export const TRACKS: Record<string, Track> = {
  candles: [
    [5.0, 0.47, 0.8],
    [6.0, 0.48, 0.82],
    [6.5, 0.47, 0.82],
    [7.2, 0.47, 0.82],
  ],
  /** the card he reads (the wish pile rests on it) */
  card: [
    [11.0, 0.38, 0.68],
    [11.5, 0.41, 0.68],
    [12.0, 0.46, 0.66],
    [12.5, 0.56, 0.68],
    [13.0, 0.58, 0.68],
  ],
  camera: [
    [15.0, 0.47, 0.63],
    [15.5, 0.44, 0.46],
    [16.0, 0.47, 0.47],
    [16.5, 0.48, 0.46],
    [17.0, 0.48, 0.46],
    [18.0, 0.5, 0.5],
  ],
  /** where a new print appears before it settles on the wall */
  print: [
    [16.5, 0.48, 0.6],
    [18.0, 0.5, 0.62],
  ],
  /** the laptop screen */
  laptop: [
    [18.5, 0.74, 0.52],
    [19.0, 0.67, 0.55],
    [19.3, 0.68, 0.55],
    [19.6, 0.62, 0.52],
    [19.9, 0.54, 0.52],
    [20.0, 0.54, 0.52],
  ],
  /** the photo wall (your prints are pinned among his) */
  wall: [
    [23.5, 0.83, 0.3],
    [23.8, 0.79, 0.3],
    [24.6, 0.68, 0.3],
    [25.6, 0.52, 0.3],
    [25.8, 0.49, 0.3],
  ],
  gift: [
    [26.5, 0.67, 0.64],
    [27.0, 0.59, 0.66],
    [27.5, 0.56, 0.64],
    [28.0, 0.5, 0.67],
    [29.0, 0.52, 0.68],
    [30.0, 0.52, 0.68],
  ],
};

/**
 * The same objects in the 9:16 mobile film, measured from its frames.
 * Same story clock, different framing.
 */
export const TRACKS_PORTRAIT: Record<keyof typeof TRACKS, Track> = {
  candles: [
    [5.0, 0.45, 0.75],
    [6.0, 0.47, 0.72],
    [6.5, 0.5, 0.7],
    [7.2, 0.5, 0.7],
  ],
  card: [
    [11.0, 0.25, 0.7],
    [11.5, 0.25, 0.68],
    [12.0, 0.36, 0.68],
    [12.5, 0.38, 0.7],
    [13.0, 0.4, 0.7],
  ],
  camera: [
    [15.0, 0.4, 0.62],
    [15.5, 0.4, 0.47],
    [16.0, 0.42, 0.45],
    [16.5, 0.45, 0.45],
    [17.0, 0.45, 0.45],
    [18.0, 0.45, 0.5],
  ],
  print: [
    [16.5, 0.45, 0.6],
    [18.0, 0.45, 0.62],
  ],
  laptop: [
    [18.8, 0.86, 0.6],
    [19.3, 0.8, 0.58],
    [19.6, 0.62, 0.55],
    [19.9, 0.5, 0.53],
    [20.0, 0.5, 0.53],
  ],
  wall: [
    [23.5, 0.81, 0.3],
    [23.8, 0.8, 0.3],
    [24.6, 0.78, 0.3],
    [25.6, 0.66, 0.3],
    [25.8, 0.64, 0.3],
  ],
  gift: [
    [26.5, 0.8, 0.66],
    [27.0, 0.76, 0.65],
    [27.5, 0.73, 0.66],
    [28.0, 0.62, 0.7],
    [29.0, 0.6, 0.72],
    [30.0, 0.6, 0.72],
  ],
};

/** The track for an object in whichever film is showing. */
export function trackFor(name: keyof typeof TRACKS): Track {
  return (clock.portrait ? TRACKS_PORTRAIT : TRACKS)[name];
}

/** Horizontal focus for the vertical film when a wider-than-9:16 screen crops its sides. */
export const FOCUS_PORTRAIT: [number, number][] = [
  [0, 0.5],
  [6.5, 0.5],
  [11.0, 0.42],
  [12.2, 0.42],
  [16.5, 0.46],
  [19.6, 0.58],
  [20.2, 0.5],
  [24.6, 0.56],
  [27.5, 0.64],
  [30.0, 0.6],
];

/** Where to keep the framing centred on screens narrower than 16:9 (x in 0..1 of the film). */
export const FOCUS_LANDSCAPE: [number, number][] = [
  [0, 0.5],
  [4.0, 0.48],
  [7.5, 0.5],
  [11.0, 0.45],
  [13.0, 0.48],
  [16.5, 0.48],
  [18.5, 0.6],
  [19.6, 0.62],
  [20.2, 0.5],
  [24.5, 0.56],
  [27.5, 0.55],
  [30.0, 0.55],
];

export function sampleTrack(track: Track, t: number): [number, number] {
  if (t <= track[0][0]) return [track[0][1], track[0][2]];
  for (let i = 1; i < track.length; i++) {
    if (t <= track[i][0]) {
      const [t0, x0, y0] = track[i - 1];
      const [t1, x1, y1] = track[i];
      const k = (t - t0) / (t1 - t0);
      return [x0 + (x1 - x0) * k, y0 + (y1 - y0) * k];
    }
  }
  const l = track[track.length - 1];
  return [l[1], l[2]];
}

export function sampleFocus(t: number): number {
  const FOCUS = clock.portrait ? FOCUS_PORTRAIT : FOCUS_LANDSCAPE;
  if (t <= FOCUS[0][0]) return FOCUS[0][1];
  for (let i = 1; i < FOCUS.length; i++) {
    if (t <= FOCUS[i][0]) {
      const [t0, a] = FOCUS[i - 1];
      const [t1, b] = FOCUS[i];
      const k = (t - t0) / (t1 - t0);
      const e = k * k * (3 - 2 * k);
      return a + (b - a) * e;
    }
  }
  return FOCUS[FOCUS.length - 1][1];
}

/** Film coordinates (0..1) → page pixels, using the rendered video rectangle. */
export function toScreen(x: number, y: number) {
  const f = clock.frame;
  return { x: f.x + x * f.w, y: f.y + y * f.h };
}

/* ---------- a soft chime for interactions (only when sound is on) ---------- */

let actx: AudioContext | null = null;
export function chime(notes = [880, 1318.5, 1760]) {
  if (!storyStore.get().sound || typeof window === "undefined") return;
  try {
    actx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const now = actx.currentTime;
    notes.forEach((f, i) => {
      const o = actx!.createOscillator();
      const g = actx!.createGain();
      o.type = "sine";
      o.frequency.value = f;
      g.gain.setValueAtTime(0, now + i * 0.09);
      g.gain.linearRampToValueAtTime(0.06, now + i * 0.09 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.09 + 1.4);
      o.connect(g).connect(actx!.destination);
      o.start(now + i * 0.09);
      o.stop(now + i * 0.09 + 1.5);
    });
  } catch {
    /* audio is a nicety */
  }
}

/** Base path aware asset URLs. */
export function asset(path: string) {
  if (!path || /^(https?:|data:|blob:)/.test(path)) return path;
  return `${process.env.NEXT_PUBLIC_BASE_PATH || ""}${path.startsWith("/") ? path : `/${path}`}`;
}
