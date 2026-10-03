"use client";

import { useEffect, useRef, useState } from "react";
import type { Memory } from "@/lib/birthday/types";
import { asset, chime, clock, sampleTrack, storyStore, toScreen, trackFor, useStory } from "@/lib/birthday/interactions";
import { beat, windowed } from "@/lib/birthday/timeline";
import { useFrame } from "@/lib/birthday/fx";
import WPanel from "./WPanel";

/**
 * Where the four cards are pinned on the photo wall, in film coordinates at the
 * moment the story stops there (24.6 s). They move with the wall as the camera pans.
 * Placed on open wall, clear of him.
 */
const SLOTS = {
  landscape: { w: 0.105, at: [[0.66, 0.2, -4], [0.84, 0.22, 5], [0.67, 0.48, 3], [0.85, 0.5, -5]] },
  portrait: { w: 0.25, at: [[0.83, 0.17, -4], [0.83, 0.355, 4], [0.83, 0.54, -3], [0.83, 0.725, 4]] },
} as const;
/** How much of the camera pan the cards follow (they stay clear of him as he walks). */
const PAN = 0.5;
/** Film time at which the slots were placed. */
const AT = 24.6;
const MAX = 4;

/** He stands at the wall of photographs. Four of yours are pinned there among his. */
export default function MemoriesExperience({ memories }: { memories: Memory[] }) {
  const b = beat("memories");
  const list = memories.slice(0, MAX);
  const open = useStory((s) => s.openMemory);
  const fresh = useStory((s) => s.passed.length === 0);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const [last, setLast] = useState(0);
  const [seen, setSeen] = useState<number[]>([]);
  const n = list.length;

  useEffect(() => { if (open >= 0) setLast(open); }, [open]);
  useEffect(() => { if (fresh) setSeen([]); }, [fresh]);

  const show = (i: number) => {
    storyStore.set({ openMemory: i });
    setSeen((s) => (s.includes(i) ? s : [...s, i]));
    chime([880, 1174.7]);
  };
  const close = () => storyStore.set({ openMemory: -1 });

  useEffect(() => {
    if (open < 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") show((open + 1) % n);
      if (e.key === "ArrowLeft") show((open - 1 + n) % n);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [open, n]); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((c) => {
    const S = clock.portrait ? SLOTS.portrait : SLOTS.landscape;
    const [wx, wy] = sampleTrack(trackFor("wall"), c.time);
    const [gx, gy] = sampleTrack(trackFor("wall"), AT);
    const w = Math.max(84, Math.min(170, clock.frame.w * S.w));
    cards.current.forEach((el, i) => {
      if (!el) return;
      const slot = S.at[i % S.at.length];
      // pinned one after another as he arrives
      // they pop up one after another as he reaches the wall, and leave before he walks on
      const v = windowed(c.time, b.interact[0] + 0.25 + i * 0.12, 25.3, 0.35, 0.3);
      const p = toScreen(slot[0] + (wx - gx) * PAN, slot[1] + (wy - gy) * PAN);
      el.style.width = `${w.toFixed(0)}px`;
      el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0) translate(-50%, -50%) rotate(${slot[2]}deg) scale(${(0.86 + v * 0.14).toFixed(3)})`;
      el.style.opacity = v.toFixed(3);
      el.style.visibility = v < 0.05 ? "hidden" : "visible";
    });
  });

  if (!n) return null;
  const m = list[open >= 0 ? open : last];
  return (
    <>
      {list.map((mem, i) => (
        <div key={i} ref={(el) => { cards.current[i] = el; }} className={`wall-card fx ${seen.includes(i) ? "seen" : ""}`} style={{ visibility: "hidden" }}>
          <button type="button" className="wc" onClick={() => show(i)} aria-label={`Open memory: ${mem.title}`}>
            <span className="pin" aria-hidden="true" />
            <span className="pic">
              {mem.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={asset(mem.image)} alt="" loading="lazy" decoding="async" />
              ) : null}
            </span>
            <span className="t">{mem.title}</span>
          </button>
        </div>
      ))}

      <WPanel
        open={open >= 0}
        onClose={close}
        label={m?.title ?? "A memory"}
        className="wp-memory"
        footer={
          n > 1 ? (
            <>
              <button type="button" className="w-btn sec" onClick={() => show((open - 1 + n) % n)}>Previous</button>
              <button type="button" className="w-btn pri wide" onClick={() => show((open + 1) % n)}>Next memory →</button>
            </>
          ) : <button type="button" className="w-btn pri wide" onClick={close}>Close</button>
        }
      >
        {m ? (
          <div key={open}>
            {m.image ? (
              <div className="wp-pic">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset(m.image)} alt="" />
              </div>
            ) : null}
            <div className="wp-bd">
              <div className="wp-eyebrow">Memory {String((open >= 0 ? open : last) + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}</div>
              <h3 className="wp-title">{m.title}</h3>
              <p className="wp-text">{m.message}</p>
              {m.date ? <div className="wp-date">{m.date}</div> : null}
            </div>
          </div>
        ) : null}
      </WPanel>
    </>
  );
}
