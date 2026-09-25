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

// Films that are about to be needed buffer their opening seconds ahead of
// time, so they start the moment they are asked to instead of connecting and
// downloading from nothing. Only a few may warm at once: the film on screen
// keeps the bandwidth, and phones keep their memory.
const WARM_LIMIT = 3;
const CAN_HOVER = typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;
const warming = new Set<HTMLVideoElement>();
const warmWaiters = new Set<() => void>();
function holdWarmSlot(video: HTMLVideoElement) {
  if (warming.has(video)) return true;
  if (warming.size >= WARM_LIMIT) return false;
  warming.add(video);
  return true;
}
function dropWarmSlot(video: HTMLVideoElement) {
  if (warming.delete(video)) [...warmWaiters].forEach(wake => wake());
}

// iOS in Low Power Mode refuses every play() that does not come from a
// touch. Worse, WebKit only lifts that rule per element, and only for an
// element that was played inside a gesture. So the first touch on the page
// "unlocks" every film on it — play() then pause(), inside the gesture —
// and every later touch restarts any film that wants to play but was
// refused. Before the first touch, the poster shows; nothing else can.
const refusedVideos = new Set<HTMLVideoElement>();
let unlocked = false;
function unlockOnGesture() {
  if (!unlocked) {
    unlocked = true;
    document.querySelectorAll<HTMLVideoElement>("video[data-managed-video]").forEach((v) => {
      if (v.dataset.wanted === "1") return; // playing or about to: leave it be
      // the restriction is lifted the moment play() is called inside the
      // gesture; pausing straight after keeps warm films parked and a
      // sourceless element from starting on its own once it gets a source
      v.play()?.catch(() => undefined);
      v.pause();
    });
  }
  [...refusedVideos].forEach((v) => {
    refusedVideos.delete(v);
    if (v.dataset.wanted === "1") v.play()?.catch(() => refusedVideos.add(v));
  });
}
if (typeof window !== "undefined") {
  window.addEventListener("touchend", unlockOnGesture, { passive: true });
  window.addEventListener("pointerdown", unlockOnGesture, { passive: true });
  window.addEventListener("keydown", unlockOnGesture, { passive: true });
}

// Poster and film share one surface. The still stays underneath until the
// first frame is playing; films on or near the screen are warmed, the rest
// hold no source at all.
export function MediaVideo({ src, poster, active = true, priority = false, hover = false, className = "", sizes = "100vw" }: MediaVideoProps) {
  const surfaceRef = useRef<HTMLSpanElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(priority);
  const [visible, setVisible] = useState(false);
  const [close, setClose] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;
    const warm = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) { setNear(true); warm.disconnect(); }
    }, { rootMargin: "300px 0px" });
    const view = new IntersectionObserver(entries => setVisible(entries.some(e => e.isIntersecting && e.intersectionRatio >= 0.01)), { threshold: [0, 0.01] });
    // one screen ahead in either direction: the next film to be scrolled to
    const ahead = new IntersectionObserver(entries => setClose(entries.some(e => e.isIntersecting)), { rootMargin: "100% 0px" });
    warm.observe(surface);
    view.observe(surface);
    ahead.observe(surface);
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
      warm.disconnect(); view.disconnect(); ahead.disconnect();
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
    const allowed = () => !cancelled && !document.hidden
      // honour the user's explicit data-saver and genuinely slow links only:
      // Chrome's "3g" estimate fires on plenty of healthy Wi-Fi/4G sessions
      // and would silently switch films off for those visitors
      && !motion.matches && !connection?.saveData && !["slow-2g", "2g"].includes(connection?.effectiveType || "");
    const wanted = () => allowed() && visible && active && (!hover || interacting);
    // iOS only autoplays inline films that are muted at the element level
    // (React sets the property, not the attribute)
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute("muted", "");
    video.setAttribute("autoplay", "");
    const armGestureRetry = () => refusedVideos.add(video);
    const play = () => {
      clearTimeout(releaseTimer);
      video.dataset.wanted = wanted() ? "1" : "0";
      if (!wanted()) {
        refusedVideos.delete(video);
        video.pause();
        // hover-only films (gallery tiles, dossier frames) warm on a mouse
        // device, where they will play on hover; on touch they never play
        // untapped, so warming them is decode work the tablet can skip
        if (allowed() && close && (!hover || CAN_HOVER) && holdWarmSlot(video)) {
          if (video.getAttribute("src") !== src) {
            setPlaying(false);
            video.preload = "auto";
            video.src = src;
            video.load();
          }
          return;
        }
        dropWarmSlot(video);
        if (video.hasAttribute("src")) releaseTimer = setTimeout(() => {
          if (wanted() || warming.has(video)) return;
          video.removeAttribute("src");
          video.load();
          setPlaying(false);
        }, 8000);
        return;
      }
      // the film on screen needs no warm slot: hand it to the next in line
      dropWarmSlot(video);
      if (video.getAttribute("src") !== src) {
        setPlaying(false);
        video.preload = "auto";
        video.src = src;
        video.load();
      }
      video.play()?.catch(() => armGestureRetry());
    };
    video.addEventListener("canplay", play);
    document.addEventListener("visibilitychange", play);
    motion.addEventListener("change", play);
    connection?.addEventListener("change", play);
    warmWaiters.add(play);
    play();
    return () => {
      // no pause here: a deps change re-runs play() at once, and pausing in
      // between would drop a frame on every flip. Unmount pauses below.
      cancelled = true;
      clearTimeout(releaseTimer);
      warmWaiters.delete(play);
      video.removeEventListener("canplay", play);
      document.removeEventListener("visibilitychange", play);
      motion.removeEventListener("change", play);
      connection?.removeEventListener("change", play);
    };
  }, [src, visible, close, active, hover, interacting]);

  useEffect(() => {
    const video = videoRef.current;
    return () => {
      if (!video) return;
      video.pause();
      refusedVideos.delete(video);
      dropWarmSlot(video);
    };
  }, []);

  return <span ref={surfaceRef} className={`absolute inset-0 block overflow-hidden ${className}`}>
    {near && <MediaImage src={poster} alt="" aria-hidden="true" sizes={sizes} loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"} className="absolute inset-0 h-full w-full object-cover" />}
    {src && <video ref={videoRef} data-managed-video muted loop playsInline preload="none"
      onPlaying={() => setPlaying(true)} onError={() => setPlaying(false)}
      className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
      style={{ opacity: playing ? 1 : 0 }} />}
  </span>;
}
