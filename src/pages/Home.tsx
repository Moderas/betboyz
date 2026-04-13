import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BetCard from '../components/BetCard';
import type { BetRecord } from '../types';

export default function Home() {
  const { session } = useAuth();
  const [tab, setTab] = useState<'open' | 'closed'>('open');
  const [bets, setBets] = useState<BetRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/bets?status=${tab}`)
      .then((r) => r.json())
      .then((data) => {
        setBets(data.bets ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [tab]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1
            className="font-display text-gold"
            style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900 }}
          >
            Active Bets
          </h1>
          <p className="text-muted" style={{ margin: 0, fontSize: '0.88rem', marginTop: '0.2rem' }}>
            Place your shekels wisely.
          </p>
        </div>
        {session && (
          <Link to="/create">
            <button className="btn btn-gold">+ Create Bet</button>
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        <button
          className={`tab${tab === 'open' ? ' active' : ''}`}
          onClick={() => setTab('open')}
        >
          Open
        </button>
        <button
          className={`tab${tab === 'closed' ? ' active' : ''}`}
          onClick={() => setTab('closed')}
        >
          Closed
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: '100px', borderRadius: '10px' }} />
          ))}
        </div>
      ) : bets.length === 0 ? (
        <div
          className="card"
          style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-muted)' }}
        >
          <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>🎲</p>
          <p style={{ margin: 0, fontWeight: 600 }}>
            No {tab} bets right now.
          </p>
          {tab === 'open' && session && (
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
              Be the first —{' '}
              <Link to="/create" style={{ color: 'var(--color-gold)' }}>
                create one!
              </Link>
            </p>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {bets.map((bet) => (
            <BetCard key={bet.id} bet={bet} />
          ))}
        </div>
      )}
    </div>
  );
}
