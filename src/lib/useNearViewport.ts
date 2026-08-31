import { useEffect, useRef, useState } from "react";

// True once the element has come within `margin` of the viewport — and
// stays true. Media gated behind this defers its poster/image download
// until the user is actually approaching, instead of everything on the
// page loading at boot. SSR/observer-less environments resolve to true.
export function useNearViewport<T extends Element>(margin = "120%") {
  const ref = useRef<T | null>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    if (near) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: `${margin} 0px` }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [near]);

  return { ref, near };
}
