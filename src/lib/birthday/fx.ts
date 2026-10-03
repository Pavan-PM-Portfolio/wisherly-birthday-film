"use client";

import { useEffect, useRef } from "react";
import { clock, onFrame } from "./interactions";

/** Run a callback every frame with the shared clock (no React re-renders). */
export function useFrame(fn: (c: typeof clock) => void, deps: unknown[] = []) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => onFrame((c) => ref.current(c)), deps); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Apply a 0..1 visibility value as a physical reveal: opacity, a little rise,
 * a little focus pull. Elements below ~2% stop taking clicks.
 */
export function reveal(el: HTMLElement | null, v: number, opts: { y?: number; blur?: number; scale?: number; rotate?: number; base?: string } = {}) {
  if (!el) return;
  const { y = 14, blur = 4, scale = 0, rotate = 0, base = "" } = opts;
  const k = 1 - v;
  el.style.opacity = v.toFixed(3);
  el.style.transform = `${base} translate3d(0, ${(k * y).toFixed(1)}px, 0)${scale ? ` scale(${(1 - k * scale).toFixed(3)})` : ""}${rotate ? ` rotate(${(k * rotate).toFixed(2)}deg)` : ""}`;
  el.style.filter = v > 0.98 || !blur ? "none" : `blur(${(k * blur).toFixed(1)}px)`;
  el.style.visibility = v < 0.02 ? "hidden" : "visible";
}

/** Same rule as the CSS: a phone or small tablet held upright gets the uncropped "cinema strip" layout. */
export const PORTRAIT_QUERY = "(orientation: portrait) and (max-width: 1024px)";
export const isPhone = () => typeof window !== "undefined" && window.matchMedia(PORTRAIT_QUERY).matches;
