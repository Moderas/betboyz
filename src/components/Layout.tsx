import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Mascot from './Mascot';
import StickyPostSidebar from './StickyPostSidebar';
import { useEffect } from 'react';

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

  useEffect(() => {
    trackPageVisit(location.pathname);
  }, [location.pathname]);

  // If the stored session pre-dates the balance field, fetch it once
  useEffect(() => {
    if (session && (session.balance === undefined || session.balance === null)) {
      fetch(`/api/players/${session.username}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.player?.balance !== undefined) updateBalance(d.player.balance);
        })
        .catch(() => null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.username]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
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
