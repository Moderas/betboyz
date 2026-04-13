import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { GlobalAnalytics, PlayerAnalytics } from '../types';

function fmt(n: number) {
  return n.toLocaleString();
}

function fmtPct(n: number) {
  return `${Math.round(n * 100)}%`;
}

function PnlCell({ value }: { value: number }) {
  if (value === 0) return <span className="text-muted">±0 ₪</span>;
  return (
    <span style={{ color: value > 0 ? 'var(--color-green)' : 'var(--color-red)', fontWeight: 700 }}>
      {value > 0 ? '+' : ''}{fmt(value)} ₪
    </span>
  );
}

export default function Analytics() {
  const [global, setGlobal] = useState<GlobalAnalytics | null>(null);
  const [players, setPlayers] = useState<PlayerAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics')
      .then((r) => r.json())
      .then((d) => {
        setGlobal(d.global ?? null);
        setPlayers(d.players ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 className="font-display text-gold" style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900 }}>
          Analytics
        </h1>
        <p className="text-muted" style={{ margin: '0.2rem 0 0', fontSize: '0.88rem' }}>
          The cold, hard numbers.
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="skeleton" style={{ height: '100px', borderRadius: '10px' }} />
          <div className="skeleton" style={{ height: '200px', borderRadius: '10px' }} />
        </div>
      ) : (
        <>
          {/* Global stats */}
          {global && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.75rem',
              }}
            >
              {[
                { label: 'Total Bets Created', value: fmt(global.totalBetsCreated) },
                { label: 'Total Shekels Wagered', value: `${fmt(global.totalShekelsWagered)} ₪` },
                { label: 'Players', value: fmt(players.length) },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="card"
                  style={{ textAlign: 'center', padding: '1.25rem' }}
                >
                  <div
                    className="text-gold"
                    style={{ fontSize: '1.6rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Per-player table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)' }}>
              <h2 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Player Stats
              </h2>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {['Player', 'Bets', 'Wagered', 'Wins', 'Win %', 'Net P&L', '👍', '👎'].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '0.7rem 1.25rem',
                          textAlign: h === 'Player' ? 'left' : 'right',
                          color: 'var(--color-text-muted)',
                          fontWeight: 600,
                          fontSize: '0.78rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {players.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                        No closed bets yet — check back after some bets wrap up.
                      </td>
                    </tr>
                  ) : (
                    players.map((p) => (
                      <tr
                        key={p.username}
                        style={{ borderBottom: '1px solid var(--color-border)' }}
                      >
                        <td style={{ padding: '0.7rem 1.25rem' }}>
                          <Link
                            to={`/player/${p.username}`}
                            style={{ color: 'var(--color-gold-dim)', textDecoration: 'none', fontWeight: 600 }}
                          >
                            {p.username}
                          </Link>
                        </td>
                        <td style={{ padding: '0.7rem 1.25rem', textAlign: 'right', color: 'var(--color-text-muted)' }}>
                          {p.totalBetsPlaced}
                        </td>
                        <td style={{ padding: '0.7rem 1.25rem', textAlign: 'right', color: 'var(--color-text-muted)' }}>
                          {fmt(p.totalShekelsWagered)} ₪
                        </td>
                        <td style={{ padding: '0.7rem 1.25rem', textAlign: 'right', color: 'var(--color-text-muted)' }}>
                          {p.wins}/{p.wins + p.losses}
                        </td>
                        <td style={{ padding: '0.7rem 1.25rem', textAlign: 'right' }}>
                          <span
                            style={{
                              color:
                                p.winRate >= 0.6
                                  ? 'var(--color-green)'
                                  : p.winRate >= 0.4
                                    ? 'var(--color-text-primary)'
                                    : 'var(--color-red)',
                              fontWeight: 600,
                            }}
                          >
                            {fmtPct(p.winRate)}
                          </span>
                        </td>
                        <td style={{ padding: '0.7rem 1.25rem', textAlign: 'right' }}>
                          <PnlCell value={p.netProfitLoss} />
                        </td>
                        <td style={{ padding: '0.7rem 1.25rem', textAlign: 'right', color: 'var(--color-green)', fontWeight: 600 }}>
                          {p.totalUpdootsReceived ?? 0}
                        </td>
                        <td style={{ padding: '0.7rem 1.25rem', textAlign: 'right', color: 'var(--color-red)', fontWeight: 600 }}>
                          {p.totalDowndootsReceived ?? 0}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
