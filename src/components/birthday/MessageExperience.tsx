"use client";

import { useEffect, useRef, useState } from "react";
import { beat, windowed } from "@/lib/birthday/timeline";
import { useFrame } from "@/lib/birthday/fx";
import { chime, clock, pass, sampleTrack, storyStore, toScreen, trackFor, useStory } from "@/lib/birthday/interactions";
import { Mark } from "./WPanel";

/**
 * The laptop screen at the moment the story stops there (19.875 s, frame 477; the gate sits just after it), as four corners
 * in film coordinates (TL, TR, BR, BL), measured from the frames and inset a hair.
 */
const SCREEN = {
  landscape: [[0.262, 0.214], [0.842, 0.177], [0.833, 0.895], [0.237, 0.838]],
  portrait: [[0.0, 0.207], [1.0, 0.187], [1.0, 0.877], [0.0, 0.848]],
} as const;

/** CSS matrix3d that maps a w×h box onto four screen points (a projective warp). */
function quadMatrix(w: number, h: number, q: [number, number][]) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1 || 1e-9;
  const g = (dx3 * dy2 - dx2 * dy3) / den;
  const hh = (dx1 * dy3 - dx3 * dy1) / den;
  const a = x1 - x0 + g * x1, b = x3 - x0 + hh * x3, c = x0;
  const d = y1 - y0 + g * y1, e = y3 - y0 + hh * y3, f = y0;
  // unit square -> quad, then scale the w×h box into the unit square
  const m = [a / w, d / w, 0, g / w, b / h, e / h, 0, hh / h, 0, 0, 1, 0, c, f, 0, 1];
  return `matrix3d(${m.map((v) => +v.toFixed(8)).join(",")})`;
}

/** Typing speed once the letter is open (characters per second). */
const CPS = 46;

/**
 * He opens the laptop and the screen is blank. A Wisherly notification lands on
 * it; opening it brings up the letter, which types itself out (a tap finishes it).
 * "Continue the story" (or closing it) lets the scroll move on.
 */
export default function MessageExperience({ message, sender, name }: { message: string; sender: string; name: string }) {
  const b = beat("message");
  const gateAt = b.gate?.at ?? 19.896;
  const note = useRef<HTMLDivElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLSpanElement>(null);
  const caret = useRef<HTMLSpanElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const typed = useRef({ chars: 0, last: 0, shown: -1 });
  const [done, setDone] = useState(false);

  const isOpen = useStory((s) => s.modal === "letter");
  const passed = useStory((s) => s.passed.includes("message"));
  // "Watch it again" closes everything: type it fresh next time
  useEffect(() => { if (!passed) { typed.current = { chars: 0, last: 0, shown: -1 }; setDone(false); } }, [passed]);

  const openLetter = () => {
    storyStore.set({ modal: "letter" });
    chime([659.3, 880]);
  };
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps
  const close = () => {
    storyStore.set({ modal: "" });
    pass("message");
  };

  useFrame((c) => {
    // the notification sits on the laptop screen while the story waits there
    const n = note.current;
    if (n) {
      const v = passed || isOpen ? 0 : windowed(c.time, gateAt - 0.35, gateAt + 0.6, 0.3, 0.3);
      const [x, y] = sampleTrack(trackFor("laptop"), c.time);
      const p = toScreen(x, y);
      const w = Math.max(250, Math.min(330, clock.frame.w * (clock.portrait ? 0.74 : 0.24)));
      n.style.width = `${w.toFixed(0)}px`;
      n.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0) translate(-50%, -50%) translateY(${((1 - v) * 14).toFixed(1)}px)`;
      n.style.opacity = v.toFixed(3);
      n.style.visibility = v < 0.05 ? "hidden" : "visible";
    }
    // the letter lives on the laptop screen itself, warped to its perspective
    const sc = screen.current;
    if (sc && isOpen) {
      // on phones the screen fills the frame edge to edge: keep it inside the viewport
      const Q = (clock.portrait ? SCREEN.portrait : SCREEN.landscape).map(([x, y]) => {
        const p = toScreen(x, y);
        return [clock.portrait ? Math.min(window.innerWidth - 12, Math.max(12, p.x)) : p.x, p.y] as [number, number];
      });
      const w = (Math.hypot(Q[1][0] - Q[0][0], Q[1][1] - Q[0][1]) + Math.hypot(Q[2][0] - Q[3][0], Q[2][1] - Q[3][1])) / 2;
      const h = (Math.hypot(Q[3][0] - Q[0][0], Q[3][1] - Q[0][1]) + Math.hypot(Q[2][0] - Q[1][0], Q[2][1] - Q[1][1])) / 2;
      sc.style.width = `${w.toFixed(1)}px`;
      sc.style.height = `${h.toFixed(1)}px`;
      sc.style.fontSize = `${Math.max(10.5, Math.min(18, w / 30)).toFixed(2)}px`;
      sc.style.transform = quadMatrix(w, h, Q);
    }
    // the letter types itself while it is open
    const now = performance.now();
    const dt = typed.current.last ? Math.min(0.1, (now - typed.current.last) / 1000) : 0;
    typed.current.last = now;
    if (!isOpen) return;
    typed.current.chars = Math.min(message.length, typed.current.chars + dt * CPS);
    const k = Math.floor(typed.current.chars);
    if (k !== typed.current.shown && text.current) {
      text.current.textContent = message.slice(0, k);
      typed.current.shown = k;
      if (body.current) body.current.scrollTop = body.current.scrollHeight;
    }
    if (caret.current) caret.current.style.visibility = k < message.length ? "visible" : "hidden";
    if (k >= message.length && !done) setDone(true);
  }, [isOpen, passed, done]);

  const finish = () => { typed.current.chars = message.length; };

  return (
    <>
      <div ref={note} className="w-note fx" style={{ visibility: "hidden" }}>
        <button type="button" className="w-note-in" onClick={openLetter} aria-label={`A message from ${sender}. Open message`}>
          <span className="ic"><Mark size={27} /></span>
          <span className="ap"><span>Wisherly</span><i>now</i></span>
          <span className="t">A message from {sender}</span>
          <span className="s">Your birthday letter is ready to open.</span>
          <span className="w-btn pri op">Open message</span>
        </button>
      </div>

      <div ref={screen} className={`screen-letter ${isOpen ? "on" : ""}`} role="dialog" aria-modal="true" aria-label={`A message from ${sender}`} aria-hidden={!isOpen}>
        <div className="sl-bar">
          <Mark size={20} />
          <span className="sl-app">Wisherly</span>
          <button type="button" className="sl-x" onClick={close} aria-label="Close" tabIndex={isOpen ? 0 : -1}>
            <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <div className="sl-body" onClick={finish}>
          <div className="wp-eyebrow">A message for you</div>
          <div className="sl-from">Dear {name},</div>
          <p className="sr-only">{message}</p>
          <div ref={body} className="sl-text" aria-hidden="true"><span ref={text} /><span ref={caret} className="caret" /></div>
          <div className={`sl-sig ${done ? "on" : ""}`}>— {sender}</div>
        </div>
        <div className="sl-ft">
          <button type="button" className="w-btn pri wide" onClick={close} tabIndex={isOpen ? 0 : -1}>Continue the story ↓</button>
        </div>
      </div>
    </>
  );
}
