"use client";

import { useEffect, useRef, useState } from "react";
import { asset, clock, sampleFocus } from "@/lib/birthday/interactions";
import { useFrame, PORTRAIT_QUERY } from "@/lib/birthday/fx";

interface Props {
  /**
   * Two films that share one story clock:
   * • landscape (16:9) for desktop, tablets and phones held sideways — H.264 large/light plus VP9;
   * • portrait (9:16) for phones and small tablets held upright — H.264 plus VP9.
   */
  sources: { desktop: string; portrait: string; mobile?: string; webm?: string; portraitWebm?: string };
  poster: string;
  portraitPoster: string;
}

const SIZE = { landscape: { w: 1920, h: 1080 }, portrait: { w: 1080, h: 1920 } };

/** Tracks the upright-phone rule (same media query as the CSS) and follows rotation. */
function usePortrait() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(PORTRAIT_QUERY);
    const set = () => setOn(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);
  return on;
}

/**
 * The film is the world. It never plays on its own: every frame it is told
 * which moment to show by the shared clock. It is downloaded whole (as a Blob)
 * so seeking is instant on any host, then scrubbed with as few writes as possible.
 */
export default function CinematicVideo({ sources, poster, portraitPoster }: Props) {
  const portrait = usePortrait();
  const box = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const bar = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false);
  const layout = useRef({ w: 0, h: 0, bw: 0, bh: 0, top: 0, left: 0 });
  const seeking = useRef(false);

  // Choose and load the right file.
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    let url = "";
    let cancelled = false;
    clock.portrait = portrait;
    clock.ready = false;
    setReady(false);
    const canH264 = v.canPlayType('video/mp4; codecs="avc1.640028"') !== "";
    // Small, low-density landscape screens can make do with the light file.
    const lowRes = Math.min(innerWidth, innerHeight) <= 520 && (window.devicePixelRatio || 1) < 1.5;
    // Every mainstream browser plays H.264; the WebM and light files are optional extras.
    const useWebm = !canH264 && !!(portrait ? sources.portraitWebm : sources.webm);
    const src = asset(
      portrait
        ? (useWebm ? sources.portraitWebm! : sources.portrait)
        : useWebm ? sources.webm! : lowRes && sources.mobile ? sources.mobile : sources.desktop,
    );

    const onMeta = () => {
      clock.ready = true;
      clock.loaded = 1;
      setReady(true);
    };
    const onSeeking = () => (seeking.current = true);
    const onSeeked = () => (seeking.current = false);
    v.addEventListener("loadeddata", onMeta);
    v.addEventListener("seeking", onSeeking);
    v.addEventListener("seeked", onSeeked);

    (async () => {
      try {
        const res = await fetch(src);
        if (!res.ok || !res.body) throw new Error("fetch failed");
        const total = Number(res.headers.get("content-length")) || 0;
        const reader = res.body.getReader();
        const chunks: Uint8Array[] = [];
        let got = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done || cancelled) break;
          chunks.push(value);
          got += value.length;
          if (total) clock.loaded = Math.min(0.99, got / total);
          if (bar.current && total) bar.current.style.transform = `scaleX(${got / total})`;
        }
        if (cancelled) return;
        url = URL.createObjectURL(new Blob(chunks, { type: useWebm ? "video/webm" : "video/mp4" }));
        v.src = url;
      } catch {
        v.src = src; // streaming fallback
      }
      v.load();
    })();

    return () => {
      cancelled = true;
      v.removeEventListener("loadeddata", onMeta);
      v.removeEventListener("seeking", onSeeking);
      v.removeEventListener("seeked", onSeeked);
      v.removeAttribute("src");
      v.load();
      if (url) URL.revokeObjectURL(url);
    };
  }, [sources, portrait]);

  // Frame the film (cover, with a moving focus point on narrow screens) and scrub it.
  useFrame((c) => {
    const b = box.current;
    const v = video.current;
    if (!b || !v) return;
    const bw = b.clientWidth;
    const bh = b.clientHeight;
    const L = layout.current;
    if (L.bw !== bw || L.bh !== bh) {
      const r = b.getBoundingClientRect();
      L.bw = bw; L.bh = bh; L.top = r.top; L.left = r.left;
    }
    // Cover the screen with whichever film fits it; a focus point keeps the subject in view
    // when the sides are cropped. On a squarer screen the vertical film keeps more headroom.
    const F = clock.portrait ? SIZE.portrait : SIZE.landscape;
    const scale = Math.max(bw / F.w, bh / F.h);
    const w = F.w * scale;
    const h = F.h * scale;
    const focus = sampleFocus(c.time);
    const x = Math.min(0, Math.max(bw - w, bw / 2 - focus * w));
    const y = (bh - h) * (clock.portrait ? 0.3 : 0.5);
    if (L.w !== w || L.h !== h) {
      L.w = w; L.h = h;
      v.style.width = `${w}px`;
      v.style.height = `${h}px`;
      const p = b.querySelector<HTMLElement>(".poster");
      if (p) { p.style.width = `${w}px`; p.style.height = `${h}px`; }
    }
    const tf = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    v.style.transform = tf;
    const p = b.querySelector<HTMLElement>(".poster");
    if (p) p.style.transform = tf;
    // Overlays live in a full-screen layer, so report the frame in viewport coordinates.
    c.frame = { x: L.left + x, y: L.top + y, w, h };

    // Scrub: only write when the target moved by about a frame and no seek is pending.
    if (v.readyState >= 1 && !seeking.current) {
      const target = Math.min(c.time, (v.duration || 28) - 0.04);
      if (Math.abs(v.currentTime - target) > 0.03) v.currentTime = target;
    }
  });

  // Paused, muted, inline: the film never plays on its own.
  useEffect(() => {
    const onVis = () => video.current?.pause();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  return (
    <div ref={box} className={`film ${ready ? "is-ready" : ""}`} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img key={portrait ? "p" : "l"} className="poster" src={asset(portrait ? portraitPoster : poster)} alt="" style={{ objectFit: "fill" }} />
      <video ref={video} muted playsInline preload="none" disablePictureInPicture disableRemotePlayback tabIndex={-1} />
      <div className="grade" />
      <div className="grain" />
      <div className="loading-line"><i ref={bar} /></div>
    </div>
  );
}
