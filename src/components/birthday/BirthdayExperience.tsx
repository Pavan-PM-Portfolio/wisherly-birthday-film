"use client";

import { useEffect, useRef } from "react";
import type { BirthdayData } from "@/lib/birthday/types";
import { asset, storyStore, useStory } from "@/lib/birthday/interactions";
import CinematicVideo from "./CinematicVideo";
import ScrollTimeline from "./ScrollTimeline";
import WisherlyLogo from "./WisherlyLogo";
import JourneyIndicator from "./JourneyIndicator";
import HeroOverlay from "./HeroOverlay";
import CakeInteraction from "./CakeInteraction";
import WishesExperience from "./WishesExperience";
import PhotoExperience from "./PhotoExperience";
import PhotoViewer from "./PhotoViewer";
import MessageExperience from "./MessageExperience";
import MemoriesExperience from "./MemoriesExperience";
import GiftExperience from "./GiftExperience";
import GateHint from "./GateHint";
import Welcome from "./Welcome";

const FILM = {
  sources: {
    desktop: "/video/film-desktop.mp4",
    portrait: "/video/film-mobile.mp4",
    // Optional VP9 copies for browsers without H.264 (build with NEXT_PUBLIC_WEBM_FALLBACK=1 and add the files).
    ...(process.env.NEXT_PUBLIC_WEBM_FALLBACK ? { webm: "/video/film-desktop.webm", portraitWebm: "/video/film-mobile.webm" } : {}),
  },
  poster: "/video/poster.webp",
  portraitPoster: "/video/poster-portrait.webp",
};

/**
 * The whole experience. The film is the world (CinematicVideo); the scroll is
 * the clock (ScrollTimeline); every layer above reads that one clock.
 * All content arrives through `data`.
 */
export default function BirthdayExperience({ data }: { data: BirthdayData }) {
  const rewinding = useStory((s) => s.rewinding);
  // ?debug exposes the clock for automated visual checks.
  useEffect(() => {
    if (new URLSearchParams(location.search).has("debug")) {
      import("@/lib/birthday/timeline").then((tl) => import("@/lib/birthday/interactions").then((ix) => {
        (window as unknown as Record<string, unknown>).__wb = { clock: ix.clock, store: ix.storyStore, timeToProgress: tl.timeToProgress };
      }));
    }
  }, []);

  return (
    <main className={rewinding ? "rewinding" : undefined}>
      <div className="letterbox" aria-hidden="true"><i /><i /></div>
      <CinematicVideo sources={FILM.sources} poster={FILM.poster} portraitPoster={FILM.portraitPoster} />
      <div className="sheet-bg" aria-hidden="true" />
      <ScrollTimeline />

      <div className="layer">
        <HeroOverlay name={data.name} />
        <CakeInteraction wish={data.birthdayWish} />
        <WishesExperience wishes={data.wishes} name={data.name} />
        <PhotoExperience photos={data.photos} />
        <MessageExperience message={data.message} sender={data.sender} name={data.name} />
        <MemoriesExperience memories={data.memories} />
        <GiftExperience data={data} />
      </div>
      <PhotoViewer photos={data.photos.slice(0, 10)} />

      <WisherlyLogo />
      <JourneyIndicator />
      <GateHint />
      <Welcome poster={FILM.poster} portraitPoster={FILM.portraitPoster} />
    </main>
  );
}
