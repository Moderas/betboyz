import type { Achievement } from '../utils/achievements';

interface Props {
  achievement: Achievement;
}

export default function AchievementBadge({ achievement }: Props) {
  const { icon, name, description, earned } = achievement;

  return (
    <div className={`achievement${earned ? '' : ' achievement-locked'}`}>
      <span className="achievement-icon">{icon}</span>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: '0.9rem',
            color: earned ? 'var(--color-blue)' : 'var(--color-text-muted)',
            marginBottom: '0.15rem',
          }}
        >
          {name}
          {earned && (
            <span
              style={{
                marginLeft: '0.4rem',
                fontSize: '0.7rem',
                fontWeight: 600,
                padding: '0.1rem 0.45rem',
                borderRadius: '9999px',
                background: 'rgba(74,158,255,0.15)',
                color: 'var(--color-blue)',
                border: '1px solid rgba(74,158,255,0.3)',
                verticalAlign: 'middle',
              }}
            >
              EARNED
            </span>
          )}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{description}</div>
      </div>
    </div>
  );
}
