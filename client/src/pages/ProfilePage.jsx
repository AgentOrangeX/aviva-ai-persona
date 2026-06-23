import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { useToast } from '../components/UI.jsx';

const BUSINESS_AREAS = [
  'Claims', 'Underwriting', 'Digital', 'Data & Analytics', 'Customer Operations',
  'Finance', 'People / HR', 'Technology', 'Marketing', 'Risk & Compliance', 'Other',
];

const PERSONA_NAMES = {
  explorer: 'Explorer', optimiser: 'Optimiser', collaborator: 'Collaborator',
  innovator: 'Innovator', builder: 'Builder', pathfinder: 'Pathfinder', catalyst: 'Catalyst',
};

export default function ProfilePage() {
  const { user, applyProfileUpdate } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState({ name: '', email: '', jobTitle: '', businessArea: '' });
  const [stats, setStats] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');

  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [savingPw, setSavingPw] = useState(false);
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    // Load fresh profile + stats from the server.
    api.me().then(({ user, stats }) => {
      setForm({
        name: user.name || '',
        email: user.email || '',
        jobTitle: user.jobTitle || '',
        businessArea: user.businessArea || '',
      });
      setStats(stats);
    }).catch((e) => setProfileError(e.message));
  }, []);

  const setField = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const setPwField = (k) => (e) => setPw({ ...pw, [k]: e.target.value });

  async function saveProfile() {
    setProfileError('');
    if (!form.name.trim()) return setProfileError('Your name cannot be empty.');
    if (!form.email.trim()) return setProfileError('A valid email is required.');
    setSavingProfile(true);
    try {
      const res = await api.updateProfile({
        name: form.name,
        email: form.email,
        jobTitle: form.jobTitle,
        businessArea: form.businessArea,
      });
      applyProfileUpdate(res);
      if (res.stats) setStats(res.stats);
      toast({ emoji: '✅', title: 'Profile updated' });
    } catch (e) {
      setProfileError(e.message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword() {
    setPwError('');
    if (pw.newPassword.length < 8) return setPwError('New password must be at least 8 characters.');
    if (pw.newPassword !== pw.confirm) return setPwError('New password and confirmation do not match.');
    setSavingPw(true);
    try {
      await api.changePassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
      toast({ emoji: '🔒', title: 'Password changed' });
    } catch (e) {
      setPwError(e.message);
    } finally {
      setSavingPw(false);
    }
  }

  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '—');

  return (
    <div className="wrap">
      <div className="admin-head">
        <h1>My profile</h1>
        <p>Update your details or change your password.</p>
      </div>

      {/* Account summary */}
      <div className="panel">
        <h3>Account</h3>
        <div className="profile-stats">
          <div className="pstat"><b>{fmtDate(stats?.joinedAt)}</b><span>Joined</span></div>
          <div className="pstat"><b>{stats?.resultCount ?? '—'}</b><span>Saved results</span></div>
          <div className="pstat">
            <b>{stats?.latestPersona ? `${PERSONA_NAMES[stats.latestPersona] || stats.latestPersona}` : '—'}</b>
            <span>Latest persona</span>
          </div>
        </div>
      </div>

      {/* Editable details */}
      <div className="panel">
        <h3>Your details</h3>
        {profileError && <div className="form-error">{profileError}</div>}
        <div className="field">
          <label htmlFor="name">Full name</label>
          <input id="name" value={form.name} onChange={setField('name')} autoComplete="name" />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={form.email} onChange={setField('email')} autoComplete="email" />
        </div>
        <div className="field">
          <label htmlFor="jobTitle">Job title</label>
          <input id="jobTitle" value={form.jobTitle} onChange={setField('jobTitle')} placeholder="e.g. Claims Analyst" />
        </div>
        <div className="field">
          <label htmlFor="businessArea">Business area</label>
          <select id="businessArea" value={form.businessArea} onChange={setField('businessArea')}>
            <option value="">Select…</option>
            {BUSINESS_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <button className="btn" onClick={saveProfile} disabled={savingProfile}>
          {savingProfile ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      {/* Change password */}
      <div className="panel">
        <h3>Change password</h3>
        {pwError && <div className="form-error">{pwError}</div>}
        <div className="field">
          <label htmlFor="currentPassword">Current password</label>
          <input id="currentPassword" type="password" value={pw.currentPassword} onChange={setPwField('currentPassword')} autoComplete="current-password" />
        </div>
        <div className="field">
          <label htmlFor="newPassword">New password <span style={{ fontWeight: 500, color: 'var(--ink-soft)' }}>(8+ characters)</span></label>
          <input id="newPassword" type="password" value={pw.newPassword} onChange={setPwField('newPassword')} autoComplete="new-password" />
        </div>
        <div className="field">
          <label htmlFor="confirm">Confirm new password</label>
          <input id="confirm" type="password" value={pw.confirm} onChange={setPwField('confirm')} autoComplete="new-password" />
        </div>
        <button className="btn outline" onClick={savePassword} disabled={savingPw}>
          {savingPw ? 'Updating…' : 'Update password'}
        </button>
      </div>

      <div style={{ height: 50 }} />
    </div>
  );
}
