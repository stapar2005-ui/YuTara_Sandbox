"use client";

import { useEffect, useState } from "react";

/**
 * Auto-hiding sticky header: hides while scrolling down and reveals
 * immediately as soon as the user scrolls up.
 */
export function useAutoHideHeader(threshold = 160): boolean {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      if (y <= threshold) {
        setHidden(false);
      } else {
        setHidden(y > last);
      }
      last = y;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return hidden;
}
