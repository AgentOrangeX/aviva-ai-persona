import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { PersonaArt } from '../components/PersonaArt.jsx';

export default function MyResultsPage() {
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
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

  return (
    <div className="wrap">
      <div className="admin-head">
        <h1>My results</h1>
        <p>Every persona snapshot you've saved, newest first. Select one to see the full breakdown and learning plan.</p>
      </div>

      {results.length === 0 ? (
        <div className="center-msg">
          <p>No saved results yet.</p>
          <Link to="/quiz" className="btn" style={{ marginTop: 16 }}>Take the quiz →</Link>
        </div>
      ) : (
        results.map((r) => (
          <button
            type="button"
            className="champ champ-link"
            key={r.id}
            onClick={() => openResult(r)}
          >
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
            <span className="champ-chevron" aria-hidden="true">›</span>
          </button>
        ))
      )}

      <div style={{ textAlign: 'center', margin: '30px 0 60px' }}>
        <Link to="/quiz" className="btn outline">↻ Take it again</Link>
      </div>
    </div>
  );
}
