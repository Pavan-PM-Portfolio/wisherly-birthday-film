export type BeatId = "hero" | "cake" | "wishes" | "photos" | "message" | "memories" | "gift";

export interface Wish {
  from: string;
  message: string;
}

export interface Photo {
  url: string;
  caption: string;
  date?: string;
}

export interface Memory {
  title: string;
  message: string;
  image?: string;
  date?: string;
}

/** Everything personal on the page. Later this comes from the Wisherly birthday-view backend. */
export interface BirthdayData {
  name: string;
  sender: string;
  birthdayWish: string;
  wishes: Wish[];
  /** Up to 10 are shown. */
  photos: Photo[];
  message: string;
  memories: Memory[];
  gift: { label: string; message: string };
  soundtrackUrl?: string;
  /** Where "Send a thank you" goes (e.g. a Wisherly reply link). Without it, the device share sheet opens. */
  thankYouUrl?: string;
}

export interface StoryBeat {
  id: BeatId;
  label: string;
  /** Where this beat lives in the film, in seconds. */
  start: number;
  end: number;
  /** When the interaction for this beat is available, in seconds. */
  interact: [number, number];
  /**
   * Optional scroll gate: the story holds on this exact film moment (seconds)
   * until the visitor does the beat's action. `hint` is shown if they try to scroll on.
   */
  gate?: { at: number; hint: string; /** show the hint as soon as the story stops here */ announce?: boolean };
}

/** A point the camera framing or a hotspot follows over time: [seconds, x, y] in 0..1 of the video frame. */
export type Track = [number, number, number][];
