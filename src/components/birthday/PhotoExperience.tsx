"use client";

import { useEffect, useRef, useState } from "react";
import type { Photo } from "@/lib/birthday/types";
import { asset, trackFor, chime, clock, pass, sampleTrack, storyStore, toScreen, useStory } from "@/lib/birthday/interactions";
import { beat, windowed } from "@/lib/birthday/timeline";
import { isPhone, reveal, useFrame } from "@/lib/birthday/fx";
import Hotspot from "./Hotspot";

const MAX = 10;
const TILT = [-6, 4, -3, 7, -5, 3, -7, 5, -2, 6];

interface Shot { i: number; x: number; y: number; placed: boolean }

/** Wall slot for photo i, in wall-local pixels. */
function slot(i: number, phone: boolean, count: number) {
  if (phone) {
    // a single overlapping strip that always fits the screen, however many photos
    const W = typeof window === "undefined" ? 360 : Math.min(640, window.innerWidth - (window.innerWidth >= 600 ? 72 : 36));
    const w = Math.round(Math.min(window.innerWidth >= 600 ? 170 : 140, Math.max(104, W * 0.3)));
    const step = Math.min(w * 0.82, (W - w) / Math.max(1, count - 1));
    return { x: i * step, y: (i % 2) * 16, w };
  }
  // short screens (a phone held sideways) get a smaller wall
  const k = typeof window === "undefined" ? 1 : Math.min(1, Math.max(0.5, (window.innerHeight - 110) / 600));
  const w = Math.round((count > 6 ? 132 : 150) * k);
  const col = i % 2;
  const row = Math.floor(i / 2);
  return { x: col * (w + 30 * k) + (row % 2) * 22 * k, y: row * (w * 0.78), w };
}

/**
 * He lifts the camera and takes a picture. From that moment every tap on the
 * camera develops one of your real photographs, which then joins a little wall.
 */
export default function PhotoExperience({ photos }: { photos: Photo[] }) {
  const b = beat("photos");
  const list = photos.slice(0, MAX);
  const taken = useStory((s) => s.photosTaken);
  const [shots, setShots] = useState<Shot[]>([]);
  const wall = useRef<HTMLDivElement>(null);
  const flash = useRef<HTMLDivElement>(null);
  const [phone, setPhone] = useState(false);

  useEffect(() => {
    const on = () => setPhone(isPhone());
    on();
    addEventListener("resize", on);
    return () => removeEventListener("resize", on);
  }, []);

  // Lazily warm the next photo once the camera beat is close.
  const warmed = useRef(-1);
  useFrame((c) => {
    reveal(wall.current, windowed(c.time, b.interact[0] - 0.2, b.end + 0.35, 0.5, 0.45), { y: 20, blur: 3, base: "translateY(-50%)" });
    if (c.time > b.start - 1 && c.time < b.end && warmed.current < taken && taken < list.length) {
      warmed.current = taken;
      const img = new Image();
      img.src = asset(list[taken].url);
    }
  });

  const capture = () => {
    const n = storyStore.get().photosTaken;
    if (n >= list.length) return;
    storyStore.set({ photosTaken: n + 1 });
    pass("photos");
    chime([1568, 2093]);
    const f = flash.current;
    if (f) { f.classList.remove("go"); void f.offsetWidth; f.classList.add("go"); }
    // The print appears where it leaves the camera, then settles onto the wall.
    const [px, py] = sampleTrack(trackFor("print"), Math.max(clock.time, 16.5));
    const p = toScreen(px, py);
    const r = wall.current?.getBoundingClientRect();
    const local = r ? { x: p.x - r.left - 75, y: p.y - r.top - 90 } : { x: 0, y: 0 };
    setShots((s) => [...s, { i: n, x: local.x, y: local.y, placed: false }]);
    setTimeout(() => setShots((s) => s.map((q) => (q.i === n ? { ...q, placed: true } : q))), 900);
  };

  // If the visitor comes back later, captured photos are already on the wall.
  useEffect(() => {
    if (taken < shots.length) setShots((s) => s.slice(0, taken));
  }, [taken, shots.length]);

  const all = taken >= list.length;
  return (
    <>
      <div ref={flash} className="flash" />
      <div ref={wall} className="wall fx" style={{ visibility: "hidden" }}>
        <div className="wall-label">
          <span className="hand">{taken ? "Memories, developing" : "Your memories"}</span>
          <span className="eyebrow">{taken} of {list.length}</span>
        </div>
        {shots.map((s) => {
          const ph = list[s.i];
          const sl = slot(s.i, phone, phone ? Math.max(3, shots.length) : list.length);
          const pos = s.placed ? { left: sl.x, top: sl.y, width: sl.w, transform: `rotate(${TILT[s.i]}deg)` } : { left: s.x, top: s.y, width: 110, transform: `rotate(${TILT[s.i] * 2}deg) scale(0.9)` };
          return (
            <button
              key={s.i}
              type="button"
              className="polaroid paper developing"
              style={{ ...pos, zIndex: s.i + 1, border: 0, cursor: "pointer" }}
              onClick={() => storyStore.set({ viewPhoto: s.i })}
              aria-label={`Open photo: ${ph.caption}`}
            >
              <span className="img" style={{ display: "block" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset(ph.url)} alt={ph.caption} loading="lazy" decoding="async" />
              </span>
              <span className="cap">{ph.caption}</span>
            </button>
          );
        })}
      </div>
      <Hotspot track="camera" window={b.interact} label={all ? "Every memory captured" : taken ? "Click again" : "Click here"} onActivate={capture} hidden={all} side="left" />
    </>
  );
}
