import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { wagerSchema } from '../types/schemas';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { useToast } from '../components/Toast';
import type { BetRecord, WagerRecord } from '../types';
import type { z } from 'zod';


type WagerForm = z.infer<typeof wagerSchema>;

function fmt(n: number) {
  return n.toLocaleString();
}

function pct(part: number, total: number) {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}

export default function BetDetail() {
  const { id } = useParams<{ id: string }>();
  const { session, updateBalance } = useAuth();
  const { apiFetch } = useApi();
  const toast = useToast();

  const [bet, setBet] = useState<BetRecord | null>(null);
  const [wagers, setWagers] = useState<WagerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [closingOptionIdx, setClosingOptionIdx] = useState(0);
  const [closing, setClosing] = useState(false);
  const [nulling, setNulling] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<WagerForm>({
    resolver: zodResolver(wagerSchema),
    defaultValues: { optionIndex: 0, amount: 10 },
  });

  const selectedOption = watch('optionIndex');

  const fetchBet = async () => {
    try {
      const data = await fetch(`/api/bets/${id}`).then((r) => r.json());
      setBet(data.bet);
      setWagers(data.wagers ?? []);
    } finally {
      setLoading(false);
    }
  };

  // Get current player balance if logged in
  useEffect(() => {
    if (session) {
      fetch(`/api/players/${session.username}`)
        .then((r) => r.json())
        .then((d) => setBalance(d.player?.balance ?? null))
        .catch(() => null);
    }
  }, [session]);

  useEffect(() => {
    fetchBet();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const onWager = async (data: WagerForm) => {
    try {
      const result = await apiFetch<{ ok: boolean; balance: number }>('/api/bets/wager', {
        method: 'POST',
        body: JSON.stringify({ betId: id, ...data }),
      });
      setBalance(result.balance);
      updateBalance(result.balance);
      toast(`Wager placed! Balance: ${fmt(result.balance)} ₪`);
      await fetchBet();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to place wager', 'error');
    }
  };

  const onClose = async () => {
    if (!bet) return;
    setClosing(true);
    try {
      const result = await apiFetch<{ ok: boolean; payouts: Record<string, number> }>(
        '/api/bets/close',
        {
          method: 'POST',
          body: JSON.stringify({ betId: id, winningOptionIndex: closingOptionIdx }),
        },
      );
      const winner = bet.options[closingOptionIdx].label;
      const payoutCount = Object.keys(result.payouts).length;
      toast(`Bet closed! "${winner}" wins. ${payoutCount} player(s) paid out.`);
      await fetchBet();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to close bet', 'error');
    } finally {
      setClosing(false);
    }
  };

  const onNull = async () => {
    if (!bet || !window.confirm('Null this bet? All wagers will be refunded.')) return;
    setNulling(true);
    try {
      await apiFetch('/api/bets/null', {
        method: 'POST',
        body: JSON.stringify({ betId: id }),
      });
      toast('Bet nulled. All wagers refunded.');
      await fetchBet();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to null bet', 'error');
    } finally {
      setNulling(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div className="skeleton" style={{ height: '140px', borderRadius: '10px' }} />
        <div className="skeleton" style={{ height: '200px', borderRadius: '10px' }} />
      </div>
    );
  }

  if (!bet) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <p className="text-muted">Bet not found.</p>
        <Link to="/" style={{ color: 'var(--color-gold)' }}>
          ← Back to bets
        </Link>
      </div>
    );
  }

  const isCreator = session?.username === bet.creator;
  const isOpen = bet.status === 'open';
  const isNulled = bet.status === 'nulled';

  // Build payout preview for closed (non-nulled) bets
  let payouts: Record<string, number> = {};
  if (!isOpen && !isNulled && bet.winningOptionIndex !== null) {
    const winIdx = bet.winningOptionIndex;
    const winningWagers = wagers.filter((w) => w.optionIndex === winIdx);
    const winningTotal = winningWagers.reduce((s, w) => s + w.amount, 0);
    if (winningTotal > 0) {
      for (const w of winningWagers) {
        payouts[w.player] = (payouts[w.player] ?? 0) + Math.floor((w.amount / winningTotal) * bet.totalPool);
      }
    } else {
      for (const w of wagers) {
        payouts[w.player] = (payouts[w.player] ?? 0) + w.amount;
      }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <Link to="/" style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', textDecoration: 'none' }}>
        ← All Bets
      </Link>

      {/* Bet header */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <h1
            className="font-display"
            style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.3, flex: 1 }}
          >
            {bet.description}
          </h1>
          <span className={`badge ${isOpen ? 'badge-open' : isNulled ? 'badge-gold' : 'badge-closed'}`}>
            {isOpen ? 'Open' : isNulled ? 'Nulled' : 'Closed'}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            gap: '1.5rem',
            fontSize: '0.85rem',
            color: 'var(--color-text-muted)',
            flexWrap: 'wrap',
          }}
        >
          <span>
            By <Link to={`/player/${bet.creator}`} style={{ color: 'var(--color-gold-dim)', textDecoration: 'none' }}>{bet.creator}</Link>
          </span>
          {(bet.betType === 'over-under') && bet.overUnderLine !== null && (
            <span>
              Line: <strong className="text-gold">{bet.overUnderLine}</strong>
              <span className="text-muted"> (Over / Under)</span>
            </span>
          )}
          <span>Min bet: <strong className="text-gold">{fmt(bet.minimumBet)} ₪</strong></span>
          <span>Pool: <strong className="text-gold">{fmt(bet.totalPool)} ₪</strong></span>
          {!isOpen && bet.closedAt && (
            <span>{isNulled ? 'Nulled' : 'Closed'}: {new Date(bet.closedAt).toLocaleDateString()}</span>
          )}
        </div>
      </div>

      {/* Options with odds bars */}
      <div className="card">
        <h2
          style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}
        >
          Options
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {bet.options.map((opt, i) => {
            const isWinner = !isOpen && bet.winningOptionIndex === i;
            const isLoser = !isOpen && bet.winningOptionIndex !== null && bet.winningOptionIndex !== i;
            return (
              <div key={i}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.35rem',
                  }}
                >
                  <span
                    style={{
                      fontWeight: 600,
                      color: isWinner
                        ? 'var(--color-green)'
                        : isLoser
                          ? 'var(--color-text-muted)'
                          : 'var(--color-text-primary)',
                      fontSize: '0.95rem',
                    }}
                  >
                    {isWinner && '🏆 '}
                    {opt.label}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    <strong style={{ color: isWinner ? 'var(--color-green)' : 'var(--color-gold)' }}>
                      {fmt(opt.totalWagered)} ₪
                    </strong>{' '}
                    ({pct(opt.totalWagered, bet.totalPool)}%)
                  </span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${pct(opt.totalWagered, bet.totalPool)}%`,
                      background: isWinner
                        ? 'linear-gradient(90deg, var(--color-green-dim), var(--color-green))'
                        : isLoser
                          ? 'rgba(154,138,106,0.4)'
                          : undefined,
                    }}
                  />
                </div>
                {/* Who bet on this */}
                {wagers.filter((w) => w.optionIndex === i).length > 0 && (
                  <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                    {wagers
                      .filter((w) => w.optionIndex === i)
                      .map((w, wi) => (
                        <span
                          key={wi}
                          className="badge"
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            color: 'var(--color-text-muted)',
                            border: '1px solid var(--color-border)',
                            fontSize: '0.75rem',
                          }}
                        >
                          {w.player}: {fmt(w.amount)} ₪
                          {!isOpen && payouts[w.player] !== undefined && w.optionIndex === bet.winningOptionIndex && (
                            <span style={{ color: 'var(--color-green)', marginLeft: '0.3rem' }}>
                              → {fmt(payouts[w.player])} ₪
                            </span>
                          )}
                        </span>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Place wager (open bets, logged in) */}
      {isOpen && session && (
        <div className="card">
          <h2 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Place Your Wager
            {balance !== null && (
              <span style={{ fontWeight: 400, fontSize: '0.85rem', marginLeft: '0.75rem', color: 'var(--color-gold)' }}>
                Balance: {fmt(balance)} ₪
              </span>
            )}
          </h2>
          <form
            onSubmit={handleSubmit(onWager)}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <div className="form-group">
              <label className="form-label">Pick an option</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {bet.options.map((opt, i) => (
                  <label
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      cursor: 'pointer',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '7px',
                      border: `1px solid ${Number(selectedOption) === i ? 'var(--color-gold)' : 'var(--color-border)'}`,
                      background:
                        Number(selectedOption) === i ? 'rgba(245,200,66,0.07)' : 'transparent',
                      transition: 'all 0.15s',
                    }}
                  >
                    <input
                      type="radio"
                      value={i}
                      {...register('optionIndex', { valueAsNumber: true })}
                      style={{ accentColor: 'var(--color-gold)' }}
                    />
                    <span style={{ fontWeight: 500 }}>{opt.label}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                      {pct(opt.totalWagered, bet.totalPool)}%
                    </span>
                  </label>
                ))}
              </div>
              {errors.optionIndex && <p className="form-error">{errors.optionIndex.message}</p>}
            </div>

            <div className="form-group" style={{ maxWidth: '200px' }}>
              <label className="form-label">Amount (₪)</label>
              <input
                {...register('amount', { valueAsNumber: true })}
                type="number"
                min={bet.minimumBet}
                className={`input${errors.amount ? ' error' : ''}`}
                placeholder={String(bet.minimumBet)}
              />
              {errors.amount && <p className="form-error">{errors.amount.message}</p>}
            </div>

            <button type="submit" className="btn btn-gold" disabled={isSubmitting} style={{ alignSelf: 'flex-start' }}>
              {isSubmitting ? 'Placing…' : 'Place Wager'}
            </button>
          </form>
        </div>
      )}

      {/* Close / Null bet (creator only, open) */}
      {isOpen && isCreator && (
        <div className="card" style={{ border: '1px solid rgba(255,87,87,0.3)' }}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: 'var(--color-red)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Creator Actions
          </h2>
          {/* Close */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <select
              value={closingOptionIdx}
              onChange={(e) => setClosingOptionIdx(Number(e.target.value))}
              className="input"
              style={{ maxWidth: '280px' }}
            >
              {bet.options.map((opt, i) => (
                <option key={i} value={i}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span className="text-muted" style={{ fontSize: '0.85rem' }}>wins</span>
            <button
              className="btn btn-danger"
              onClick={onClose}
              disabled={closing || nulling}
            >
              {closing ? 'Closing…' : 'Close & Pay Out'}
            </button>
          </div>
          {/* Null */}
          <hr className="divider" style={{ margin: '0.5rem 0' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                <strong style={{ color: 'var(--color-text-primary)' }}>Null Bet</strong> — refunds all wagers, no winner declared.
                Still counts as a bet placed in analytics.
              </p>
            </div>
            <button
              className="btn btn-outline btn-sm"
              style={{ flexShrink: 0, borderColor: 'rgba(255,87,87,0.4)', color: 'var(--color-red)' }}
              onClick={onNull}
              disabled={nulling || closing}
            >
              {nulling ? 'Nulling…' : 'Null Bet'}
            </button>
          </div>
        </div>
      )}

      {/* Nulled notice */}
      {isNulled && (
        <div
          className="card"
          style={{
            border: '1px solid rgba(245,200,66,0.25)',
            background: 'rgba(245,200,66,0.04)',
            textAlign: 'center',
            padding: '1rem',
          }}
        >
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-gold-dim)' }}>
            ⚠️ This bet was nulled. All wagers were refunded.
          </p>
        </div>
      )}

      {/* Login prompt */}
      {isOpen && !session && (
        <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <p className="text-muted" style={{ margin: 0 }}>
            <Link to="/login" style={{ color: 'var(--color-gold)' }}>Log in</Link> to place a wager.
          </p>
        </div>
      )}
    </div>
  );
}
