"use client";

import { useEffect } from "react";
import Lenis from "lenis";

// Buttery inertia scrolling for the whole site, like the reference design.
// Skipped for people who ask for reduced motion and on touch devices, which
// already scroll smoothly. In-page #anchor links are eased too.
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const lenis = new Lenis({ lerp: 0.1, anchors: { offset: -96 }, autoRaf: true });
    return () => lenis.destroy();
  }, []);
  return null;
}
