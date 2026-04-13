import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import CreateBet from './pages/CreateBet';
import BetDetail from './pages/BetDetail';
import Leaderboard from './pages/Leaderboard';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import Bank from './pages/Bank';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  return session ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/bet/:id" element={<BetDetail />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/player/:username" element={<Profile />} />
        <Route
          path="/create"
          element={
            <PrivateRoute>
              <CreateBet />
            </PrivateRoute>
          }
        />
        <Route
          path="/bank"
          element={
            <PrivateRoute>
              <Bank />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
