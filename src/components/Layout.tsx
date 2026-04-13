import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Mascot from './Mascot';
import StickyPostSidebar from './StickyPostSidebar';
import EffectOverlay from './EffectOverlay';
import BouncingBillion from './BouncingBillion';
import { useToast } from './Toast';
import { COLOR_SCHEME_VARS } from '../utils/shopItems';
import { ACTIVE_TOYS_EVENT } from '../utils/shopItems';
import { useEffect, useState, useRef } from 'react';
import type { EffectRecord } from '../types';

export const COLOR_SCHEME_EVENT = 'colorscheme:changed';

// All CSS variable keys that any color scheme can override
const SCHEME_VAR_KEYS = Object.keys(Object.values(COLOR_SCHEME_VARS)[0] ?? {});

function applyColorScheme(schemeId: string | null) {
  if (schemeId && COLOR_SCHEME_VARS[schemeId]) {
    for (const [k, v] of Object.entries(COLOR_SCHEME_VARS[schemeId])) {
      document.documentElement.style.setProperty(k, v);
    }
  } else {
    for (const k of SCHEME_VAR_KEYS) {
      document.documentElement.style.removeProperty(k);
    }
  }
}

function trackPageVisit(pathname: string) {
  const visited: string[] = JSON.parse(localStorage.getItem('betboyz:visited_pages') ?? '[]');
  let page: string | null = null;
  if (pathname === '/') page = 'home';
  else if (pathname.startsWith('/leaderboard')) page = 'leaderboard';
  else if (pathname.startsWith('/analytics')) page = 'analytics';
  else if (pathname.startsWith('/bank')) page = 'bank';
  else if (pathname.startsWith('/player/')) page = 'profile';
  else if (pathname.startsWith('/bet/')) page = 'bet';
  else if (pathname.startsWith('/create')) page = 'create';
  else if (pathname.startsWith('/shop')) page = 'shop';
  if (page && !visited.includes(page)) {
    visited.push(page);
    localStorage.setItem('betboyz:visited_pages', JSON.stringify(visited));
  }
}

