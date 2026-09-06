import { useEffect, useRef, useState, type ImgHTMLAttributes } from "react";
import { imageSrcSet, imgSized } from "../lib/media";

export function MediaImage({ src = "", sizes = "100vw", loading = "lazy", onLoad, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const ref = useRef<HTMLImageElement>(null);
  const maxWidth = src.startsWith("https://cdn.sanity.io/images/")
    ? Number(new URL(src).searchParams.get("w")) || 1600 : 1600;
  useEffect(() => {
    // Cached images can finish before React attaches onLoad during navigation.
    if (ref.current?.complete && ref.current.naturalWidth) ref.current.classList.add("media-ready");
  }, [src]);
  return <img {...props} ref={ref} src={imgSized(src, maxWidth)} srcSet={imageSrcSet(src, maxWidth)} sizes={sizes}
    crossOrigin={src.startsWith("https://cdn.sanity.io/") ? "anonymous" : props.crossOrigin}
    loading={loading} decoding="async" onLoad={event => {
      event.currentTarget.classList.add("media-ready");
      onLoad?.(event);
    }} />;
}

type MediaVideoProps = {
  src?: string;
  poster: string;
  active?: boolean;
  priority?: boolean;
  hover?: boolean;
  className?: string;
  sizes?: string;
};

// Poster and film share one surface. Only visible, active films acquire a
// source, and the still stays underneath until the first frame is playing.
export function MediaVideo({ src, poster, active = true, priority = false, hover = false, className = "", sizes = "100vw" }: MediaVideoProps) {
  const surfaceRef = useRef<HTMLSpanElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(priority);
  const [visible, setVisible] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;
    const warm = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) { setNear(true); warm.disconnect(); }
    }, { rootMargin: "300px 0px" });
    const view = new IntersectionObserver(entries => setVisible(entries.some(e => e.isIntersecting && e.intersectionRatio >= 0.01)), { threshold: [0, 0.01] });
    warm.observe(surface);
    view.observe(surface);
    const parent = surface.parentElement;
    const enter = () => setInteracting(true);
    const leave = () => setInteracting(false);
    if (hover) {
      parent?.addEventListener("pointerenter", enter);
      parent?.addEventListener("pointerleave", leave);
      parent?.addEventListener("focusin", enter);
      parent?.addEventListener("focusout", leave);
    }
    return () => {
      warm.disconnect(); view.disconnect();
      parent?.removeEventListener("pointerenter", enter);
      parent?.removeEventListener("pointerleave", leave);
      parent?.removeEventListener("focusin", enter);
      parent?.removeEventListener("focusout", leave);
    };
  }, [hover]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as Navigator & { connection?: EventTarget & { saveData?: boolean; effectiveType?: string } }).connection;
    let cancelled = false;
    let releaseTimer: ReturnType<typeof setTimeout> | undefined;
    const wanted = () => !cancelled && visible && active && (!hover || interacting) && !document.hidden
      // honour the user's explicit data-saver and genuinely slow links only:
      // Chrome's "3g" estimate fires on plenty of healthy Wi-Fi/4G sessions
      // and would silently switch films off for those visitors
      && !motion.matches && !connection?.saveData && !["slow-2g", "2g"].includes(connection?.effectiveType || "");
    const play = () => {
      clearTimeout(releaseTimer);
      if (!wanted()) {
        video.pause();
        if (video.hasAttribute("src")) releaseTimer = setTimeout(() => {
          if (wanted()) return;
          video.removeAttribute("src");
          video.load();
          setPlaying(false);
        }, 8000);
        return;
      }
      if (video.getAttribute("src") !== src) {
        setPlaying(false);
        video.src = src;
        video.load();
      }
      video.play()?.catch(() => undefined);
    };
    video.addEventListener("canplay", play);
    document.addEventListener("visibilitychange", play);
    motion.addEventListener("change", play);
    connection?.addEventListener("change", play);
    play();
    return () => {
      cancelled = true;
      clearTimeout(releaseTimer);
      video.pause();
      video.removeEventListener("canplay", play);
      document.removeEventListener("visibilitychange", play);
      motion.removeEventListener("change", play);
      connection?.removeEventListener("change", play);
    };
  }, [src, visible, active, hover, interacting]);

  return <span ref={surfaceRef} className={`absolute inset-0 block overflow-hidden ${className}`}>
    {near && <MediaImage src={poster} alt="" aria-hidden="true" sizes={sizes} loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"} className="absolute inset-0 h-full w-full object-cover" />}
    {src && <video ref={videoRef} data-managed-video muted loop playsInline preload="none"
      onPlaying={() => setPlaying(true)} onError={() => setPlaying(false)}
      className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
      style={{ opacity: playing ? 1 : 0 }} />}
  </span>;
}
