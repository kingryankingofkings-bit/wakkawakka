import { useState, useEffect } from "react";

/**
 * Custom hook to detect when the viewport matches a given CSS media query.
 * Default is target boundary max-width: 767px for mobile.
 */
export function useMediaQuery(query: string = "(max-width: 767px)"): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
}
