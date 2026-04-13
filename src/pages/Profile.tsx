import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProfileBadge from '../components/ProfileBadge';
import AchievementBadge from '../components/AchievementBadge';
import { computeAchievements } from '../utils/achievements';
import type { PlayerPublic, PlayerAnalytics } from '../types';

function fmt(n: number) {
  return n.toLocaleString();
}

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const { session } = useAuth();

  const [player, setPlayer] = useState<PlayerPublic | null>(null);
  const [stats, setStats] = useState<PlayerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    fetch(`/api/players/${username}`)
      .then((r) => {
        if (r.status === 404) {
          setNotFound(true);
          setLoading(false);
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (d) {
          setPlayer(d.player);
          setStats(d.stats);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [username]);

  const isMe = session?.username === username;

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div className="skeleton" style={{ height: '120px', borderRadius: '10px' }} />
        <div className="skeleton" style={{ height: '180px', borderRadius: '10px' }} />
        <div className="skeleton" style={{ height: '260px', borderRadius: '10px' }} />
      </div>
    );
  }

  if (notFound || !player) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <p className="text-muted">Player not found.</p>
        <Link to="/leaderboard" style={{ color: 'var(--color-gold)' }}>← Leaderboard</Link>
      </div>
    );
  }

  const winRate = stats ? Math.round(stats.winRate * 100) : 0;
  const pnl = stats?.netProfitLoss ?? 0;
  const achievements = stats ? computeAchievements(stats, player, isMe) : [];
  const earnedCount = achievements.filter((a) => a.earned).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Profile header */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1
              className="font-display"
              style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, color: 'var(--color-text-primary)' }}
            >
              {player.username}
              {isMe && (
                <span style={{ fontSize: '1rem', marginLeft: '0.5rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)', fontWeight: 400 }}>
                  (you)
                </span>
              )}
            </h1>
            <p className="text-muted" style={{ margin: '0.2rem 0 0', fontSize: '0.85rem' }}>
              Member since {new Date(player.createdAt).toLocaleDateString()}
            </p>
            {earnedCount > 0 && (
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.82rem', color: 'var(--color-blue)' }}>
                🏅 {earnedCount} / {achievements.length} achievements
              </p>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="text-gold" style={{ fontSize: '2rem', fontWeight: 800 }}>
              {fmt(player.balance)} ₪
            </div>
            <div className="text-muted" style={{ fontSize: '0.8rem' }}>current balance</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '0.6rem',
          }}
        >
          {[
            { label: 'Bets Placed', value: fmt(stats.totalBetsPlaced) },
            { label: 'Total Wagered', value: `${fmt(stats.totalShekelsWagered)} ₪` },
            { label: 'Wins', value: `${stats.wins} / ${stats.wins + stats.losses}` },
            { label: 'Win Rate', value: `${winRate}%`, color: winRate >= 50 ? 'var(--color-green)' : 'var(--color-red)' },
            {
              label: 'Net P&L',
              value: `${pnl >= 0 ? '+' : ''}${fmt(pnl)} ₪`,
              color: pnl > 0 ? 'var(--color-green)' : pnl < 0 ? 'var(--color-red)' : undefined,
            },
          ].map((s) => (
            <div key={s.label} className="card" style={{ padding: '1rem', textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '1.3rem',
                  fontWeight: 800,
                  color: s.color ?? 'var(--color-gold)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {s.value}
              </div>
              <div className="text-muted" style={{ fontSize: '0.78rem', marginTop: '0.2rem' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h2
              style={{
                margin: 0,
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--color-blue)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              🏅 Achievements
            </h2>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
              {earnedCount} / {achievements.length} earned
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.5rem' }}>
            {achievements.map((a) => (
              <AchievementBadge key={a.id} achievement={a} />
            ))}
          </div>
        </div>
      )}

      {/* Hall of Shame */}
      {player.embarrassingThings.length > 0 && (
        <div className="card">
          <h2
            style={{
              margin: '0 0 1rem',
              fontSize: '1rem',
              fontWeight: 700,
              color: 'var(--color-red)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            🏦 Hall of Shame — Price of the Bailouts
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {player.embarrassingThings.map((thing, i) => (
              <ProfileBadge key={i} text={thing} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Invite to bank if broke and is self */}
      {isMe && player.balance < 50 && (
        <div
          className="card"
          style={{
            border: '1px solid rgba(245,200,66,0.3)',
            background: 'rgba(245,200,66,0.05)',
            textAlign: 'center',
            padding: '1.25rem',
          }}
        >
          <p style={{ margin: '0 0 0.75rem', fontWeight: 600 }}>
            Running low on shekels? 😬
          </p>
          <Link to="/bank">
            <button className="btn btn-gold">Visit the Bank</button>
          </Link>
        </div>
      )}
    </div>
  );
}
