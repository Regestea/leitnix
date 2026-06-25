interface ProgressCircleProps {
  current: number;
  total: number;
}

export default function ProgressCircle({
  current,
  total,
}: ProgressCircleProps) {
  const radius = 90;
  const circumference = 2 * Math.PI * radius; // 565.48
  const safeCurrent = Math.min(Math.max(current, 0), total);
  const percentage = total > 0 ? safeCurrent / total : 0;
  const strokeDashoffset = circumference * (1 - percentage);

  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 220 220"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="arcGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--primary, #3b82f6)" />
          <stop offset="100%" stopColor="var(--secondary, #ec4899)" />
        </linearGradient>
      </defs>

      <circle
        cx="110"
        cy="110"
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="12"
      />

      <circle
        cx="110"
        cy="110"
        r={radius}
        fill="none"
        stroke="url(#arcGradient1)"
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        transform="rotate(-90 110 110)"
        style={{ transition: "stroke-dashoffset 0.3s ease-in-out" }}
      />

      <text
        x="110"
        y="110"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="46"
        fontWeight="700"
        fill="white"
      >
        {current}/{total}
      </text>
    </svg>
  );
}
