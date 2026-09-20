import { useEffect, useState, type RefObject } from "react";

// Which card of a horizontal snap row sits nearest the row's centre.
// Touch layouts have no hover and no pinned scroll to pick an "active"
// country, so the swipe itself does: the centred card is the active one.
// `itemsRef` is the element whose children are the cards (defaults to the
// scroller). Returns -1 until measured / when the row is not scrollable.
export function useSnapIndex(
  scrollerRef: RefObject<HTMLElement | null>,
  count: number,
  itemsRef?: RefObject<HTMLElement | null>
) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || !count) return;
    let frame = 0;
    const read = () => {
      frame = 0;
      const host = itemsRef?.current ?? scroller;
      const box = scroller.getBoundingClientRect();
      const centre = box.left + box.width / 2;
      let best = 0;
      let bestDist = Infinity;
      Array.from(host.children).forEach((child, i) => {
        const r = (child as HTMLElement).getBoundingClientRect();
        if (!r.width) return;
        const d = Math.abs(r.left + r.width / 2 - centre);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      setIndex((prev) => (prev === best ? prev : best));
    };
    const queue = () => { if (!frame) frame = requestAnimationFrame(read); };
    read();
    scroller.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    return () => {
      cancelAnimationFrame(frame);
      scroller.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
    };
  }, [scrollerRef, itemsRef, count]);
  return index;
}

// true on layouts that are driven by the pinned vertical scroll (≥1024px)
export function useIsPinnedLayout() {
  const [pinned, setPinned] = useState(() => window.matchMedia("(min-width: 1024px)").matches);
  useEffect(() => {
    const q = window.matchMedia("(min-width: 1024px)");
    const on = () => setPinned(q.matches);
    q.addEventListener("change", on);
    return () => q.removeEventListener("change", on);
  }, []);
  return pinned;
}
