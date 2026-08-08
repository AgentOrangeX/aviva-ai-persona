import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { PersonaArt } from '../components/PersonaArt.jsx';

export default function MyResultsPage() {
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [compareMode, setCompareMode] = useState(false);
  const [selected, setSelected] = useState([]); // up to 2 result ids
  const navigate = useNavigate();

  useEffect(() => {
    api.myResults().then((d) => setResults(d.results)).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="wrap"><div className="center-msg">{error}</div></div>;
  if (!results) return <div className="wrap"><div className="center-msg">Loading…</div></div>;

  function openResult(r) {
    // ResultPage renders the full detail (journey, careers, communities, etc.)
    // from router state — reuse it rather than duplicating the layout here.
    navigate('/result', { state: { result: r, saved: true, fromHistory: true } });
  }

  function toggleSelect(id) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id]; // keep it to the two most recently clicked
      return [...prev, id];
    });
  }

  function openCompare() {
    if (selected.length !== 2) return;
    const picked = results.filter((r) => selected.includes(r.id));
    // oldest first, so the comparison reads as "before → after"
    picked.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    navigate('/compare', { state: { before: picked[0], after: picked[1] } });
  }

  function handleRowClick(r) {
    if (compareMode) toggleSelect(r.id);
    else openResult(r);
  }

  return (
    <div className="wrap">
      <div className="admin-head">
        <h1>My results</h1>
        <p>Every persona snapshot you've saved, newest first. Select one to see the full breakdown and learning plan.</p>
      </div>

      {results.length >= 2 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginBottom: 8 }}>
          {compareMode && (
            <span className="progress-meta" style={{ alignSelf: 'center' }}>
              {selected.length === 0 ? 'Pick 2 results to compare' : selected.length === 1 ? 'Pick 1 more' : 'Ready to compare'}
            </span>
          )}
          <button
            className="btn outline sm"
            onClick={() => {
              setCompareMode((m) => !m);
              setSelected([]);
            }}
          >
            {compareMode ? 'Cancel' : '⇄ Compare results'}
          </button>
          {compareMode && (
            <button className="btn sm" disabled={selected.length !== 2} onClick={openCompare}>
              Compare selected
            </button>
          )}
        </div>
      )}

      {results.length === 0 ? (
        <div className="center-msg">
          <p>No saved results yet.</p>
          <Link to="/quiz" className="btn" style={{ marginTop: 16 }}>Take the quiz →</Link>
        </div>
      ) : (
        results.map((r) => {
          const isSelected = selected.includes(r.id);
          return (
            <button
              type="button"
              className="champ champ-link"
              key={r.id}
              onClick={() => handleRowClick(r)}
              style={compareMode && isSelected ? { outline: '2px solid var(--blue)', outlineOffset: 2 } : undefined}
            >
              {compareMode && (
                <span
                  aria-hidden="true"
                  style={{
                    width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                    border: '2px solid var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isSelected ? 'var(--blue)' : 'transparent', color: '#fff', fontSize: '.8rem', fontWeight: 800,
                  }}
                >
                  {isSelected ? '✓' : ''}
                </span>
              )}
              <PersonaArt persona={r.persona.key} size={52} />
              <div className="info">
                <b>{r.persona.emoji} {r.persona.name}</b>
                <span>{r.persona.title}</span>
                <span style={{ display: 'block' }}>{new Date(r.createdAt).toLocaleDateString()} · {r.rare ? 'Rare 💎' : 'Common'}</span>
              </div>
              <div className="score">
                <b>{r.champScore}</b>
                <span>Champion score</span>
              </div>
              {!compareMode && <span className="champ-chevron" aria-hidden="true">›</span>}
            </button>
          );
        })
      )}

      <div style={{ textAlign: 'center', margin: '30px 0 60px' }}>
        <Link to="/quiz" className="btn outline">↻ Take it again</Link>
      </div>
    </div>
  );
}
