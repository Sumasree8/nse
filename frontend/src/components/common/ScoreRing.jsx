import React from 'react';

function getScoreColor(score) {
  if (score >= 80) return '#00ff88';
  if (score >= 65) return '#00d4ff';
  if (score >= 50) return '#ff9900';
  return '#ff4444';
}

export default function ScoreRing({ score = 0, size = 64, strokeWidth = 4 }) {
  const color = getScoreColor(score);
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1f2736" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-out', filter: `drop-shadow(0 0 6px ${color}66)` }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-mono font-bold" style={{ fontSize: size * 0.28, color }}>{score}</span>
      </div>
    </div>
  );
}
