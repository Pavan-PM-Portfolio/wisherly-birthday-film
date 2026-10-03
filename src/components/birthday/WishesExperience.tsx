"use client";

import { useEffect, useState } from "react";
import type { Wish } from "@/lib/birthday/types";
import { chime, pass, storyStore, useStory } from "@/lib/birthday/interactions";
import { beat } from "@/lib/birthday/timeline";
import FilmPile from "./FilmPile";
import WPanel from "./WPanel";

/** How many envelopes are drawn in the pile (the rest are counted). */
const PILE = 4;

function Heart({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 8 3.4 4.6 6.8 4.6c2.1 0 3.6 1.2 4.4 2.6.8-1.4 2.3-2.6 4.4-2.6 3.4 0 5.4 3.4 4.1 6.7-1.8 4.6-9.3 9.2-9.3 9.2z" fill="currentColor" />
    </svg>
  );
}
export { Heart };

/** He opens a yellow envelope at the desk. Yours are piled right there in his hands. */
export default function WishesExperience({ wishes, name }: { wishes: Wish[]; name: string }) {
  const b = beat("wishes");
  const open = useStory((s) => s.openWish);
  const [opened, setOpened] = useState<number[]>([]);

  const show = (i: number) => {
    storyStore.set({ openWish: i });
    pass("wishes");
    setOpened((o) => (o.includes(i) ? o : [...o, i]));
    chime([1046.5, 1318.5]);
  };
  const close = () => storyStore.set({ openWish: -1 });

  useEffect(() => {
    if (open < 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") show((open + 1) % wishes.length);
      if (e.key === "ArrowLeft") show((open - 1 + wishes.length) % wishes.length);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [open, wishes.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const w = open >= 0 ? wishes[open] : null;
  const [last, setLast] = useState<Wish | null>(null);
  useEffect(() => { if (w) setLast(w); }, [w]);
  const card = w ?? last;

  return (
    <>
      <FilmPile
        track="card"
        window={[b.interact[0] + 0.3, b.end]}
        size={{ frac: 0.11, min: 104, max: 190 }}
        tilt={-6}
        offset={[0.05, -0.05]}
        label={`Open ${wishes.length} birthday wishes`}
        caption={`${wishes.length} wishes for ${name}`}
        quiet={opened.length > 0}
        onActivate={() => show(0)}
      >
        {wishes.slice(0, PILE).reverse().map((wish, i, arr) => {
          const k = arr.length - 1 - i; // 0 = top of the pile = the first wish, which opens first
          return (
            <span key={i} className={`pile-env c${i % 5}`} style={{ transform: `translate(${k * -5}px, ${k * 4}px) rotate(${[0, -7, 6, -3][k % 4]}deg)`, zIndex: i }} aria-hidden="true">
              <span className="flap" />
              {k === 0 ? <span className="seal"><Heart size={10} /></span> : null}
              {k === 0 ? <span className="who">{wish.from}</span> : null}
            </span>
          );
        })}
        <span className="pile-count" aria-hidden="true">{wishes.length}</span>
      </FilmPile>

      <WPanel
        open={!!w}
        onClose={close}
        label="A birthday wish"
        side="left"
        footer={
          <>
            {wishes.length > 1 ? <span className="wp-count">{String((open >= 0 ? open : 0) + 1).padStart(2, "0")} / {String(wishes.length).padStart(2, "0")}</span> : <span className="wp-count" />}
            {wishes.length > 1 ? <button type="button" className="w-btn sec" onClick={() => show((open - 1 + wishes.length) % wishes.length)}>Previous</button> : null}
            <button type="button" className="w-btn pri" onClick={() => (wishes.length > 1 ? show((open + 1) % wishes.length) : close())}>{wishes.length > 1 ? "Next wish →" : "Close"}</button>
          </>
        }
      >
        {card ? (
          <div className="wp-bd" key={open}>
            <div className="wp-eyebrow">A wish from</div>
            <div className="wp-from">{card.from}</div>
            <p className="wp-quote">&ldquo;{card.message}&rdquo;</p>
          </div>
        ) : null}
      </WPanel>
    </>
  );
}
