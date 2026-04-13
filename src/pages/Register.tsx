import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { registerSchema } from '../types/schemas';
import { useAuth } from '../context/AuthContext';
import Mascot from '../components/Mascot';
import type { z } from 'zod';

type FormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: FormValues) => {
    setServerError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: data.username, pin: data.pin }),
      });
      const text = await res.text();
      let json: { token?: string; username?: string; balance?: number; error?: string };
      try {
        json = JSON.parse(text);
      } catch {
        setServerError('API server is not running. Start it with: npm run dev');
        return;
      }
      if (!res.ok) {
        setServerError(json.error ?? 'Registration failed');
        return;
      }
      login(json.username, json.token);
      navigate('/');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg-primary)',
        padding: '1rem',
      }}
    >
      <div className="card animate-fade-up" style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <Mascot size={80} />
          </div>
          <h1
            className="font-display text-gold"
            style={{ fontSize: '2rem', fontWeight: 900, margin: 0 }}
          >
            Join BetBoyz
          </h1>
          <p className="text-muted" style={{ marginTop: '0.3rem', fontSize: '0.9rem' }}>
            You start with <span className="text-gold">500 ₪</span>. Spend wisely.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              {...register('username')}
              className={`input${errors.username ? ' error' : ''}`}
              placeholder="letters, numbers, underscores"
              autoComplete="username"
            />
            {errors.username && <p className="form-error">{errors.username.message}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">PIN (5 digits)</label>
            <input
              {...register('pin')}
              type="password"
              inputMode="numeric"
              maxLength={5}
              className={`input${errors.pin ? ' error' : ''}`}
              placeholder="e.g. 12345"
              autoComplete="new-password"
            />
            {errors.pin && <p className="form-error">{errors.pin.message}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Confirm PIN</label>
            <input
              {...register('confirmPin')}
              type="password"
              inputMode="numeric"
              maxLength={5}
              className={`input${errors.confirmPin ? ' error' : ''}`}
              placeholder="repeat PIN"
              autoComplete="new-password"
            />
            {errors.confirmPin && <p className="form-error">{errors.confirmPin.message}</p>}
          </div>

          {serverError && (
            <p
              className="form-error"
              style={{
                background: 'rgba(255,87,87,0.1)',
                border: '1px solid rgba(255,87,87,0.3)',
                borderRadius: '6px',
                padding: '0.5rem 0.75rem',
              }}
            >
              {serverError}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-gold"
            disabled={isSubmitting}
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            {isSubmitting ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p
          className="text-muted"
          style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.88rem' }}
        >
          Already in?{' '}
          <Link to="/login" style={{ color: 'var(--color-gold)', textDecoration: 'none' }}>
            Log in here
          </Link>
        </p>
      </div>
    </div>
  );
}
