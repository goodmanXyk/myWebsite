import React from "react";

export function ProgressCircle({
  percent,
  label,
  sublabel,
}: {
  percent: number;
  label: string;
  sublabel?: string;
}) {
  const size = 120;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(percent, 100) / 100) * c;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#e5e5e5"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#10a37f"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-ink text-sm font-semibold"
        >
          {Math.round(percent)}%
        </text>
      </svg>
      <div className="text-center">
        <p className="text-sm font-medium text-ink">{label}</p>
        {sublabel && <p className="text-xs text-muted">{sublabel}</p>}
      </div>
    </div>
  );
}
