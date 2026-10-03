import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const display = localFont({
  src: [
    { path: "../fonts/fraunces.woff2", style: "normal", weight: "300 700" },
    { path: "../fonts/fraunces-italic.woff2", style: "italic", weight: "300 700" },
  ],
  variable: "--font-display",
  display: "swap",
});
const sans = localFont({ src: "../fonts/plus-jakarta-sans-latin-wght-normal.woff2", variable: "--font-sans", weight: "300 800", display: "swap" });
const hand = localFont({ src: "../fonts/caveat-500.woff2", variable: "--font-hand", weight: "500", display: "swap" });
const type = localFont({ src: "../fonts/special-elite.woff2", variable: "--font-type", weight: "400", display: "swap" });

export const metadata: Metadata = {
  title: "Happy Birthday — Wisherly",
  description: "A little journey made just for you.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#2a2219" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${hand.variable} ${type.variable}`}>
      <head>
        <link rel="preload" as="image" media="not all and (orientation: portrait) and (max-width: 1024px)" href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/video/poster.webp`} />
        <link rel="preload" as="image" media="(orientation: portrait) and (max-width: 1024px)" href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/video/poster-portrait.webp`} />
      </head>
      <body>{children}</body>
    </html>
  );
}
