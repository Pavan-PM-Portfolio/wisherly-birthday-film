"use client";

import { useRef } from "react";
import { TRACKS, sampleTrack, toScreen, trackFor } from "@/lib/birthday/interactions";
import { windowed } from "@/lib/birthday/timeline";
import { useFrame } from "@/lib/birthday/fx";

export function Sparkle({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 1.5c.6 4.6 2.6 7.6 6 9 1.5.6 3 .9 4.5 1-4.6.6-7.6 2.6-9 6-.6 1.5-.9 3-1 4.5-.6-4.6-2.6-7.6-6-9-1.5-.6-3-.9-4.5-1 4.6-.6 7.6-2.6 9-6 .6-1.5.9-3 1-4.5z" fill="currentColor" />
    </svg>
  );
}

interface Props {
  track: keyof typeof TRACKS;
  /** Film seconds when the hotspot is live. */
  window: [number, number];
  label: string;
  onActivate: () => void;
  side?: "right" | "left";
  hidden?: boolean;
}

/**
 * A soft ring that sits on an object in the film and follows it as the shot moves,
 * with a small handwritten paper tag. Appears only while the character is at that object.
 */
export default function Hotspot({ track, window: [a, b], label, onActivate, side = "right", hidden = false }: Props) {
  const el = useRef<HTMLDivElement>(null);
  useFrame((c) => {
    const n = el.current;
    if (!n) return;
    const v = hidden ? 0 : windowed(c.time, a, b, 0.35, 0.35);
    const [x, y] = sampleTrack(trackFor(track), c.time);
    const p = toScreen(x, y);
    n.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0) scale(${(0.85 + v * 0.15).toFixed(3)})`;
    n.style.opacity = v.toFixed(3);
    n.style.visibility = v < 0.05 ? "hidden" : "visible";
  });
  return (
    <div ref={el} className={`hotspot fx ${track === "gift" ? "tag-up" : ""}`} style={{ visibility: "hidden" }}>
      <button type="button" className="ring" aria-label={label} onClick={onActivate} />
      <button type="button" className={`tag paper ${side === "left" ? "left" : ""}`} onClick={onActivate} tabIndex={-1}>
        <Sparkle />
        {label}
      </button>
    </div>
  );
}
