import type { BeatId, StoryBeat } from "./types";

/* ─────────────────────────────────────────────────────────────────────────────
   ONE master timeline.

   The film is 28.0 s. Its beats were mapped by stepping through the merged
   video frame by frame (see README → "Timing map"). Scroll does not map to time
   linearly: each beat gets scroll room in proportion to how much there is to
   do in it, and the film slows down (never freezes) while an interaction is
   available. Everything else on the page reads the same `videoTime`.
   ───────────────────────────────────────────────────────────────────────────── */

export const VIDEO_DURATION = 30.0;

/** The story, in film seconds. Edit these if the film is re-cut. */
export const story: StoryBeat[] = [
  { id: "hero", label: "Hello", start: 0, end: 3.5, interact: [0.5, 3.5] },
  { id: "cake", label: "Make a wish", start: 3.5, end: 7.2, interact: [4.8, 7.2], gate: { at: 6.5, hint: "Make a wish to continue" } },
  { id: "wishes", label: "Wishes", start: 7.2, end: 13.0, interact: [11.0, 13.0], gate: { at: 12.2, hint: "Open your wishes to continue" } },
  { id: "photos", label: "Photos", start: 13.0, end: 18.0, interact: [15.2, 18.0], gate: { at: 16.5, hint: "Click the camera to continue" } },
  { id: "message", label: "A message", start: 18.0, end: 20.0, interact: [18.6, 20.0], gate: { at: 19.896, hint: "Read your message", announce: true } },
  { id: "memories", label: "Memories", start: 20.0, end: 25.8, interact: [23.5, 25.8] },
  { id: "gift", label: "The gift", start: 25.8, end: VIDEO_DURATION, interact: [26.6, VIDEO_DURATION], gate: { at: 27.5, hint: "Open the gift" } },
];

/*
 * Gates (the `gate` field above) were matched frame-for-frame in both films (they
 * share timing): candles lit with his eyes closed (6.5 s), reading the card
 * (12.2 s), camera at his eye (16.5 s), the laptop's blank screen in close-up
 * (19.6 s), facing the photo wall (24.6 s), hands on the gift (27.5 s).
 */

/**
 * Scroll pacing: [scroll units, film seconds]. One unit = one screen of scrolling.
 * Steep stretches are the character walking between moments; shallow stretches
 * are where the visitor is invited to do something.
 */
export const PACING: [number, number][] = [
  [0, 0],
  [1.2, 3.5], //   hero: walks in
  [1.7, 4.8], //   steps up to the cake
  [3.3, 7.2], //   lights the candles, closes his eyes (slow)
  [4.7, 11.0], //  turns to the card table, picks a card
  [6.1, 13.0], //  reads it (slow)
  [6.8, 15.2], //  walks to the camera
  [8.6, 18.0], //  takes the picture (slow)
  [10.0, 20.0], // the laptop, the blank screen (slow)
  [11.0, 23.5], // walks to the photo wall
  [12.4, 25.8], // memories (slow)
  [12.8, 26.6], // reaches the gift
  [14.6, VIDEO_DURATION - 0.05], // opens it
];

export const SCROLL_UNITS = PACING[PACING.length - 1][0];

/** Scroll progress (0..1) → film seconds. */
export function progressToTime(p: number): number {
  const u = Math.max(0, Math.min(1, p)) * SCROLL_UNITS;
  for (let i = 1; i < PACING.length; i++) {
    const [u1, t1] = PACING[i];
    if (u <= u1) {
      const [u0, t0] = PACING[i - 1];
      return t0 + ((u - u0) / (u1 - u0)) * (t1 - t0);
    }
  }
  return PACING[PACING.length - 1][1];
}

/** Film seconds → scroll progress (0..1). Used by the journey indicator. */
export function timeToProgress(t: number): number {
  for (let i = 1; i < PACING.length; i++) {
    const [u1, t1] = PACING[i];
    if (t <= t1) {
      const [u0, t0] = PACING[i - 1];
      return (u0 + ((t - t0) / (t1 - t0)) * (u1 - u0)) / SCROLL_UNITS;
    }
  }
  return 1;
}

/** The normalized start/end of each beat on the scroll (0..1), derived from the film times. */
export const storyProgress = story.map((b) => ({ id: b.id, start: timeToProgress(b.start), end: b.end >= VIDEO_DURATION ? 1 : timeToProgress(b.end) }));

export function beatAt(t: number): BeatId {
  for (const b of story) if (t < b.end) return b.id;
  return "gift";
}

export const beat = (id: BeatId) => story.find((b) => b.id === id)!;

/** 0 → 1 → 0 window with soft edges, for reveals that start slightly before and end slightly after a moment. */
export function windowed(t: number, a: number, b: number, fadeIn = 0.4, fadeOut = 0.4): number {
  const up = clamp01((t - a) / fadeIn);
  const down = clamp01((b - t) / fadeOut);
  return ease(Math.min(up, down));
}

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const ease = (x: number) => x * x * (3 - 2 * x);
