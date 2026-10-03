"use client";

import { useEffect, useRef, useState } from "react";
import type { Photo } from "@/lib/birthday/types";
import { asset, storyStore, useStory } from "@/lib/birthday/interactions";

const Arrow = ({ dir }: { dir: 1 | -1 }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d={dir > 0 ? "M9 5l7 7-7 7" : "M15 5l-7 7 7 7"} />
  </svg>
);

/** One photograph, held up close. Swipe or use the arrows between the ones already captured. */
export default function PhotoViewer({ photos }: { photos: Photo[] }) {
  const i = useStory((s) => s.viewPhoto);
  const taken = useStory((s) => s.photosTaken);
  const [last, setLast] = useState(0);
  const close = useRef<HTMLButtonElement>(null);
  const startX = useRef<number | null>(null);
  useEffect(() => { if (i >= 0) setLast(i); }, [i]);
  const shown = i >= 0 ? i : last;
  const ph = photos[shown];
  const count = Math.max(1, Math.min(taken, photos.length));
  const go = (d: number) => storyStore.set({ viewPhoto: (shown + d + count) % count });

  useEffect(() => {
    if (i < 0) return;
    close.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") storyStore.set({ viewPhoto: -1 });
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [i, count]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ph) return null;
  return (
    <div
      className={`viewer ${i >= 0 ? "on" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label={ph.caption}
      aria-hidden={i < 0}
      onClick={(e) => e.target === e.currentTarget && storyStore.set({ viewPhoto: -1 })}
      onPointerDown={(e) => (startX.current = e.clientX)}
      onPointerUp={(e) => {
        if (startX.current === null) return;
        const dx = e.clientX - startX.current;
        startX.current = null;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      }}
    >
      <figure className="paper">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset(ph.url)} alt={ph.caption} />
        <figcaption>
          <span className="hand">{ph.caption}</span>
          {ph.date ? <span className="date">{ph.date}</span> : null}
        </figcaption>
      </figure>
      {count > 1 ? (
        <div className="nav">
          <button type="button" onClick={() => go(-1)} aria-label="Previous photo"><Arrow dir={-1} /></button>
          <button type="button" onClick={() => go(1)} aria-label="Next photo"><Arrow dir={1} /></button>
        </div>
      ) : null}
      <button ref={close} type="button" className="close-x" onClick={() => storyStore.set({ viewPhoto: -1 })} aria-label="Close">
        <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
    </div>
  );
}
