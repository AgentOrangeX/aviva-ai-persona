import { useLocation, Link, useNavigate } from 'react-router-dom';
import { PersonaArt, COLORS } from '../components/PersonaArt.jsx';

const DIM_LABELS = {
  curiosity: 'Curiosity',
  influence: 'Influence',
  innovation: 'Innovation',
  technical: 'Technical capability',
  strategy: 'Strategic thinking',
  change: 'Change leadership',
  customer: 'Customer focus',
};
const DIM_KEYS = Object.keys(DIM_LABELS);

export default function ComparePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { before, after } = location.state || {};

  if (!before || !after) {
    return (
      <div className="wrap">
        <div className="center-msg">
          <p>Pick two saved results to compare from your results history.</p>
          <Link to="/my-results" className="btn" style={{ marginTop: 16 }}>My results →</Link>
        </div>
      </div>
    );
  }

  const beforeDate = new Date(before.createdAt).toLocaleDateString();
  const afterDate = new Date(after.createdAt).toLocaleDateString();
  const personaChanged = before.persona.key !== after.persona.key;
  const champDelta = after.champScore - before.champScore;

  return (
    <div className="wrap">
      <div className="admin-head">
        <h1>Comparing your results</h1>
        <p>{beforeDate} → {afterDate}</p>
      </div>

      <div className="admin-flash ok" style={{ fontWeight: 500 }}>
        This comparison is developmental, not a performance rating. It's here to help you notice
        your own growth over time — not to judge or rank you against anyone else.
      </div>

      <div className="panel">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, flexWrap: 'wrap', textAlign: 'center' }}>
          <div>
            <PersonaArt persona={before.persona.key} size={64} />
            <div style={{ marginTop: 8, fontWeight: 800 }}>{before.persona.emoji} {before.persona.name}</div>
            <div className="usub">{beforeDate}</div>
          </div>
          <div style={{ fontSize: '1.8rem', color: 'var(--ink-soft)' }}>→</div>
          <div>
            <PersonaArt persona={after.persona.key} size={64} />
            <div style={{ marginTop: 8, fontWeight: 800 }}>{after.persona.emoji} {after.persona.name}</div>
            <div className="usub">{afterDate}</div>
          </div>
        </div>

        {personaChanged && (
          <p style={{ textAlign: 'center', marginTop: 16, color: 'var(--ink-soft)' }}>
            Your matched persona shifted from <b>{before.persona.name}</b> to <b>{after.persona.name}</b> —
            that's a reflection of how you answered this time, not a step up or down.
          </p>
        )}

        <div className="stat-row" style={{ marginTop: 20 }}>
          <div className="stat">
            <b>{before.champScore}</b>
            <span>Champion score then</span>
          </div>
          <div className="stat">
            <b style={{ color: champDelta > 0 ? 'var(--green-d)' : champDelta < 0 ? '#a02020' : undefined }}>
              {champDelta > 0 ? '+' : ''}{champDelta}
            </b>
            <span>Change</span>
          </div>
          <div className="stat">
            <b>{after.champScore}</b>
            <span>Champion score now</span>
          </div>
        </div>
      </div>

      <div className="panel">
        <h3><span className="ic" style={{ background: '#176FC1' }}>≡</span> Dimension-level change</h3>
        {DIM_KEYS.map((key) => {
          const from = before.dimPct[key] ?? 0;
          const to = after.dimPct[key] ?? 0;
          const delta = to - from;
          return (
            <div className="dim-row" key={key}>
              <span className="lab">{DIM_LABELS[key]}</span>
              <div className="dim-bar"><i style={{ width: `${to}%`, background: COLORS[after.persona.key]?.[0] || '#176FC1' }} /></div>
              <span className="val" style={{ minWidth: 90, textAlign: 'right' }}>
                {from} → {to}{' '}
                <span style={{ color: delta > 0 ? 'var(--green-d)' : delta < 0 ? '#a02020' : 'var(--ink-soft)', fontWeight: 800 }}>
                  ({delta > 0 ? '+' : ''}{delta})
                </span>
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ textAlign: 'center', margin: '30px 0 60px', display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button className="btn outline" onClick={() => navigate('/my-results')}>← Back to my results</button>
        <Link to="/quiz" className="btn">↻ Take it again</Link>
      </div>
    </div>
  );
}
