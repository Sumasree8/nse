import React from 'react';

function getScoreColor(score) {
  if (score >= 80) return '#10b981';  // success green
  if (score >= 65) return '#6366f1';  // brand indigo
  if (score >= 50) return '#f59e0b';  // warning amber
  return '#ef4444';                   // danger red
}

export default function ScoreRing({ score = 0, size = 64, strokeWidth = 4 }) {
  const color        = getScoreColor(score);
  const radius       = (size - strokeWidth * 2) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset       = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="var(--border)" strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.9s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="font-mono font-bold tabular-nums"
          style={{ fontSize: size * 0.27, color }}
        >
          {score}
        </span>
      </div>
    </div>
  );
}
