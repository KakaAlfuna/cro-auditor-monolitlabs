interface StatCardProps {
  label: string;
  value: string | number;
  suffix?: string;
}

export function StatCard({ label, value, suffix }: StatCardProps) {
  return (
    <div className="ds-stat-card">
      <span className="ds-stat-card__label">{label}</span>
      <p className="ds-stat-card__value">
        {value}
        {suffix && <span className="ds-stat-card__suffix">{suffix}</span>}
      </p>
    </div>
  );
}
