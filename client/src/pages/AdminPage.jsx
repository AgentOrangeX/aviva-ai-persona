import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import LearningContentPanel from '../components/LearningContentPanel.jsx';

function heatColor(v) {
  // 0 -> pale, 100 -> strong Aviva blue/green blend
  const t = Math.max(0, Math.min(100, v)) / 100;
  const r = Math.round(231 + (23 - 231) * t);
  const g = Math.round(227 + (111 - 227) * t);
  const b = Math.round(216 + (193 - 216) * t);
  return `rgb(${r},${g},${b})`;
}

function describeAuditEntry(e) {
  switch (e.action) {
    case 'role_change':
      return <>{e.details.to === 'admin' ? 'Granted admin access to ' : 'Removed admin access from '}<b>{e.targetName}</b></>;
    case 'delete_first_result':
      return <>Deleted <b>{e.targetName}</b>'s first result</>;
    case 'resource_create':
      return <>Created learning resource <b>{e.targetName}</b></>;
    case 'resource_update':
      return <>Edited learning resource <b>{e.targetName}</b></>;
    case 'resource_status_change':
      return <>Set <b>{e.targetName}</b> to {e.details.to}</>;
    case 'resource_delete':
      return <>Deleted learning resource <b>{e.targetName}</b></>;
    default:
      return e.action;
  }
}

