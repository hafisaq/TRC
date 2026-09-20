import { useEffect, useRef, useState } from "react";
import { hasFilm, posterUrl, videoUrl } from "../lib/media";
import { MediaVideo } from "./Media";

// A small film that plays only while it sits in the middle band of the
// screen — for vertical lists of thumbnails on touch layouts, so one film
// plays at a time instead of every row decoding at once.
export default function CentreFilm({ slug, posterW = 800, sizes = "100vw" }: { slug: string; posterW?: number; sizes?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [centred, setCentred] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => setCentred(entries.some((e) => e.isIntersecting)), { rootMargin: "-32% 0px -32% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <span ref={ref} className="absolute inset-0 block">
      <MediaVideo src={hasFilm(slug) ? videoUrl(slug) : undefined} poster={posterUrl(slug, posterW)} active={centred} sizes={sizes} />
    </span>
  );
}
