"use client";

import { useEffect, useRef, useState } from "react";
import { story, timeToProgress } from "@/lib/birthday/timeline";
import { lockedGate, useStory } from "@/lib/birthday/interactions";
import { useFrame } from "@/lib/birthday/fx";

/**
 * A quiet note for the scroll gates.
 * • Try to scroll past a closed gate → it says what to do ("Make a wish to continue").
 * • Do it → "Scroll to continue" until the story moves on.
 */
export default function GateHint() {
  const bump = useStory((s) => s.bump);
  const passed = useStory((s) => s.passed);
  // Out of the way while a card or photo is open.
  const overlay = useStory((s) => s.openWish >= 0 || s.openMemory >= 0 || s.viewPhoto >= 0 || !!s.modal);
  const [msg, setMsg] = useState<{ text: string; kind: "ask" | "go" } | null>(null);
  const el = useRef<HTMLDivElement>(null);
  const last = useRef<{ text: string; kind: "ask" | "go" }>({ text: "", kind: "ask" });
  if (msg) last.current = msg;
  const view = msg ?? last.current;
  const goFrom = useRef(-1);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  // A blocked scroll: say what opens the way.
  useEffect(() => {
    if (!bump) return;
    const g = lockedGate();
    if (!g?.gate) return;
    setMsg({ text: g.gate.hint, kind: "ask" });
    el.current?.classList.remove("nudge"); void el.current?.offsetWidth; el.current?.classList.add("nudge");
    clearTimeout(timer.current);
    if (!g.gate.announce) timer.current = setTimeout(() => setMsg((m) => (m?.kind === "ask" ? null : m)), 2600);
  }, [bump]);

  // A gate just opened: invite the next scroll (except the gift, which plays itself out).
  const prev = useRef(0);
  useEffect(() => {
    if (passed.length > prev.current) {
      const id = passed[passed.length - 1];
      const b = story.find((x) => x.id === id);
      if (id !== "gift" && b?.gate) {
        goFrom.current = timeToProgress(b.gate.at);
        clearTimeout(timer.current);
        setMsg({ text: "Scroll to continue", kind: "go" });
      }
    } else if (passed.length === 0) setMsg(null);
    prev.current = passed.length;
  }, [passed]);

  // Some gates announce themselves the moment the story stops there.
  const announced = useRef("");
  useFrame((c) => {
    const g = lockedGate();
    if (g?.gate?.announce && announced.current !== g.id && c.progress >= timeToProgress(g.gate.at) - 0.0015) {
      announced.current = g.id;
      clearTimeout(timer.current);
      setMsg({ text: g.gate.hint, kind: "ask" });
    }
    if (announced.current && (!g || g.id !== announced.current)) {
      const id = announced.current;
      announced.current = "";
      setMsg((m) => (m?.kind === "ask" && story.find((x) => x.id === id)?.gate?.hint === m.text ? null : m));
    }
  });

  // The "go" note leaves as soon as the story moves on.
  useFrame((c) => {
    if (goFrom.current >= 0 && c.progress > goFrom.current + 0.004) {
      goFrom.current = -1;
      setMsg((m) => (m?.kind === "go" ? null : m));
    }
  });

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <div ref={el} className={`gate-hint ${msg && !overlay ? "on" : ""} ${view.kind}`} role="status" aria-live="polite">
      <span className="spark" aria-hidden="true">✦</span>
      <span>{view.text}</span>
      {view.kind === "go" ? <i aria-hidden="true" /> : null}
    </div>
  );
}
