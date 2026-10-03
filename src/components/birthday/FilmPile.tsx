"use client";

import { useRef } from "react";
import { TRACKS, clock, sampleTrack, toScreen, trackFor } from "@/lib/birthday/interactions";
import { windowed } from "@/lib/birthday/timeline";
import { useFrame } from "@/lib/birthday/fx";
import { Sparkle } from "./Hotspot";

interface Props {
  /** The object in the film the pile sits on. */
  track: keyof typeof TRACKS;
  /** Film seconds when the pile is there. */
  window: [number, number];
  /** Pile width as a share of the rendered film width, clamped to [min, max] px. */
  size: { frac: number; min: number; max: number };
  /** Pile height as a share of its width. */
  aspect?: number;
  /** Tilt, to sit the way the object in the film sits. */
  tilt?: number;
  /** Nudge from the tracked point, in pile widths. */
  offset?: [number, number];
  label: string;
  callout?: string;
  caption?: string;
  /**
   * Where to rest on upright phones when the vertical film has nothing to sit on,
   * as fractions of the screen [x, y]. Omit to follow the track there too.
   */
  portraitDock?: [number, number];
  /** Stop drawing attention (the visitor has opened it). */
  quiet?: boolean;
  onActivate: () => void;
  children: React.ReactNode;
}

/**
 * A small pile of paper things resting on an object in the film (the envelope in
 * his hands, the frame he sets down). It follows the object as the shot moves,
 * glows softly, and a "Click here" note points at it until it has been opened.
 */
export default function FilmPile({ track, window: [a, b], size, aspect = 0.66, tilt = 0, offset = [0, 0], portraitDock, label, callout = "Click here", caption, quiet = false, onActivate, children }: Props) {
  const el = useRef<HTMLDivElement>(null);
  useFrame((c) => {
    const n = el.current;
    if (!n) return;
    const v = windowed(c.time, a, b, 0.35, 0.35);
    const docked = !!portraitDock && clock.portrait;
    const w = docked
      ? Math.max(112, Math.min(170, window.innerWidth * 0.32))
      : Math.max(size.min, Math.min(size.max, clock.frame.w * size.frac));
    let px: number, py: number;
    if (docked) {
      px = window.innerWidth * portraitDock![0];
      py = window.innerHeight * portraitDock![1];
    } else {
      const [x, y] = sampleTrack(trackFor(track), c.time);
      const p = toScreen(x, y);
      px = p.x + offset[0] * w;
      py = p.y + offset[1] * w;
    }
    n.style.setProperty("--pw", `${w.toFixed(0)}px`);
    n.style.setProperty("--ph", `${(w * aspect).toFixed(0)}px`);
    n.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0) scale(${(0.9 + v * 0.1).toFixed(3)})`;
    // not enough room above (e.g. a phone held sideways)? point up from below instead
    n.classList.toggle("flip", py - (w * aspect) / 2 - 70 < 56);
    n.style.opacity = v.toFixed(3);
    n.style.visibility = v < 0.05 ? "hidden" : "visible";
  });
  return (
    <div ref={el} className={`film-pile fx ${quiet ? "quiet" : ""}`} style={{ visibility: "hidden" }}>
      <button type="button" className="pile" style={{ transform: `translate(-50%, -50%) rotate(${tilt}deg)` }} onClick={onActivate} aria-label={label}>
        <span className="pile-glow" aria-hidden="true" />
        {children}
      </button>
      <button type="button" className="callout" onClick={onActivate} tabIndex={-1} aria-hidden="true">
        <Sparkle size={12} />
        {callout}
      </button>
      {caption ? <div className="pile-cap">{caption}</div> : null}
    </div>
  );
}
