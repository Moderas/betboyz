import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { useToast } from '../components/Toast';
import Mascot from '../components/Mascot';

const BANK_LIMIT = 3;

export default function Bank() {
  const { session } = useAuth();
  const { apiFetch } = useApi();
  const toast = useToast();

  const [balance, setBalance] = useState<number | null>(null);
  const [requestsUsed, setRequestsUsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [revealed, setRevealed] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    fetch(`/api/players/${session.username}`)
      .then((r) => r.json())
      .then((d) => {
        setBalance(d.player?.balance ?? null);
        setRequestsUsed(d.player?.bankRequestCount ?? 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [session]);

  const handleRequest = async () => {
    setRequesting(true);
    setRevealed(null);
    try {
      const result = await apiFetch<{
        ok: boolean;
        balance: number;
        embarrassingThing: string;
        requestsRemaining: number;
      }>('/api/bank', { method: 'POST' });
      setBalance(result.balance);
      setRequestsUsed(BANK_LIMIT - result.requestsRemaining);
      setRevealed(result.embarrassingThing);
      toast(`+100 ₪ received. New balance: ${result.balance.toLocaleString()} ₪`, 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Bank request failed', 'error');
    } finally {
      setRequesting(false);
    }
  };

  const remaining = BANK_LIMIT - requestsUsed;
  const canRequest = remaining > 0;

  return (
    <div style={{ maxWidth: '520px' }}>
      <h1 className="font-display text-gold" style={{ margin: '0 0 0.25rem', fontSize: '1.8rem', fontWeight: 900 }}>
        The Bank
      </h1>
      <p className="text-muted" style={{ margin: '0 0 1.5rem', fontSize: '0.9rem' }}>
        Out of shekels? The bank will help. For a price.
      </p>

      {loading ? (
        <div className="skeleton" style={{ height: '220px', borderRadius: '10px' }} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Balance card */}
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <Mascot size={56} />
            <div>
              <div className="text-muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Your Balance
              </div>
              <div className="text-gold" style={{ fontSize: '2rem', fontWeight: 800 }}>
                {balance !== null ? `${balance.toLocaleString()} ₪` : '—'}
              </div>
            </div>
          </div>

          {/* Deal card */}
          <div
            className="card"
            style={{
              border: '1px solid rgba(245,200,66,0.25)',
              background: 'rgba(245,200,66,0.04)',
            }}
          >
            <h2 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 700 }}>
              The Deal
            </h2>
            <ul
              style={{
                margin: 0,
                padding: '0 0 0 1.2rem',
                color: 'var(--color-text-muted)',
                fontSize: '0.9rem',
                lineHeight: 1.7,
              }}
            >
              <li>
                You receive <strong className="text-gold">100 ₪</strong> immediately.
              </li>
              <li>
                An embarrassing fact about you is <strong style={{ color: 'var(--color-red)' }}>publicly posted</strong> to your profile.
              </li>
              <li>
                You can do this a maximum of <strong>{BANK_LIMIT} times</strong> ever.
              </li>
            </ul>

            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <span className="text-muted" style={{ fontSize: '0.82rem' }}>
                  Requests used:{' '}
                </span>
                <span style={{ fontWeight: 700 }}>
                  {requestsUsed} / {BANK_LIMIT}
                </span>
                {/* dots */}
                <span style={{ marginLeft: '0.5rem' }}>
                  {Array.from({ length: BANK_LIMIT }).map((_, i) => (
                    <span
                      key={i}
                      style={{
                        display: 'inline-block',
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: i < requestsUsed ? 'var(--color-red)' : 'var(--color-border)',
                        marginRight: '3px',
                      }}
                    />
                  ))}
                </span>
              </div>

              <button
                className="btn btn-gold animate-pulse-gold"
                onClick={handleRequest}
                disabled={!canRequest || requesting}
              >
                {requesting
                  ? 'Processing…'
                  : !canRequest
                    ? 'No requests remaining'
                    : 'Request 100 ₪'}
              </button>
            </div>

            {!canRequest && (
              <p style={{ margin: '0.75rem 0 0', fontSize: '0.85rem', color: 'var(--color-red)' }}>
                You've used all {BANK_LIMIT} lifetime requests. Manage your shekels wisely.
              </p>
            )}
          </div>

          {/* Reveal card */}
          {revealed && (
            <div
              className="card animate-fade-up"
              style={{
                border: '1px solid rgba(255,87,87,0.4)',
                background: 'rgba(255,87,87,0.07)',
              }}
            >
              <h3
                style={{ margin: '0 0 0.6rem', color: 'var(--color-red)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}
              >
                📢 Now Public on Your Profile
              </h3>
              <p style={{ margin: 0, fontWeight: 600, fontSize: '1rem', lineHeight: 1.5 }}>
                😬 {revealed}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