export default function AdminPage() {
  const { user: me } = useAuth();
  const [overview, setOverview] = useState(null);
  const [distribution, setDistribution] = useState(null);
  const [heatmap, setHeatmap] = useState(null);
  const [champions, setChampions] = useState(null);
  const [users, setUsers] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsArea, setAnalyticsArea] = useState('');
  const [auditLog, setAuditLog] = useState(null);
  const [exporting, setExporting] = useState('');
  const [confirmUser, setConfirmUser] = useState(null); // user pending deletion
  const [deleting, setDeleting] = useState(false);
  const [roleTarget, setRoleTarget] = useState(null); // { user, nextRole } pending confirmation
  const [changingRole, setChangingRole] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  function loadUsers() {
    api.adminUsers().then((u) => setUsers(u.users)).catch((e) => setError(e.message));
  }

  useEffect(() => {
    Promise.all([api.adminOverview(), api.adminDistribution(), api.adminHeatmap(), api.adminChampions()])
      .then(([o, d, h, c]) => {
        setOverview(o);
        setDistribution(d);
        setHeatmap(h);
        setChampions(c.champions);
      })
      .catch((e) => setError(e.message));
    loadUsers();
    api.adminAuditLog().then((r) => setAuditLog(r.entries)).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    api.adminAnalytics(analyticsArea || undefined).then(setAnalytics).catch((e) => setError(e.message));
  }, [analyticsArea]);

  async function handleExport(dataset, filename) {
    setExporting(dataset);
    setError('');
    try {
      await api.adminExportDataset(dataset, filename);
    } catch (e) {
      setError(e.message);
    } finally {
      setExporting('');
    }
  }

  function refreshAuditLog() {
    api.adminAuditLog().then((r) => setAuditLog(r.entries)).catch(() => {});
  }

  async function handleDelete() {
    if (!confirmUser) return;
    setDeleting(true);
    setNotice('');
    try {
      const out = await api.adminDeleteFirstResult(confirmUser.id);
      setNotice(
        `Deleted ${confirmUser.name}'s first result. ` +
          (out.remaining > 0
            ? `Their next result is now their leaderboard entry (${out.remaining} result${out.remaining === 1 ? '' : 's'} remaining).`
            : `They now have no results and have dropped off the leaderboard until they retake.`)
      );
      setConfirmUser(null);
      loadUsers();
      refreshAuditLog();
      // refresh headline + distribution so counts stay accurate
      api.adminOverview().then(setOverview).catch(() => {});
      api.adminDistribution().then(setDistribution).catch(() => {});
    } catch (e) {
      setError(e.message);
    } finally {
      setDeleting(false);
    }
  }

  async function handleRoleChange() {
    if (!roleTarget) return;
    setChangingRole(true);
    setNotice('');
    try {
      await api.adminSetUserRole(roleTarget.user.id, roleTarget.nextRole);
      setNotice(
        roleTarget.nextRole === 'admin'
          ? `${roleTarget.user.name} now has admin access.`
          : `${roleTarget.user.name}'s admin access has been removed.`
      );
      setRoleTarget(null);
      loadUsers();
      refreshAuditLog();
    } catch (e) {
      setError(e.message);
    } finally {
      setChangingRole(false);
    }
  }

  if (error) return <div className="wrap"><div className="center-msg">{error}</div></div>;
  if (!overview) return <div className="wrap"><div className="center-msg">Loading dashboard…</div></div>;

  const dimKeys = heatmap.dimensions.map((d) => d.key);

  return (
    <div className="wrap">
      <div className="admin-head">
        <h1>AI Persona — insights</h1>
        <p>Live cohort data across everyone who has completed the assessment.</p>
      </div>

      <div className="stat-row">
        <div className="stat"><b>{overview.totalUsers}</b><span>Registered users</span></div>
        <div className="stat"><b>{overview.assessedUsers}</b><span>Completed assessment</span></div>
        <div className="stat"><b>{overview.highPotentialChampions}</b><span>High-potential champions</span></div>
        <div className="stat"><b>{overview.rareResults}</b><span>Rare personas found</span></div>
      </div>

      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
          <h3>📊 Usage &amp; drop-off</h3>
          <button className="btn outline sm" disabled={exporting === 'analytics'} onClick={() => handleExport('analytics', 'usage-analytics.csv')}>
            {exporting === 'analytics' ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>
        <p className="admin-note">
          Quiz starts, completions and where people leave, tracked anonymously by browser —
          no individual is identified. Filter by business area to see that area's own
          completion rate; the breakdown table below is always organisation-wide.
        </p>

        <div className="field" style={{ maxWidth: 280, marginBottom: 16 }}>
          <label htmlFor="analytics-area">Filter headline stats by area</label>
          <select id="analytics-area" value={analyticsArea} onChange={(e) => setAnalyticsArea(e.target.value)}>
            <option value="">All areas</option>
            {analytics?.areas
              .filter((a) => !a.suppressed)
              .map((a) => (
                <option key={a.area} value={a.area}>{a.area}</option>
              ))}
          </select>
        </div>

        {!analytics ? (
          <p style={{ color: 'var(--ink-soft)' }}>Loading usage data…</p>
        ) : (
          <>
            <div className="stat-row">
              <div className="stat"><b>{analytics.starts}</b><span>Quiz starts</span></div>
              <div className="stat"><b>{analytics.completions}</b><span>Completions</span></div>
              <div className="stat"><b>{Math.round(analytics.completionRate * 100)}%</b><span>Completion rate</span></div>
              <div className="stat"><b>{analytics.repeatVisitors}</b><span>Repeat visitors</span></div>
            </div>

            <h4 style={{ margin: '18px 0 8px', fontSize: '.9rem' }}>Where people drop off</h4>
            {analytics.starts - analytics.completions === 0 ? (
              <p style={{ color: 'var(--ink-soft)' }}>No unfinished attempts — everyone who started has finished.</p>
            ) : (
              analytics.dropOff.map((d) => (
                <div className="dist-bar" key={d.key}>
                  <span className="lab">{d.label}</span>
                  <div className="track"><i style={{ width: `${d.pct}%`, background: 'linear-gradient(90deg, var(--yellow), var(--yellow-d))' }} /></div>
                  <span className="pct">{d.count}</span>
                </div>
              ))
            )}

            <h4 style={{ margin: '18px 0 8px', fontSize: '.9rem' }}>By business area</h4>
            <div className="utable-scroll">
              <table className="utable">
                <thead>
                  <tr>
                    <th>Area</th>
                    <th className="num">Starts</th>
                    <th className="num">Completion rate</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.areas.map((a) => (
                    <tr key={a.area}>
                      <td>{a.area}</td>
                      <td className="num">{a.starts}</td>
                      <td className="num">
                        {a.suppressed ? (
                          <span style={{ color: 'var(--ink-soft)' }} title="Fewer than 5 attempts — hidden to avoid identifying individuals">
                            Too small to show
                          </span>
                        ) : (
                          `${Math.round(a.completionRate * 100)}%`
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
          <h3>Persona distribution</h3>
          <button className="btn outline sm" disabled={exporting === 'distribution'} onClick={() => handleExport('distribution', 'persona-distribution.csv')}>
            {exporting === 'distribution' ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>
        {distribution.total === 0 ? (
          <p style={{ color: 'var(--ink-soft)' }}>No completed assessments yet.</p>
        ) : (
          distribution.distribution.map((d) => (
            <div className="dist-bar" key={d.key}>
              <span className="lab">{d.emoji} {d.name}</span>
              <div className="track"><i style={{ width: `${d.pct}%`, background: `linear-gradient(90deg, ${d.colors[0]}, ${d.colors[1]})` }} /></div>
              <span className="pct">{d.pct}%</span>
            </div>
          ))
        )}
      </div>

      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
          <h3>AI maturity by business area</h3>
          <button className="btn outline sm" disabled={exporting === 'heatmap'} onClick={() => handleExport('heatmap', 'maturity-heatmap.csv')}>
            {exporting === 'heatmap' ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>
        <p className="admin-note">
          Average dimension scores (0–100) for each business area, across all saved results.
          Useful for spotting where to focus enablement.
        </p>
        <div className="heat-scroll">
          <div className="heat" style={{ gridTemplateColumns: `140px repeat(${dimKeys.length}, 1fr)` }}>
            <div className="hl" />
            {heatmap.dimensions.map((d) => <div className="hh" key={d.key}>{d.label}</div>)}
            {heatmap.areas.map((area) => (
              <ReactFragmentRow key={area.area} area={area} dimKeys={dimKeys} />
            ))}
          </div>
        </div>
      </div>

      <div className="panel">
        <h3>🏆 High-potential champions</h3>
        <p className="admin-note">
          People most likely to drive AI adoption — ranked by champion-potential score
          (change leadership, influence, and strategic breadth).
        </p>
        {champions.length === 0 ? (
          <p style={{ color: 'var(--ink-soft)' }}>No champions identified yet.</p>
        ) : (
          champions.map((c, i) => (
            <div className="champ" key={i}>
              <span style={{ fontSize: '1.6rem' }}>{c.personaEmoji}</span>
              <div className="info">
                <b>{c.name}</b>
                <span>{c.jobTitle || '—'}{c.businessArea ? ` · ${c.businessArea}` : ''}</span>
                <span style={{ display: 'block' }}>{c.personaName}</span>
              </div>
              <div className="score"><b>{c.champScore}</b><span>Score</span></div>
            </div>
          ))
        )}
      </div>

      <div className="panel">
        <h3>👥 User management</h3>
        <p className="admin-note">
          Every registered user and their <strong>first result</strong> — the one that counts
          toward the leaderboard. Deleting it promotes their next-oldest result to the
          leaderboard; if they have none left, they drop off until they retake.
        </p>

        {notice && <div className="admin-flash ok">{notice}</div>}

        {!users ? (
          <p style={{ color: 'var(--ink-soft)' }}>Loading users…</p>
        ) : users.length === 0 ? (
          <p style={{ color: 'var(--ink-soft)' }}>No registered users yet.</p>
        ) : (
          <div className="utable-scroll">
            <table className="utable">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Business area</th>
                  <th>First result</th>
                  <th className="num">Results</th>
                  <th className="act">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <b>{u.name}</b>
                      {u.role === 'admin' && <span className="utag">admin</span>}
                      <span className="usub">{u.email}</span>
                    </td>
                    <td>{u.businessArea || '—'}</td>
                    <td>
                      {u.firstResult ? (
                        <span>
                          {u.firstResult.personaEmoji} {u.firstResult.personaName}
                          <span className="usub">
                            score {u.firstResult.champScore} ·{' '}
                            {new Date(u.firstResult.createdAt).toLocaleDateString()}
                          </span>
                        </span>
                      ) : (
                        <span style={{ color: 'var(--ink-soft)' }}>No result</span>
                      )}
                    </td>
                    <td className="num">{u.resultCount}</td>
                    <td className="act">
                      <button
                        className={u.role === 'admin' ? 'btn outline sm' : 'btn sm'}
                        disabled={u.id === me?.id}
                        title={u.id === me?.id ? "You can't remove your own admin access." : undefined}
                        onClick={() => {
                          setError('');
                          setNotice('');
                          setRoleTarget({ user: u, nextRole: u.role === 'admin' ? 'user' : 'admin' });
                        }}
                      >
                        {u.role === 'admin' ? 'Remove admin' : 'Make admin'}
                      </button>
                      <button
                        className="btn-danger sm"
                        disabled={!u.firstResult}
                        onClick={() => { setError(''); setNotice(''); setConfirmUser(u); }}
                      >
                        Delete first result
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <LearningContentPanel />

      <div className="panel">
        <h3>📋 Audit log</h3>
        <p className="admin-note">
          Every admin action, with who did it and when. Read-only — nothing here can be edited
          or deleted, including by admins.
        </p>
        {!auditLog ? (
          <p style={{ color: 'var(--ink-soft)' }}>Loading audit log…</p>
        ) : auditLog.length === 0 ? (
          <p style={{ color: 'var(--ink-soft)' }}>No admin actions recorded yet.</p>
        ) : (
          <div className="utable-scroll">
            <table className="utable">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Admin</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {auditLog.map((e) => (
                  <tr key={e.id}>
                    <td className="usub">{new Date(e.createdAt).toLocaleString()}</td>
                    <td>{e.adminName}</td>
                    <td>{describeAuditEntry(e)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {roleTarget && (
        <div className="modal-backdrop" onClick={() => !changingRole && setRoleTarget(null)}>
          <div className="modal" role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h3>{roleTarget.nextRole === 'admin' ? '⚠️ Grant admin access?' : '⚠️ Remove admin access?'}</h3>
            <p>
              {roleTarget.nextRole === 'admin' ? (
                <>
                  <strong>{roleTarget.user.name}</strong> will be able to view all user data, manage
                  every user's results, and grant or remove admin access for others.
                </>
              ) : (
                <>
                  <strong>{roleTarget.user.name}</strong> will lose access to the admin dashboard and
                  all admin-only actions immediately, even if they're currently signed in.
                </>
              )}
            </p>
            <div className="modal-actions">
              <button className="btn outline sm" disabled={changingRole} onClick={() => setRoleTarget(null)}>
                Cancel
              </button>
              <button
                className={roleTarget.nextRole === 'admin' ? 'btn sm' : 'btn-danger'}
                disabled={changingRole}
                onClick={handleRoleChange}
              >
                {changingRole ? 'Saving…' : roleTarget.nextRole === 'admin' ? 'Yes, make admin' : 'Yes, remove admin'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmUser && (
        <div className="modal-backdrop" onClick={() => !deleting && setConfirmUser(null)}>
          <div className="modal" role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h3>⚠️ Delete first result?</h3>
            <p>
              You are about to permanently delete <strong>{confirmUser.name}</strong>'s first
              result
              {confirmUser.firstResult && (
                <> ({confirmUser.firstResult.personaEmoji} {confirmUser.firstResult.personaName},
                {' '}score {confirmUser.firstResult.champScore})</>
              )}.
            </p>
            <p className="modal-warn">
              This is the result currently counting toward the leaderboard. It cannot be undone.
              {confirmUser.resultCount > 1
                ? ' Their next-oldest result will become their new leaderboard entry.'
                : ' They have no other results, so they will drop off the leaderboard until they retake the assessment.'}
            </p>
            <div className="modal-actions">
              <button className="btn outline sm" disabled={deleting} onClick={() => setConfirmUser(null)}>
                Cancel
              </button>
              <button className="btn-danger" disabled={deleting} onClick={handleDelete}>
                {deleting ? 'Deleting…' : 'Yes, delete it'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ height: 50 }} />
    </div>
  );
}

function ReactFragmentRow({ area, dimKeys }) {
  return (
    <>
      <div className="hl">{area.area} <span style={{ opacity: 0.6, marginLeft: 4 }}>({area.n})</span></div>
      {dimKeys.map((k) => {
        const v = area.values[k] || 0;
        return (
          <div className="cell" key={k} style={{ background: heatColor(v), color: v > 55 ? '#fff' : 'var(--ink)' }}>
            {v}
          </div>
        );
      })}
    </>
  );
}
