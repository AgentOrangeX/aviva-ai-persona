import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { api } from '../lib/api.js';

const BUSINESS_AREAS = [
  'Claims', 'Underwriting', 'Digital', 'Data & Analytics', 'Customer Operations',
  'Finance', 'People / HR', 'Technology', 'Marketing', 'Risk & Compliance', 'Other',
];

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', jobTitle: '', businessArea: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Raw answers carried over from the quiz (anonymous user finished, now registering).
  const pendingAnswers = location.state?.pendingAnswers;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit() {
    setError('');
    if (!form.name.trim()) return setError('Please enter your name.');
    if (!form.email.trim()) return setError('Please enter your email.');
    if (form.password.length < 8) return setError('Password must be at least 8 characters.');
    setBusy(true);
    try {
      await register(form);
      // If they came from the quiz, score + save their answers now and show the result.
      if (Array.isArray(pendingAnswers) && pendingAnswers.length) {
        try {
          const { result } = await api.saveResult(pendingAnswers);
          navigate('/result', { replace: true, state: { result, saved: true } });
          return;
        } catch {
          // saving failed for some reason — fall through to results history
          navigate('/my-results', { replace: true });
          return;
        }
      }
      navigate('/', { replace: true });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wrap">
      <div className="auth-card">
        <h1>Create your account</h1>
        <p className="sub">
          {pendingAnswers
            ? 'Your persona is ready! Create an account to reveal and keep your result.'
            : 'Save your persona, track progress, and unlock your learning journey.'}
        </p>
        {error && <div className="form-error">{error}</div>}
        <div className="field">
          <label htmlFor="name">Full name *</label>
          <input id="name" value={form.name} onChange={set('name')} autoComplete="name" />
        </div>
        <div className="field">
          <label htmlFor="email">Work email *</label>
          <input id="email" type="email" value={form.email} onChange={set('email')} autoComplete="email" />
        </div>
        <div className="field">
          <label htmlFor="password">Password * <span style={{ fontWeight: 500, color: 'var(--ink-soft)' }}>(8+ characters)</span></label>
          <input id="password" type="password" value={form.password} onChange={set('password')} autoComplete="new-password" />
        </div>
        <div className="field">
          <label htmlFor="jobTitle">Job title</label>
          <input id="jobTitle" value={form.jobTitle} onChange={set('jobTitle')} placeholder="e.g. Claims Analyst" />
        </div>
        <div className="field">
          <label htmlFor="businessArea">Business area</label>
          <select id="businessArea" value={form.businessArea} onChange={set('businessArea')}>
            <option value="">Select…</option>
            {BUSINESS_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <button className="btn" style={{ width: '100%' }} onClick={submit} disabled={busy}>
          {busy ? 'Creating…' : 'Create account'}
        </button>
        <p className="auth-foot">Already have an account? <Link to="/login" state={pendingAnswers ? { pendingAnswers } : undefined}>Log in</Link></p>
      </div>
    </div>
  );
}
