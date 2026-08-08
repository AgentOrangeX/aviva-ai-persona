import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { api } from '../lib/api.js';

export default function PathwayPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.getPathway().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="wrap"><div className="center-msg">{error}</div></div>;
  if (!data) return <div className="wrap"><div className="center-msg">Loading…</div></div>;

  if (!data.hasResult) {
    return (
      <div className="wrap">
        <div className="admin-head">
          <h1>Your AI capability pathway</h1>
          <p>Five published levels, gated on evidence you can see — not a hidden score.</p>
        </div>
        <div className="center-msg">
          <p>Take the quiz first to see where you sit on the pathway.</p>
          <Link to="/quiz" className="btn" style={{ marginTop: 16 }}>Take the quiz →</Link>
        </div>
      </div>
    );
  }

  const { next } = data;

  return (
    <div className="wrap">
      <div className="admin-head">
        <h1>Your AI capability pathway</h1>
        <p>
          Every level below requires two things you can already see elsewhere in the app: your
          champion score and how much of your learning journey you've completed. Nothing hidden.
        </p>
      </div>

      <div className="panel">
        <h3>{data.personaEmoji} Level {data.currentLevel}: {data.currentLevelName}</h3>
        <div className="stat-row" style={{ marginTop: 10 }}>
          <div className="stat"><b>{data.champScore}</b><span>Champion score</span></div>
          <div className="stat"><b>{data.completedSteps}/{data.totalSteps}</b><span>Journey steps</span></div>
          <div className="stat"><b>{data.journeyPct}%</b><span>Journey complete</span></div>
        </div>
      </div>

      {next ? (
        <div className="panel">
          <h3>🎯 Next: Level {next.level} — {next.name}</h3>
          <p style={{ color: 'var(--ink-soft)' }}>{next.description}</p>
          <div className="stat-row" style={{ marginTop: 10 }}>
            <div className="stat">
              <b style={{ color: next.champGap === 0 ? 'var(--green-d)' : undefined }}>
                {next.champGap === 0 ? '✓ Met' : `+${next.champGap}`}
              </b>
              <span>Champion score needed ({next.minChamp}+)</span>
            </div>
            <div className="stat">
              <b style={{ color: next.journeyPctGap === 0 ? 'var(--green-d)' : undefined }}>
                {next.journeyPctGap === 0 ? '✓ Met' : `${next.journeyPctGap}% more`}
              </b>
              <span>Journey completion needed ({next.minJourneyPct}%+)</span>
            </div>
          </div>

          {data.recommendations.length > 0 && (
            <>
              <h4 style={{ margin: '18px 0 8px', fontSize: '.9rem' }}>Recommended activities to close the gap</h4>
              <div className="reco-list">
                {data.recommendations.map((item, i) => (
                  <button
                    type="button"
                    className="reco-item"
                    key={i}
                    onClick={() =>
                      item.type === 'journey_step'
                        ? navigate(`/result/${data.resultId}?step=${item.stepIndex}`)
                        : window.open(item.url, '_blank', 'noopener,noreferrer')
                    }
                  >
                    <b>{item.title}</b>
                    <span className="reco-reason">{item.reason}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="panel" style={{ textAlign: 'center' }}>
          <h3>🏆 You've reached the top of the pathway</h3>
          <p style={{ color: 'var(--ink-soft)' }}>
            Champion is the highest published level today. Retake the assessment periodically —
            your capability, and the pathway itself, may evolve.
          </p>
        </div>
      )}

      <div className="panel">
        <h3>All levels</h3>
        <div className="steps">
          {data.levels.map((lvl) => {
            const isCurrent = lvl.level === data.currentLevel;
            return (
              <div className="step" key={lvl.level} style={!lvl.achieved && !isCurrent ? { opacity: 0.6 } : undefined}>
                <span className="num" style={{ background: lvl.achieved ? 'var(--green)' : 'var(--blue)' }}>
                  {lvl.achieved ? '✓' : lvl.level}
                </span>
                <div className="body">
                  <b>
                    Level {lvl.level}: {lvl.name}
                    {isCurrent && <span className="utag" style={{ marginLeft: 8 }}>You are here</span>}
                  </b>
                  <p>{lvl.description}</p>
                  <span className="meta">Requires champion score {lvl.minChamp}+ and {lvl.minJourneyPct}%+ journey complete</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
