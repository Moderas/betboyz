import { Link } from 'react-router-dom';
import type { BetRecord } from '../types';

interface Props {
  bet: BetRecord;
}

function fmt(n: number) {
  return n.toLocaleString();
}

export default function BetCard({ bet }: Props) {
  const isOpen = bet.status === 'open';

  return (
    <Link to={`/bet/${bet.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div className="card-hover" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
          <p
            style={{
              margin: 0,
              fontWeight: 600,
              fontSize: '1rem',
              color: 'var(--color-text-primary)',
              lineHeight: 1.4,
              flex: 1,
            }}
          >
            {bet.description}
          </p>
          <span className={`badge ${isOpen ? 'badge-open' : 'badge-closed'}`}>
            {isOpen ? 'Open' : 'Closed'}
          </span>
        </div>

        {/* Options preview */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {bet.options.map((opt, i) => (
            <span
              key={i}
              className="badge"
              style={{
                background: 'rgba(255,255,255,0.06)',
                color: 'var(--color-text-muted)',
                border: '1px solid var(--color-border)',
              }}
            >
              {opt.label}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.82rem',
            color: 'var(--color-text-muted)',
          }}
        >
          <span>
            By <span style={{ color: 'var(--color-gold-dim)' }}>{bet.creator}</span>
          </span>
          <span>
            Pool:{' '}
            <span className="text-gold" style={{ fontWeight: 700 }}>
              {fmt(bet.totalPool)} ₪
            </span>
            {' · '}Min: {fmt(bet.minimumBet)} ₪
          </span>
        </div>
      </div>
    </Link>
  );
}
