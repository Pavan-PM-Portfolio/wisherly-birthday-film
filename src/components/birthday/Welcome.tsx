"use client";

import { useEffect, useRef, useState } from "react";
import { asset, clock, storyStore } from "@/lib/birthday/interactions";
import { Mark } from "./WPanel";

type Phase = "ask" | "loading" | "ready" | "gone";

/** After this long without finishing, reassure the visitor that it is still on its way. */
const SLOW_AFTER_MS = 7000;
const R = 52;
const C = 2 * Math.PI * R;

/**
 * The front door. Asks for the visitor's name, then holds a calm, branded loader
 * until the whole film has downloaded, so the scroll experience never stutters.
 * The film starts downloading the moment the page opens, while they type.
 */
export default function Welcome({ poster, portraitPoster }: { poster: string; portraitPoster: string }) {
  const [phase, setPhase] = useState<Phase>("ask");
  const [name, setName] = useState("");
  const [slow, setSlow] = useState(false);
  const [pct, setPct] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const shown = useRef(0);

  // The story waits behind the welcome screen.
  useEffect(() => {
    clock.revealed = false;
    storyStore.set({ modal: "intro" });
    // automated visual checks skip the front door
    if (new URLSearchParams(location.search).has("debug")) { setName("Test Visitor"); setPhase("loading"); }
    else setTimeout(() => input.current?.focus({ preventScroll: true }), 900);
  }, []);

  // Progress: follows the real download, eased so it never jumps backwards or stalls visually at 0.
  useEffect(() => {
    if (phase !== "loading") return;
    const started = performance.now();
    let raf = 0;
    const tick = () => {
      const target = clock.ready ? 1 : clock.loaded;
      shown.current += (target - shown.current) * (target >= 1 ? 0.12 : 0.06);
      if (target >= 1 && 1 - shown.current < 0.004) shown.current = 1;
      setPct(shown.current);
      if (!slow && performance.now() - started > SLOW_AFTER_MS && shown.current < 0.9) setSlow(true);
      if (shown.current >= 1) { setPhase("ready"); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // A short beat on "ready", then the curtain lifts.
  useEffect(() => {
    if (phase !== "ready") return;
    const t1 = setTimeout(() => {
      clock.revealed = true;
      storyStore.set({ modal: "", viewer: name.trim() });
      setPhase("gone");
    }, 900);
    return () => clearTimeout(t1);
  }, [phase, name]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) { input.current?.focus(); return; }
    setPhase("loading");
  };

  const first = name.trim().split(/\s+/)[0] || "";
  const valid = name.trim().length >= 2;

  return (
    <div className={`welcome ${phase === "gone" ? "out" : ""}`} aria-hidden={phase === "gone"}>
      <picture className="welcome-bg" aria-hidden="true">
        <source media="(orientation: portrait) and (max-width: 1024px)" srcSet={asset(portraitPoster)} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset(poster)} alt="" />
      </picture>
      <div className="welcome-veil" aria-hidden="true" />

      <div className="welcome-brand"><Mark size={30} /><span>Wisherly</span></div>

      <div className="wp welcome-card">
        <div className="wp-in">
          {phase === "ask" ? (
            <form className="welcome-ask" onSubmit={submit} noValidate>
              <div className="welcome-mark"><Mark size={54} /></div>
              <div className="wp-eyebrow">A surprise is waiting for you</div>
              <h1 className="welcome-title">Someone made something special, just for you.</h1>
              <label className="welcome-label" htmlFor="w-name">Enter your full name to open it</label>
              <input
                ref={input}
                id="w-name"
                className="welcome-input"
                type="text"
                autoComplete="name"
                autoCapitalize="words"
                spellCheck={false}
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
              />
              <button type="submit" className="w-btn pri wide welcome-go" disabled={!valid}>Open my surprise</button>
              <p className="welcome-fine">Takes a few minutes. Scroll gently and tap along the way.</p>
            </form>
          ) : (
            <div className="welcome-load" role="status" aria-live="polite">
              <div className={`ring ${phase === "ready" ? "done" : ""}`}>
                <svg viewBox="0 0 120 120" aria-hidden="true">
                  <defs>
                    <linearGradient id="w-ring" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor="#d4225f" />
                      <stop offset="1" stopColor="#f29ac2" />
                    </linearGradient>
                  </defs>
                  <circle cx="60" cy="60" r={R} className="track" />
                  <circle cx="60" cy="60" r={R} className="bar" stroke="url(#w-ring)" strokeDasharray={C} strokeDashoffset={C * (1 - pct)} />
                </svg>
                <span className="ring-mark"><Mark size={44} /></span>
              </div>
              <div className="welcome-pct">{Math.round(pct * 100)}%</div>
              <div className="wp-eyebrow">{phase === "ready" ? "All set" : "Preparing your surprise"}</div>
              <h2 className="welcome-title small">{phase === "ready" ? `Here it comes, ${first}.` : `Hi ${first}, this will only take a moment.`}</h2>
              <p className={`welcome-slow ${slow && phase !== "ready" ? "on" : ""}`}>
                Your connection is a little slow, so this is taking longer than usual. Everything is on its way, no need to worry. We&rsquo;ll open it the moment it&rsquo;s ready.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
