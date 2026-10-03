"use client";

import { story, timeToProgress } from "@/lib/birthday/timeline";
import { goTo, useStory } from "@/lib/birthday/interactions";

/** 01–07, barely there. Each number takes you to the moment its interaction begins. */
export default function JourneyIndicator() {
  const active = useStory((s) => s.active);
  return (
    <nav className="journey" aria-label="Story">
      {story.map((b, i) => (
        <button key={b.id} type="button" aria-current={active === b.id ? "step" : undefined} onClick={() => goTo(i === 0 ? 0 : timeToProgress(b.interact[0] + 0.3))} aria-label={b.label}>
          <span className="n">{String(i + 1).padStart(2, "0")}</span>
          <span className="bar" />
          <span className="l">{b.label}</span>
        </button>
      ))}
    </nav>
  );
}
