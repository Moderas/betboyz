import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import PlayerRow from '../components/PlayerRow';
import type { PlayerPublic } from '../types';

export default function Leaderboard() {
  const { session } = useAuth();
  const [players, setPlayers] = useState<PlayerPublic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/players')
      .then((r) => r.json())
      .then((d) => {
        setPlayers(d.players ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const total = players.reduce((s, p) => s + p.balance, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h1
          className="font-display text-gold"
          style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900 }}
        >
          Leaderboard
        </h1>
        <p className="text-muted" style={{ margin: '0.2rem 0 0', fontSize: '0.88rem' }}>
          All shekels in circulation:{' '}
          <span className="text-gold" style={{ fontWeight: 700 }}>
            {total.toLocaleString()} ₪
          </span>
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: '60px', borderRadius: '8px' }} />
          ))}
        </div>
      ) : players.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
          No players yet. Be the first to register!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {players.map((player, i) => (
            <PlayerRow
              key={player.username}
              player={player}
              rank={i + 1}
              currentUsername={session?.username}
            />
          ))}
        </div>
      )}
    </div>
  );
}
