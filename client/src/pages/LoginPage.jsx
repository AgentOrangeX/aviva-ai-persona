import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { api } from '../lib/api.js';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';
  const pendingAnswers = location.state?.pendingAnswers;

  async function submit() {
    setError('');
    setBusy(true);
    try {
      const user = await login(email, password);
      // If they came from the quiz, score + save their answers and show the result.
      if (Array.isArray(pendingAnswers) && pendingAnswers.length) {
        try {
          const { result } = await api.saveResult(pendingAnswers);
          navigate('/result', { replace: true, state: { result, saved: true } });
          return;
        } catch {
          navigate('/my-results', { replace: true });
          return;
        }
      }
      navigate(user.role === 'admin' ? '/admin' : from, { replace: true });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wrap">
      <div className="auth-card">
        <h1>Welcome back</h1>
        <p className="sub">
          {pendingAnswers
            ? 'Log in to reveal and save your AI Persona result.'
            : 'Log in to view and save your AI Persona results.'}
        </p>
        {error && <div className="form-error">{error}</div>}
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()} autoComplete="email" />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()} autoComplete="current-password" />
        </div>
        <button className="btn" style={{ width: '100%' }} onClick={submit} disabled={busy}>
          {busy ? 'Logging in…' : 'Log in'}
        </button>
        <p className="auth-foot">New here? <Link to="/register" state={pendingAnswers ? { pendingAnswers } : undefined}>Create an account</Link></p>
      </div>
    </div>
  );
}
