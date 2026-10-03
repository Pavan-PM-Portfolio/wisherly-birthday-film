"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { trackFor, chime, clock, pass, sampleTrack, storyStore, toScreen, useStory } from "@/lib/birthday/interactions";
import { beat, windowed } from "@/lib/birthday/timeline";
import { useFrame, reveal } from "@/lib/birthday/fx";
import Hotspot from "./Hotspot";
import WPanel from "./WPanel";

interface Spark { x: number; y: number; vx: number; vy: number; life: number; size: number }

/** He lights the candles, then steps back. That is the visitor's cue to make a wish. */
export default function CakeInteraction({ wish }: { wish: string }) {
  const b = beat("cake");
  const wished = useStory((s) => s.wished);
  const scrim = useRef<HTMLDivElement>(null);
  const prompt = useRef<HTMLDivElement>(null);
  const slipOpen = useStory((s) => s.modal === "wish");
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);
  const glow = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const sparks = useRef<Spark[]>([]);
  const glowAmt = useRef({ v: 0 });

  const makeWish = () => {
    if (storyStore.get().wished) return;
    storyStore.set({ wished: true });
    pass("cake");
    chime();
    gsap.timeline()
      .to(glowAmt.current, { v: 1, duration: 0.5, ease: "power2.out" })
      .to(glowAmt.current, { v: 0.35, duration: 2.2, ease: "sine.inOut" });
    const [x, y] = sampleTrack(trackFor("candles"), clock.time);
    const p = toScreen(x, y);
    for (let i = 0; i < 28; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
      const sp = 40 + Math.random() * 90;
      sparks.current.push({ x: p.x + (Math.random() - 0.5) * 60, y: p.y - 10, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, size: 1 + Math.random() * 2.2 });
    }
    // let the candles glow for a beat, then the wish card opens
    timer.current = setTimeout(() => storyStore.set({ modal: "wish" }), 1100);
  };

  const lastRef = useRef(0);
  useFrame((c) => {
    const t = c.time;
    const live = windowed(t, b.interact[0] - 0.9, b.interact[1] + 0.3, 0.6, 0.5);
    if (scrim.current) scrim.current.style.opacity = live.toFixed(3);
    reveal(prompt.current, wished ? 0 : live, { y: 14, blur: 5 });

    // candle glow follows the cake
    const [x, y] = sampleTrack(trackFor("candles"), t);
    const p = toScreen(x, y);
    if (glow.current) {
      glow.current.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
      glow.current.style.opacity = (glowAmt.current.v * windowed(t, b.interact[0] - 0.6, b.end, 0.4, 0.5)).toFixed(3);
    }

    // a few sparks, then nothing
    const cv = canvas.current;
    if (!cv) return;
    const now = performance.now() / 1000;
    const dt = Math.min(0.05, lastRef.current ? now - lastRef.current : 0.016);
    lastRef.current = now;
    if (!sparks.current.length) return;
    if (cv.width !== innerWidth) { cv.width = innerWidth; cv.height = innerHeight; }
    const g = cv.getContext("2d")!;
    g.clearRect(0, 0, cv.width, cv.height);
    sparks.current = sparks.current.filter((s) => s.life < 1.8);
    for (const s of sparks.current) {
      s.life += dt; s.vy += 30 * dt; s.x += s.vx * dt; s.y += s.vy * dt;
      const a = Math.max(0, 1 - s.life / 1.8) * (0.6 + 0.4 * Math.sin(s.life * 30));
      g.fillStyle = `rgba(255, 228, 170, ${a})`;
      g.beginPath(); g.arc(s.x, s.y, s.size, 0, Math.PI * 2); g.fill();
    }
    if (!sparks.current.length) g.clearRect(0, 0, cv.width, cv.height);
  }, [wished]);

  return (
    <>
      <div ref={scrim} className="scrim-right" style={{ opacity: 0 }} />
      <div ref={glow} className="glow" />
      <canvas ref={canvas} className="sparks" />
      <div ref={prompt} className="prompt right fx" style={{ visibility: "hidden" }}>
        <div className="hand">Make a wish</div>
        <h2>Close your eyes.</h2>
        <p>When you&rsquo;re ready, tap the candles and make it count.</p>
      </div>
      <WPanel
        open={slipOpen}
        onClose={() => storyStore.set({ modal: "" })}
        label="Your wish"
        footer={<button type="button" className="w-btn pri wide" onClick={() => storyStore.set({ modal: "" })}>Continue the story ↓</button>}
      >
        <div className="wp-bd">
          <div className="wp-eyebrow">Your wish is on its way</div>
          <p className="wp-quote">{wish}</p>
        </div>
      </WPanel>
      <Hotspot track="candles" window={b.interact} label="Make a wish" onActivate={makeWish} hidden={wished} />
    </>
  );
}
