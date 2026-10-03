"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { SCROLL_UNITS, beatAt, progressToTime, timeToProgress } from "@/lib/birthday/timeline";
import { clock, lockedGate, registerScroll, runFrame, storyStore } from "@/lib/birthday/interactions";

/**
 * The one master timeline. Lenis smooths the wheel / touch; the GSAP ticker
 * drives one loop that turns scroll position into progress (0..1) and film
 * time, then lets every subscribed layer update itself for this frame.
 */
export default function ScrollTimeline() {
  const runway = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);

    const max = () => Math.max(1, document.documentElement.scrollHeight - window.innerHeight);

    /* Gates: the story holds on a beat's exact frame until its action is done.
       Scrolling back stays free; scrolling on eases to the gate and stops there. */
    const gateP = () => {
      const g = lockedGate();
      return g?.gate ? timeToProgress(g.gate.at) : Infinity;
    };
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
    let lastBump = 0;
    const bump = () => {
      const now = performance.now();
      if (now - lastBump < 700) return;
      lastBump = now;
      storyStore.set((s) => ({ bump: s.bump + 1 }));
    };

    // eslint-disable-next-line prefer-const
    let lenis: Lenis;
    lenis = new Lenis({
      duration: reduced ? 0.01 : 1.5,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: !reduced,
      // touch goes through Lenis too, so a flick's momentum can't carry past a gate
      syncTouch: !reduced,
      syncTouchLerp: 0.09,
      touchMultiplier: 1.15,
      virtualScroll: ({ deltaY, event }) => {
        if (!lenis || lenis.isStopped || deltaY <= 0) return true;
        const gy = gateP() * max();
        if (lenis.targetScroll + deltaY <= gy) return true;
        if (event.cancelable) event.preventDefault();
        if (lenis.targetScroll < gy - 1) lenis.scrollTo(gy, { duration: reduced ? 0.01 : 0.9, easing: easeOut });
        else bump();
        return false;
      },
    });

    // Turning the phone changes the page height, so the same scroll offset would mean a
    // different moment. Hold the story where it was and move the scroll to match.
    let lastP = 0;
    let holding = 0;
    let lastW = window.innerWidth;
    const onResize = () => {
      if (window.innerWidth === lastW) return; // mobile URL-bar show/hide: nothing to keep
      lastW = window.innerWidth;
      const keep = lastP;
      holding++;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        lenis.resize();
        lenis.scrollTo(keep * max(), { immediate: true, force: true });
        holding--;
      }));
    };
    window.addEventListener("resize", onResize);

    const tick = (time: number) => {
      lenis.raf(time * 1000);
      const gp = gateP();
      // Anything that slipped past a closed gate (keyboard, scrollbar, a resize) eases back to it.
      if (!holding && !lenis.isStopped && lenis.targetScroll > gp * max() + 2) {
        lenis.scrollTo(gp * max(), { duration: reduced ? 0.01 : 0.6, easing: easeOut, force: true });
      }
      // The film itself never shows a frame beyond a closed gate.
      const p = holding ? lastP : Math.min(gp, 1, Math.max(0, lenis.scroll / max()));
      lastP = p;
      clock.progress = p;
      clock.time = progressToTime(p);
      const s = storyStore.get();
      const active = beatAt(clock.time);
      if (s.active !== active) storyStore.set({ active });
      if (!s.started && p > 0.004) storyStore.set({ started: true });
      runFrame();
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    registerScroll((to, o = {}) => {
      const p = Math.min(to, gateP());
      const target = p * max();
      const distance = Math.abs(target - lenis.scroll) / window.innerHeight;
      lenis.start();
      lenis.scrollTo(target, {
        duration: reduced ? 0.01 : o.duration ?? Math.min(5, 1.4 + distance * 0.22),
        easing: o.easing ?? ((t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)),
        lock: !!o.lock,
        force: true,
        onComplete: o.onComplete,
      });
    });

    // Pause the story (not the film) while a card or photo is open.
    const unsub = storyStore.subscribe(() => {
      const s = storyStore.get();
      if (s.openWish >= 0 || s.viewPhoto >= 0 || s.openMemory >= 0 || s.modal) lenis.stop();
      else lenis.start();
    });

    return () => {
      window.removeEventListener("resize", onResize);
      unsub();
      gsap.ticker.remove(tick);
      lenis.destroy();
      registerScroll(() => {});
    };
  }, []);

  return <div ref={runway} className="runway" style={{ height: `${(SCROLL_UNITS + 1) * 100}vh` }} aria-hidden="true" />;
}
