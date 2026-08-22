type Props = {
  id: string;
  pathD: string;
  viewBox: string;
  className?: string;
  color?: string;
  planeSize?: number;
};

/**
 * A gold flight-line + plane silhouette, matching the brand mark's own
 * swoosh-through-the-A motif. The path draws itself while the plane travels
 * along it (see initPlaneTrails in useSiteAnimations) — used as a recurring
 * signature moment rather than a one-off hero flourish.
 */
export default function PlaneTrail({ id, pathD, viewBox, className = "", color = "#c8a24c", planeSize = 22 }: Props) {
  return (
    <svg id={id} viewBox={viewBox} className={className} fill="none" aria-hidden="true">
      <path
        id={`${id}-path`}
        data-trail-path
        d={pathD}
        stroke={color}
        strokeWidth="1.25"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <g id={`${id}-plane`} data-trail-plane>
        <g transform={`rotate(90 12 12) translate(${12 - planeSize / 2} ${12 - planeSize / 2}) scale(${planeSize / 24})`}>
          <path
            d="M21,16V14L13,9V3.5C13,2.67 12.33,2 11.5,2C10.67,2 10,2.67 10,3.5V9L2,14V16L10,13.5V19L7.5,20.5V22L11.5,21L15.5,22V20.5L13,19V13.5L21,16Z"
            fill={color}
          />
        </g>
      </g>
    </svg>
  );
}