export default function Layout() {
  const { session, logout, updateBalance } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const [colorSchemeId, setColorSchemeId] = useState<string | null>(null);
  const [activeEffects, setActiveEffects] = useState<EffectRecord[]>([]);
  const [activeToys, setActiveToys] = useState<string[]>([]);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    trackPageVisit(location.pathname);
  }, [location.pathname]);

  // Fetch player data on login: hydrate balance + apply color scheme + init activeToys
  useEffect(() => {
    if (!session) {
      setColorSchemeId(null);
      setActiveToys([]);
      return;
    }
    fetch(`/api/players/${session.username}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.player?.balance !== undefined) updateBalance(d.player.balance);
        setColorSchemeId(d.player?.equippedItems?.colorScheme ?? null);
        setActiveToys(d.player?.activeToys ?? []);
      })
      .catch(() => null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.username]);

  // Apply / remove color scheme CSS vars on the root element
  useEffect(() => {
    applyColorScheme(colorSchemeId);
  }, [colorSchemeId]);

  // Listen for scheme changes triggered by the Shop (buy / equip / unequip)
  useEffect(() => {
    const handler = (e: Event) => setColorSchemeId((e as CustomEvent<string | null>).detail);
    window.addEventListener(COLOR_SCHEME_EVENT, handler);
    return () => window.removeEventListener(COLOR_SCHEME_EVENT, handler);
  }, []);

  // Listen for active-toys changes triggered by the Shop (toggle / buy)
  useEffect(() => {
    const handler = (e: Event) => setActiveToys((e as CustomEvent<string[]>).detail);
    window.addEventListener(ACTIVE_TOYS_EVENT, handler);
    return () => window.removeEventListener(ACTIVE_TOYS_EVENT, handler);
  }, []);

  useEffect(() => {
    if (!session) return;

    let lastBalance = session.balance ?? 0;

    const runPoll = async () => {
      // Check effects
      try {
        const res = await fetch('/api/effects');
        if (res.ok) {
          const data = await res.json() as { effects: EffectRecord[] };
          setActiveEffects(data.effects ?? []);
        }
      } catch { /* silent */ }

      // Check balance for tax deductions
      try {
        const res = await fetch(`/api/players/${session.username}`);
        if (res.ok) {
          const d = await res.json();
          if (d.player?.balance !== undefined) {
            const newBalance = d.player.balance as number;
            if (newBalance < lastBalance) {
              const diff = lastBalance - newBalance;
              toast(`The Tax Man took ${diff.toLocaleString()} ₪ from you!`, 'error');
            }
            lastBalance = newBalance;
            updateBalance(newBalance);
          }
        }
      } catch { /* silent */ }
    };

    const schedule = () => {
      pollTimerRef.current = setTimeout(async () => {
        if (!document.hidden) {
          await runPoll();
        }
        schedule();
      }, 30_000);
    };

    // Run once immediately, then start the loop
    runPoll();
    schedule();

    const onVisibilityChange = () => {
      if (!document.hidden) {
        // Tab became visible — poll immediately
        runPoll();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.username]);

  const bouncingBillionActive = activeToys.includes('toy_bouncing_billion');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Global effect overlays */}
      <EffectOverlay effects={activeEffects} />
      {bouncingBillionActive && <BouncingBillion />}

      <header
        style={{
          background: 'var(--color-bg-card)',
          borderBottom: '1px solid var(--color-border)',
          padding: '0.75rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        {/* Brand */}
        <NavLink to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Mascot size={44} />
          <span
            className="font-display"
            style={{
              fontSize: '1.6rem',
              fontWeight: 900,
              color: 'var(--color-gold)',
              letterSpacing: '-0.01em',
            }}
          >
            BetBoyz
          </span>
        </NavLink>

        {/* Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' }}>
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            Bets
          </NavLink>
          <NavLink
            to="/leaderboard"
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            Leaderboard
          </NavLink>
          <NavLink
            to="/analytics"
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            Analytics
          </NavLink>
          {session ? (
            <>
              <NavLink
                to="/bank"
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                Bank
              </NavLink>

              {/* Balance chip */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.25rem 0.7rem',
                  borderRadius: '9999px',
                  background: 'rgba(245,200,66,0.12)',
                  border: '1px solid rgba(245,200,66,0.3)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: 'var(--color-gold)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {session.balance != null && session.balance !== undefined
                  ? `${(session.balance as number).toLocaleString()} ₪`
                  : '… ₪'}
              </div>

              {/* Shop button */}
              <button
                onClick={() => navigate('/shop')}
                className="btn btn-sm"
                style={{
                  background: 'rgba(74,158,255,0.15)',
                  border: '1px solid rgba(74,158,255,0.35)',
                  color: 'var(--color-blue)',
                  fontWeight: 700,
                }}
              >
                🛍️ Shop
              </button>

              <NavLink
                to={`/player/${session.username}`}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                style={{ color: 'var(--color-gold-dim)' }}
              >
                {session.username}
              </NavLink>
              <button onClick={logout} className="btn btn-outline btn-sm">
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                Login
              </NavLink>
              <NavLink to="/register">
                <button className="btn btn-gold btn-sm">Register</button>
              </NavLink>
            </>
          )}
        </nav>
      </header>

      {/* Body row — sidebar + content */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {session && <StickyPostSidebar />}
        <main style={{ flex: 1, padding: '1.5rem 1rem', minWidth: 0 }}>
          <div style={{ maxWidth: '860px', margin: '0 auto' }}>
            <Outlet />
          </div>
        </main>
      </div>

      <footer
        style={{
          textAlign: 'center',
          padding: '1rem',
          color: 'var(--color-text-muted)',
          fontSize: '0.78rem',
          borderTop: '1px solid var(--color-border)',
        }}
      >
        BetBoyz — shekels aren't real, but the shame is.
      </footer>
    </div>
  );
}
