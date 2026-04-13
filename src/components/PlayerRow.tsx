import { Link } from 'react-router-dom';
import type { PlayerPublic } from '../types';

interface Props {
  player: PlayerPublic;
  rank: number;
  currentUsername?: string;
}

function fmt(n: number) {
  return n.toLocaleString();
}

const medalColors: Record<number, string> = {
  1: '#f5c842',
  2: '#c0c0c0',
  3: '#cd7f32',
};

export default function PlayerRow({ player, rank, currentUsername }: Props) {
  const isMe = player.username === currentUsername;
  const medal = medalColors[rank];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '0.85rem 1rem',
        background: isMe ? 'rgba(245,200,66,0.07)' : 'var(--color-bg-card)',
        border: `1px solid ${isMe ? 'rgba(245,200,66,0.3)' : 'var(--color-border)'}`,
        borderRadius: '8px',
        transition: 'border-color 0.15s',
      }}
    >
      {/* Rank */}
      <span
        style={{
          minWidth: '2rem',
          textAlign: 'center',
          fontWeight: 700,
          fontSize: rank <= 3 ? '1.1rem' : '0.9rem',
          color: medal ?? 'var(--color-text-muted)',
        }}
      >
        {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `#${rank}`}
      </span>

      {/* Username */}
      <Link
        to={`/player/${player.username}`}
        style={{ textDecoration: 'none', flex: 1 }}
      >
        <span
          style={{
            fontWeight: 600,
            color: isMe ? 'var(--color-gold)' : 'var(--color-text-primary)',
            fontSize: '0.95rem',
          }}
        >
          {player.username}
          {isMe && (
            <span style={{ fontSize: '0.75rem', marginLeft: '0.4rem', color: 'var(--color-text-muted)' }}>
              (you)
            </span>
          )}
        </span>
      </Link>

      {/* Balance */}
      <span
        style={{
          fontWeight: 700,
          fontSize: '1.05rem',
          color: 'var(--color-gold)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {fmt(player.balance)} ₪
      </span>
    </div>
  );
}
