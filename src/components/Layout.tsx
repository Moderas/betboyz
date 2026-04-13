import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Mascot from './Mascot';

export default function Layout() {
  const { session, logout } = useAuth();

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

      <main
        style={{
          flex: 1,
          maxWidth: '860px',
          width: '100%',
          margin: '0 auto',
          padding: '1.5rem 1rem',
        }}
      >
        <Outlet />
      </main>

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
