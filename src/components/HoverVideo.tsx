type Props = {
  slug: string;
  className?: string;
};

export default function HoverVideo({ slug, className = "" }: Props) {
  return (
    <video
      data-hovervid
      preload="none"
      muted
      loop
      playsInline
      poster={`/media/poster/${slug}.jpg`}
      className={`absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-[900ms] ${className}`}
    >
      <source data-src={`/media/video/${slug}.mp4`} type="video/mp4" />
    </video>
  );
}
