import { useEffect, useState, createContext, useContext, useCallback } from 'react';
import { Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { PersonaArt } from './PersonaArt.jsx';

/* ---------- Top navigation bar ---------- */
export function TopBar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="topbar">
      <div className="row">
        <Link to="/" className="brand">
          <PersonaArt persona="catalyst" size={34} />
          <span>
            Aviva AI Persona
            <small>Discover how you bring AI to life</small>
          </span>
        </Link>
        <nav className="nav-actions">
          {user ? (
            <>
              <Link to="/my-results" className="ghost">My results</Link>
              {isAdmin && <Link to="/admin" className="ghost">Admin</Link>}
              <span className="who">{user.name.split(' ')[0]}</span>
              <button className="ghost" onClick={() => { logout(); navigate('/'); }}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="ghost">Log in</Link>
              <Link to="/register" className="ghost">Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

/* ---------- Toast system ---------- */
const ToastCtx = createContext(null);
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((toast) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { ...toast, id }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), toast.duration || 3600);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toast-zone" aria-live="polite">
        {toasts.map((t) => (
          <div className="toast" key={t.id}>
            {t.emoji && <span className="em">{t.emoji}</span>}
            <div>
              <div>{t.title}</div>
              {t.detail && <small>{t.detail}</small>}
            </div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
export function useToast() {
  return useContext(ToastCtx) || (() => {});
}

/* ---------- Confetti burst ---------- */
export function Confetti({ fire }) {
  const [pieces, setPieces] = useState([]);
  useEffect(() => {
    if (!fire) return;
    const colors = ['#176FC1', '#FCCA12', '#59C247', '#4F97D6', '#E0AE00'];
    const arr = Array.from({ length: 90 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      dur: 2.4 + Math.random() * 1.8,
      color: colors[i % colors.length],
      rot: Math.random() * 360,
    }));
    setPieces(arr);
    const t = setTimeout(() => setPieces([]), 4600);
    return () => clearTimeout(t);
  }, [fire]);
  if (!pieces.length) return null;
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p) => (
        <i
          key={p.id}
          style={{
            left: `${p.left}%`,
            background: p.color,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
            transform: `rotate(${p.rot}deg)`,
          }}
        />
      ))}
    </div>
  );
}

/* ---------- Route guards ---------- */
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="center-msg">Loading…</div>;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return children;
}

export function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <div className="center-msg">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <div className="center-msg">Administrator access only.</div>;
  return children;
}
