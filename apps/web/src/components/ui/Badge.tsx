import type { ReactNode } from "react";

type BadgeVariant = "critical" | "warning" | "info" | "success";

interface BadgeProps {
  variant: BadgeVariant;
  children: ReactNode;
}

export function Badge({ variant, children }: BadgeProps) {
  return <span className={`ds-badge ds-badge--${variant}`}>{children}</span>;
}

interface ScoreRingProps {
  score: number;
  max?: number;
  label?: string;
}

export function ScoreRing({ score, max = 100, label = "Score" }: ScoreRingProps) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(score / max, 1);
  const offset = circumference * (1 - progress);

  return (
    <div className="ds-score-ring" aria-label={`${label} ${score} out of ${max}`}>
      <svg className="ds-score-ring__svg" viewBox="0 0 88 88" aria-hidden="true">
        <circle className="ds-score-ring__track" cx="44" cy="44" r={radius} />
        <circle
          className="ds-score-ring__fill"
          cx="44"
          cy="44"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="ds-score-ring__value">
        <span className="ds-score-ring__number">{score}</span>
        <span className="ds-score-ring__label">{label}</span>
      </div>
    </div>
  );
}
