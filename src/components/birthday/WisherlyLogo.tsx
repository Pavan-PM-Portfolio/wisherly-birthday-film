import { Mark } from "./WPanel";

/** The Wisherly symbol in black, straight on the film. */
export default function WisherlyLogo() {
  return (
    <a className="brand" href="https://wisherly.co" target="_blank" rel="noopener noreferrer" aria-label="Wisherly (opens in a new tab)">
      <Mark size={34} tone="black" />
    </a>
  );
}
