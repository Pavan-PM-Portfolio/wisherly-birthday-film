# Wisherly — Cinematic Birthday

An interactive birthday card built around a short film. The film is the world: scrolling moves the story forward, and at each moment the character reaches (the cake, the birthday cards, the camera, the laptop, the photo wall, the gift) a small piece of Wisherly interaction appears in the scene.

The stack is Next.js 14 (App Router, static export), TypeScript, Lenis and GSAP. There is no WebGL; the video is the only heavy asset.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # static site in ./out
```

## Timing map

These timings come from stepping through the merged film frame by frame. They are not even 10 % chunks.

| Beat | Film time | What the character does | What the visitor can do |
| --- | --- | --- | --- |
| 01 Hero | 0.0 – 3.5 s | Walks in | Read the greeting |
| 02 Cake | 3.5 – 7.2 s | Lights the candles (5–6 s), closes his eyes (6.5 s) | Tap the candles to make a wish |
| 03 Wishes | 7.2 – 13.0 s | Goes to the card table, reads a card (11–12.5 s) | Open the pile of wishes on his card |
| 04 Photos | 13.0 – 18.0 s | Picks up the camera, takes the picture (flash 17 s) | Capture up to 10 real photos |
| 05 Message | 18.0 – 20.0 s | Opens the laptop; the blank screen in close-up (19.4–19.9 s) | Read your message |
| 06 Memories | 20.0 – 25.8 s | Walks to the photo wall and looks at it | Open your prints pinned on the wall |
| 07 Gift | 25.8 – 30.0 s | Reaches the gift, opens it (glow 28.5 s) | Open the gift for the finale |

Both films (website 16:9 and mobile 9:16) tell the story on the same clock, so one timeline drives both.

All of this is in `src/lib/birthday/timeline.ts`. It has three parts:

- **`story`** holds each beat's film time and its interaction window, in seconds.
- **`PACING`** sets how much scrolling each stretch of film gets. Walking between objects is quick; the moments with interactions get more room, so the film slows down (it never freezes) while the visitor is invited to act.
- **`storyProgress`** is derived from the two above and gives the normalized 0→1 start and end of each beat.

`src/lib/birthday/interactions.ts` holds **`TRACKS`**, the positions of the candles, card, camera, laptop, photo wall and gift in the frame over time (`TRACKS_PORTRAIT` for the mobile film). Hotspots follow those objects as the shot moves.

**If the film is re-cut**, update the seconds in `story`, `PACING` and `TRACKS`. Nothing else needs to change.

## Welcome screen

Before the story, the visitor enters their full name (`Welcome.tsx`). The film starts downloading the moment the page opens, so it is usually ready by the time they've typed. A branded progress ring then follows the real download, and the story opens only once the whole film is in, so scrolling never stutters. If it takes longer than 7 seconds, a calm note explains the connection is slow and that it is still on its way. The name is kept in the story state as `viewer`. `?debug` skips the screen for automated checks.

## The letter on the laptop

The letter opens inside the laptop screen itself. `SCREEN` in `MessageExperience.tsx` holds the screen's four corners at the stop frame, and the letter is warped onto them (a perspective `matrix3d`), so it sits on the glass on desktop and phones alike.

## Pop-ups

Every pop-up (wish, letter, memory, the cake wish and the finale) is `WPanel`: a blush card mounted in frosted glass with the Wisherly header, an X at the top right and Wisherly buttons (solid `#D4225F` or white with a pink line, square corners) in the footer. The laptop notification uses the same glass and buttons. On wide screens each pop-up sits beside the character (`side="left"` for wishes, right for the rest); on upright phones they are centred. The top-left logo is the Wisherly symbol on a glass tile.

The finale has **Watch again** (rewinds to the first frame) and **Send a thank you**. Set `thankYouUrl` in the data to point that button somewhere (for example a Wisherly reply link); without it, the device share sheet opens with a thank-you note.

## Scroll gates

Memories has no stop: as he reaches the photo wall, four cards pop up on the right of the frame (clear of him) and can be opened at any point; the scroll carries on regardless.

The story holds on six exact frames and waits for the visitor. Each frame was matched against the film, so the hold lands on the moment itself:

