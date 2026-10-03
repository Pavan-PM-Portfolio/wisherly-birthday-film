"use client";

import dynamic from "next/dynamic";
import { birthdayMockData } from "@/data/birthdayMockData";

/* Client-only: the experience is built on the video element and the scroll clock.
   Later: load the birthday by id from the Wisherly backend and pass it in place of the mock. */
const BirthdayExperience = dynamic(() => import("@/components/birthday/BirthdayExperience"), {
  ssr: false,
  loading: () => (
    <div className="film" aria-hidden="true">
      <picture>
        <source media="(orientation: portrait) and (max-width: 1024px)" srcSet={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/video/poster-portrait.webp`} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="poster" src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/video/poster.webp`} alt="" />
      </picture>
    </div>
  ),
});

export default function Page() {
  return <BirthdayExperience data={birthdayMockData} />;
}
