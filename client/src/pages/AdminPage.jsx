import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

function heatColor(v) {
  // 0 -> pale, 100 -> strong Aviva blue/green blend
  const t = Math.max(0, Math.min(100, v)) / 100;
  const r = Math.round(231 + (23 - 231) * t);
  const g = Math.round(227 + (111 - 227) * t);
  const b = Math.round(216 + (193 - 216) * t);
  return `rgb(${r},${g},${b})`;
}

export default function AdminPage() {
  const [overview, setOverview] = useState(null);
  const [distribution, setDistribution] = useState(null);
  const [heatmap, setHeatmap] = useState(null);
  const [champions, setChampions] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.adminOverview(), api.adminDistribution(), api.adminHeatmap(), api.adminChampions()])
      .then(([o, d, h, c]) => {
        setOverview(o);
        setDistribution(d);
        setHeatmap(h);
        setChampions(c.champions);
      })
      .catch((e) => setError(e.message));
  }, []);

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
        <h3>Persona distribution</h3>
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
        <h3>AI maturity by business area</h3>
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
