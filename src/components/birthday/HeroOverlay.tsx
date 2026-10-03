"use client";

import { useRef } from "react";
import { useFrame, reveal } from "@/lib/birthday/fx";
import { beat, windowed } from "@/lib/birthday/timeline";

/** The character walks in and greets you; the words arrive with the wave. */
export default function HeroOverlay({ name }: { name: string }) {
  const scrim = useRef<HTMLDivElement>(null);
  const f = useRef<HTMLDivElement>(null);
  const h = useRef<HTMLHeadingElement>(null);
  const p = useRef<HTMLParagraphElement>(null);
  const cue = useRef<HTMLDivElement>(null);
  const b = beat("hero");

  const loadedAt = useRef(0);
  useFrame((c) => {
    const t = c.time;
    // On arrival the greeting fades in like an opening title; as he waves (≈2.5 s) the line
    // underneath joins it, and everything leaves as he turns towards the cake.
    if (c.ready && c.revealed && !loadedAt.current) loadedAt.current = performance.now();
    const since = loadedAt.current ? (performance.now() - loadedAt.current) / 1000 : 0;
    const enter = (d: number) => Math.min(1, Math.max(0, (since - d) / 1.2));
    const end = b.end + 0.2;
    reveal(f.current, windowed(t, -1, end, 0.5, 0.7) * enter(0.2), { y: 10 });
    reveal(h.current, windowed(t, -1, end, 0.5, 0.7) * enter(0.45), { y: 18, blur: 6 });
    reveal(p.current, windowed(t, -1, end, 0.5, 0.7) * enter(0.9), { y: 12 });
    if (scrim.current) scrim.current.style.opacity = (windowed(t, -1, end, 0.5, 0.8) * enter(0)).toFixed(3);
    reveal(cue.current, (c.progress < 0.01 ? 1 : Math.max(0, 1 - c.progress * 60)) * enter(1.6), { y: 0, blur: 0, base: "translateX(-50%)" });
  });

  return (
    <>
      <div ref={scrim} className="hero-scrim" />
      <section className="hero" aria-label="Welcome">
        <div ref={f} className="for fx">for you,</div>
        <h1 ref={h} className="fx">Happy Birthday, {name}</h1>
        <p ref={p} className="fx">A little journey made just for you.</p>
      </section>
      <div ref={cue} className="cue">Scroll gently<i /></div>
    </>
  );
}
