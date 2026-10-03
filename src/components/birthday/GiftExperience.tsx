"use client";

import { useRef, useState } from "react";
import type { BirthdayData } from "@/lib/birthday/types";
import { trackFor, chime, goTo, pass, sampleTrack, storyStore, toScreen, useStory } from "@/lib/birthday/interactions";
import { beat, windowed } from "@/lib/birthday/timeline";
import { reveal, useFrame } from "@/lib/birthday/fx";
import Hotspot from "./Hotspot";
import WPanel, { Mark } from "./WPanel";
import { Heart } from "./WishesExperience";

/** He reaches the gift. One tap, the box lights up, and the last card arrives. */
export default function GiftExperience({ data }: { data: BirthdayData }) {
  const b = beat("gift");
  const opened = useStory((s) => s.giftOpened);
  const glow = useRef<HTMLDivElement>(null);
  const ask = useRef<HTMLDivElement>(null);
  const scrim = useRef<HTMLDivElement>(null);
  const finale = useStory((s) => s.modal === "finale");
  const rewinding = useStory((s) => s.rewinding);
  // the reveal button appears only once the film has played to its last frame
  const [arrived, setArrived] = useState(false);
  const [copied, setCopied] = useState(false);

  useFrame((c) => {
    const [x, y] = sampleTrack(trackFor("gift"), c.time);
    const p = toScreen(x, y);
    if (glow.current) glow.current.style.left = `${p.x}px`, glow.current.style.top = `${p.y}px`;
    const v = windowed(c.time, b.interact[0] - 0.3, b.end + 1, 0.5, 0.5);
    reveal(ask.current, opened ? 0 : v, { y: 14, blur: 4 });
    if (scrim.current) scrim.current.style.opacity = v.toFixed(3);
    const atEnd = opened && c.progress > 0.993;
    if (atEnd !== arrived) setArrived(atEnd);
  }, [opened, arrived]);

  const openGift = () => {
    if (storyStore.get().giftOpened) return;
    storyStore.set({ giftOpened: true });
    pass("gift");
    chime([784, 988, 1175, 1568]);
    // let the film finish its own reveal
    goTo(1);
  };

  /**
   * "Watch it again": the card fades, the frame letterboxes, and the film runs
   * backwards all the way to its first frame. The stops close again only once it
   * has arrived, so nothing interrupts the rewind on the way up.
   */
  const replay = () => {
    if (storyStore.get().rewinding) return;
    setArrived(false);
    storyStore.set({ rewinding: true, giftOpened: false, openWish: -1, openMemory: -1, viewPhoto: -1, modal: "" });
    setTimeout(() => {
      goTo(0, {
        duration: 5.8,
        easing: (t) => (t < 0.5 ? 8 * t ** 4 : 1 - Math.pow(-2 * t + 2, 4) / 2),
        lock: true,
        onComplete: () => {
          storyStore.reset();
          storyStore.set({ rewinding: false });
        },
      });
    }, 550);
  };

  const thankYou = async () => {
    if (data.thankYouUrl) { window.open(data.thankYouUrl, "_blank", "noopener"); return; }
    const text = `Thank you for my birthday surprise, ${data.sender}! It made my day.`;
    try {
      if (navigator.share) { await navigator.share({ text }); return; }
    } catch { return; }
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2400); } catch { /* nothing to do */ }
  };

  return (
    <>
      <div ref={scrim} className="scrim-right" style={{ opacity: 0 }} />
      <div ref={glow} className={`gift-glow ${opened ? "on" : ""}`} />
      <div ref={ask} className="prompt right fx" style={{ visibility: "hidden" }}>
        <div className="hand">There&rsquo;s one more thing&hellip;</div>
        <h2>{data.gift.label}</h2>
        <p>Tap the gift to open it.</p>
      </div>
      <Hotspot track="gift" window={b.interact} label="Open it" onActivate={openGift} hidden={opened} side="left" />
      <button type="button" className={`w-reveal ${arrived && !finale && !rewinding ? "on" : ""}`} onClick={() => storyStore.set({ modal: "finale" })} tabIndex={arrived ? 0 : -1}>
        <Mark size={22} /> Open your surprise
      </button>
      <WPanel
        open={finale}
        onClose={() => storyStore.set({ modal: "" })}
        label={`Happy Birthday, ${data.name}`}
        className="wp-finale"
        footer={
          <>
            <button type="button" className="w-btn sec wide" onClick={replay}>Watch again</button>
            <button type="button" className="w-btn pri wide" onClick={thankYou}>{copied ? "Copied to send" : "Send a thank you"}</button>
          </>
        }
      >
        <div className="wp-bd">
          <div className="wp-eyebrow">{data.gift.label} for you</div>
          <p className="wp-quote small">{data.gift.message}</p>
          <h2 className="wp-big">Happy Birthday, {data.name} <Heart size={26} /></h2>
          <div className="wp-sig on left">Made with love · {data.sender}</div>
        </div>
      </WPanel>
    </>
  );
}
