import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { PersonaArt } from '../components/PersonaArt.jsx';

function medal(rank) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return null;
}

export default function LeaderboardPage() {
  const [data, setData] = useState(null);
  const [groups, setGroups] = useState(null);
  const [businessArea, setBusinessArea] = useState('');
  const [businessFunction, setBusinessFunction] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.leaderboardGroups().then(setGroups).catch(() => {});
  }, []);

  useEffect(() => {
    setData(null);
    api.leaderboard({ businessArea, businessFunction }).then(setData).catch((e) => setError(e.message));
  }, [businessArea, businessFunction]);

  function onAreaChange(e) {
    setBusinessArea(e.target.value);
    setBusinessFunction(''); // a function from the old area may not apply to the new one
  }

  if (error) return <div className="wrap"><div className="center-msg">{error}</div></div>;
  if (!data) return <div className="wrap"><div className="center-msg">Loading the leaderboard…</div></div>;

  const functionOptions = businessArea ? groups?.functionsByArea?.[businessArea] || [] : [];
  const scopeLabel = businessFunction ? `${businessFunction} (${businessArea})` : businessArea || null;

  const { leaderboard, me } = data;

  return (
    <div className="wrap">
      <div className="admin-head">
        <h1>🏆 {scopeLabel ? `${scopeLabel} leaderboard` : 'Champion leaderboard'}</h1>
        <p>
          {scopeLabel
            ? `Top scores within ${scopeLabel}. Based on everyone's first assessment — retakes don't count.`
            : "The top 20 champion-potential scores across Aviva. Based on everyone's first assessment — retakes don't count, so it's a level field."}
        </p>
      </div>

      {groups && (groups.areas.length > 0) && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          <div className="field" style={{ maxWidth: 260, marginBottom: 0 }}>
            <label htmlFor="lb-area">Business area</label>
            <select id="lb-area" value={businessArea} onChange={onAreaChange}>
              <option value="">Everyone</option>
              {groups.areas.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          {businessArea && functionOptions.length > 0 && (
            <div className="field" style={{ maxWidth: 260, marginBottom: 0 }}>
              <label htmlFor="lb-function">Function</label>
              <select id="lb-function" value={businessFunction} onChange={(e) => setBusinessFunction(e.target.value)}>
                <option value="">All of {businessArea}</option>
                {functionOptions.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          )}
        </div>
      )}

      {data.suppressed ? (
        <div className="center-msg">
          <p>
            Not enough people in {scopeLabel} yet to show a leaderboard — we need at least{' '}
            {data.minCohortSize} to keep individual scores from being identifiable in such a small group.
          </p>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="center-msg">
          <p>No results on the board yet — be the first!</p>
          <Link to="/quiz" className="btn" style={{ marginTop: 16 }}>Take the quiz →</Link>
        </div>
      ) : (
        <div className="lb">
          {leaderboard.map((row) => (
            <div className={`lb-row${row.isMe ? ' lb-me' : ''}`} key={row.rank}>
              <span className="lb-rank">{medal(row.rank) || row.rank}</span>
              <PersonaArt persona={row.persona} size={40} />
              <div className="lb-info">
                <b>{row.name}{row.isMe && <span className="lb-youtag">You</span>}</b>
                <span>{row.personaEmoji} {row.personaName}{row.rare ? ' · Rare 💎' : ''}</span>
              </div>
              <div className="lb-score">
                <b>{row.champScore}</b>
                <span>Score</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Show the user's own standing if they're not already in the visible top 20 */}
      {!data.suppressed && me && !me.inTop && (
        <>
          <div className="lb-divider"><span>Your position</span></div>
          <div className="lb">
            <div className="lb-row lb-me">
              <span className="lb-rank">{me.rank}</span>
              <PersonaArt persona={me.persona} size={40} />
              <div className="lb-info">
                <b>You<span className="lb-youtag">You</span></b>
                <span>{me.personaEmoji} {me.personaName}</span>
              </div>
              <div className="lb-score">
                <b>{me.champScore}</b>
                <span>Score</span>
              </div>
            </div>
          </div>
          <p className="lb-foot">You're ranked {me.rank} of {me.total}. Keep building those AI champion skills!</p>
        </>
      )}

      {!data.suppressed && me && me.inTop && (
        <p className="lb-foot">You're in the top 20 — rank {me.rank} of {me.total}. 🎉</p>
      )}

      {!data.suppressed && !me && (
        <p className="lb-foot">Take the quiz to get on the board.</p>
      )}

      <div style={{ textAlign: 'center', margin: '24px 0 60px' }}>
        <Link to="/quiz" className="btn outline">Take the quiz →</Link>
      </div>
    </div>
  );
}