| Gate | Holds at | Opens when the visitor… |
| --- | --- | --- |
| Cake | 6.50 s, candles lit, his eyes closed | taps the candles (makes a wish) |
| Wishes | 12.20 s, reading a card | clicks the pile of envelopes on the card in his hands; wishes open in a Wisherly pop-up |
| Photos | 16.50 s, camera at his eye | clicks the camera ("Click here") |
| Message | 19.90 s, the laptop screen in close-up (frame 477) | clicks the Wisherly notification on the screen; the letter opens in a pop-up and types itself; **Continue the story** unlocks |
| Gift | 27.50 s, hands on the gift | opens the gift; the film plays to its end, then **Open your surprise** reveals the finale pop-up |

How it behaves:

- **Scrolling back stays free.** Only forward scrolling is held.
- **The hold is exact.** Scrolling on eases to the gate frame and stops; the film clock can't pass a closed gate, even during a fast flick.
- **Piles sit on things in the film.** `FilmPile` keeps the wish envelopes on the card in his hands and the memory prints on the photo wall (tracks `card` and `wall`), with a pulsing glow and a "Click here" callout until opened.
- **A hint explains the hold.** If the visitor keeps scrolling, a small note says what to do ("Make a wish to continue"). Once a gate opens, it says "Scroll to continue".
- **Every scroll input is covered.** Touch goes through Lenis (`syncTouch`) so momentum can't carry past a gate; keyboard and scrollbar ease back to it. The 01–07 chapters can't jump past a closed gate either.
- **Watch it again rewinds the film.** The finale card fades, letterbox bars slide in, the overlays step aside and the film runs backwards (~6 s, eased) all the way to its first frame. Only when it arrives do the gates close again and the greeting return.

Gates live in `story` (`timeline.ts`) as `gate: { at, hint }`. Remove a beat's `gate` to let it scroll freely. The action that opens it calls `pass("<beat>")`.

## One master timeline

`ScrollTimeline` takes the scroll position from Lenis (driven by the GSAP ticker) and turns it into `progress`, from 0 to 1. `progressToTime` then turns that into `clock.time`, in seconds. On every frame, everything else reads that same clock:

- the video's `currentTime`;
- text reveals and hotspots;
- the typed letter;
- when interactions are available.

None of these values pass through React state. React only re-renders when a discrete thing changes, such as the active beat or an opened card.

## The film layer

`CinematicVideo` handles the video itself:

- **Loading.** It downloads the film as a Blob, so seeking is instant on any host, and shows a poster plus a hairline progress bar until it is ready.
- **Playback.** The film never plays on its own. It is only scrubbed, and `currentTime` is written only when the target moves by about a frame and no seek is pending.
- **Two films, one clock.** Upright phones and tablets get the vertical 9:16 film full screen; desktops, landscape tablets and phones held sideways get the 16:9 film. Both films follow the same story timing, so one scroll timeline drives both. Rotating the phone swaps films and keeps the moment.
- **Tap targets per film.** `TRACKS` (16:9) and `TRACKS_PORTRAIT` (9:16) in `interactions.ts` place the candles, camera and gift in each film. `FOCUS_LANDSCAPE` and `FOCUS_PORTRAIT` keep the subject in view when a screen crops the sides.

Encodes:

- `film-desktop.mp4`: the 16:9 website film, 1920×1080 (clean Clideo export), for desktop, tablets sideways and phones sideways;
- `film-mobile.mp4`: the 9:16 mobile film, 720×1280, for upright phones and tablets.

Both are your exports at full resolution, re-encoded at high quality (CRF 18) with a keyframe every 8 frames so scrubbing stays smooth. Nothing is upscaled or cropped.

Optional extras (`webm`, `portraitWebm` in `FILM.sources`, switched on with `NEXT_PUBLIC_WEBM_FALLBACK=1` and the files `film-desktop.webm` / `film-mobile.webm`): VP9 versions for browsers without H.264. Every mainstream browser plays H.264, so they are left out to keep the site light.

## Content

`src/data/birthdayMockData.ts` holds the content: name, sender, wish, any number of wishes, up to 10 photos with captions and dates, the letter, memories and the gift. Components receive it as props, and nothing personal is hard-coded.

To connect Wisherly later, fetch the birthday-view document, map it to `BirthdayData` and pass it to `<BirthdayExperience data={…} />`.

## Assets to replace

- **`public/video/*`**: the films. The website film is a clean 1080p export (a small sparkle mark in its corner was removed). The mobile film is still the earlier 720×1280 export; a native 1080×1920 vertical export can simply replace `film-mobile.mp4` if its timing matches.
- **`public/photos/*`**: placeholder photographs.

## Deploy

Run `./deploy.sh Pavan-PM-Portfolio/wisherly-cinematic`, then set Settings → Pages → Source to **GitHub Actions**.
