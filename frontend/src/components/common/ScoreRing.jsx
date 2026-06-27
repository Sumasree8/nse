import React from 'react';

// Opportunity score ring — matte, single muted colour per band. No glow.
// Antique gold is reserved for the rare, exceptional band (>=90).
function getBand(score) {
  if (score >= 90) return { color: '#BFA059', grade: 'A+' }; // rare / gold
  if (score >= 80) return { color: '#6FA08A', grade: 'A'  }; // verified — sage
  if (score >= 65) return { color: '#6E86B8', grade: 'B'  }; // strong — dusty blue
  if (score >= 50) return { color: '#7C93A8', grade: 'C'  }; // steel
  return { color: '#B47A66', grade: 'D' };                   // risk — terracotta
}

export default function ScoreRing({ score = 0, size = 64, strokeWidth = 4, showGrade = false }) {
  const { color, grade } = getBand(score);
  const radius        = (size - strokeWidth * 2) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset        = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="var(--border-strong)" strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="font-mono font-bold tabular-nums" style={{ fontSize: size * 0.28, color }}>
          {score}
        </span>
        {showGrade && (
          <span className="font-mono font-semibold tracking-wider" style={{ fontSize: size * 0.13, color }}>
            {grade}
          </span>
        )}
      </div>
    </div>
  );
}
