interface AnalogClockProps {
  hours: number;
  minutes: number;
  seconds: number;
}

// SVG analog clock. Coord system 0..200, center (100,100), radius ~90.
export function AnalogClock({ hours, minutes, seconds }: AnalogClockProps) {
  const hourAngle = ((hours % 12) + minutes / 60) * 30;
  const minuteAngle = (minutes + seconds / 60) * 6;
  const secondAngle = seconds * 6;

  const numerals = [
    { n: 12, x: 100, y: 30 },
    { n: 1, x: 135, y: 40 },
    { n: 2, x: 160, y: 65 },
    { n: 3, x: 170, y: 100 },
    { n: 4, x: 160, y: 135 },
    { n: 5, x: 135, y: 160 },
    { n: 6, x: 100, y: 170 },
    { n: 7, x: 65, y: 160 },
    { n: 8, x: 40, y: 135 },
    { n: 9, x: 30, y: 100 },
    { n: 10, x: 40, y: 65 },
    { n: 11, x: 65, y: 40 },
  ];

  return (
    <svg
      viewBox="0 0 200 200"
      className="w-full h-full"
      aria-label={`Clock showing ${hours}:${String(minutes).padStart(2, "0")}`}
    >
      {/* outer bezel */}
      <circle cx="100" cy="100" r="96" fill="var(--navy)" />
      <circle cx="100" cy="100" r="90" fill="var(--surface)" />

      {/* minute ticks */}
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        const x1 = 100 + Math.sin(a) * 84;
        const y1 = 100 - Math.cos(a) * 84;
        const x2 = 100 + Math.sin(a) * 88;
        const y2 = 100 - Math.cos(a) * 88;
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="var(--navy)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        );
      })}

      {/* numerals */}
      {numerals.map(({ n, x, y }) => (
        <text
          key={n}
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--navy)"
          fontFamily="Inter, sans-serif"
          fontWeight={800}
          fontSize="18"
        >
          {n}
        </text>
      ))}

      {/* heart accent near 6 */}
      <g transform="translate(100 130) scale(0.6)" fill="var(--navy)">
        <path d="M0,4 C-6,-4 -14,-4 -14,4 C-14,10 -6,14 0,20 C6,14 14,10 14,4 C14,-4 6,-4 0,4 Z" />
      </g>

      {/* hour hand */}
      <line
        x1="100"
        y1="100"
        x2="100"
        y2="55"
        stroke="var(--gold)"
        strokeWidth="7"
        strokeLinecap="round"
        transform={`rotate(${hourAngle} 100 100)`}
      />
      {/* minute hand */}
      <line
        x1="100"
        y1="100"
        x2="100"
        y2="35"
        stroke="var(--gold)"
        strokeWidth="5"
        strokeLinecap="round"
        transform={`rotate(${minuteAngle} 100 100)`}
      />
      {/* second hand */}
      <line
        x1="100"
        y1="108"
        x2="100"
        y2="25"
        stroke="oklch(0.55 0.18 260)"
        strokeWidth="1.5"
        strokeLinecap="round"
        transform={`rotate(${secondAngle} 100 100)`}
      />

      {/* center cap */}
      <circle cx="100" cy="100" r="4" fill="var(--gold)" />
      <circle cx="100" cy="100" r="1.5" fill="var(--navy)" />
    </svg>
  );
}
