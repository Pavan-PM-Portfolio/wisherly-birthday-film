"use client";

import { useEffect, useRef } from "react";
import { asset } from "@/lib/birthday/interactions";

const X = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
);

/** The Wisherly mark: the pink ribbon W with its sparkle. */
export function Mark({ size = 26, tone = "pink" }: { size?: number; tone?: "pink" | "black" }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="w-mark" src={asset(tone === "black" ? "/brand/mark-black.png" : "/brand/mark.png")} alt="" width={size} height={Math.round(size * 0.68)} />;
}

/**
 * Every pop-up on the page: a blush paper card mounted in frosted glass, with the
 * Wisherly header, an X at the top right and Wisherly buttons in the footer.
 */
export default function WPanel({
  open, onClose, label, footer, children, className = "", side = "right",
}: {
  open: boolean;
  onClose?: () => void;
  label: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** On wide screens the panel sits beside the character, never over him. */
  side?: "left" | "right";
}) {
  const closeBtn = useRef<HTMLButtonElement>(null);
  const cb = useRef(onClose);
  cb.current = onClose;
  useEffect(() => {
    if (!open) return;
    closeBtn.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") cb.current?.(); };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <div className={`wp-stage ${side} ${open ? "on" : ""}`} role="dialog" aria-modal="true" aria-label={label} aria-hidden={!open}
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className={`wp ${className}`}>
        <div className="wp-in">
          <div className="wp-hd"><Mark /><span>Wisherly</span></div>
          {onClose ? <button ref={closeBtn} type="button" className="wp-x" onClick={onClose} aria-label="Close" tabIndex={open ? 0 : -1}><X /></button> : null}
          {children}
          {footer ? <div className="wp-ft">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}
