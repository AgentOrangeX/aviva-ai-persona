import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';

export default function RecommendationsPanel() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    api.getRecommendations().then(setData).catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Fail quietly on the landing page — this is a nice-to-have digest, not
  // something that should ever block or clutter the hero with an error.
  if (!user || error || !data) return null;

  if (!data.personaKey) {
    return (
      <div className="panel reco-panel">
        <h3>📌 Recommended for you</h3>
        <p>Take the quiz to get personalised next steps.</p>
        <Link to="/quiz" className="btn sm" style={{ marginTop: 10 }}>Start the quiz →</Link>
      </div>
    );
  }

  if (data.recommendations.length === 0) {
    return (
      <div className="panel reco-panel">
        <h3>📌 Recommended for you</h3>
        <p>
          🎉 You're all caught up on your {data.personaEmoji} {data.personaName} journey.
          Check back after new content is published, or retake the assessment to see how you've grown.
        </p>
      </div>
    );
  }

  return (
    <div className="panel reco-panel">
      <h3>📌 Recommended for you</h3>
      <div className="reco-list">
        {data.recommendations.map((item, i) => (
          <RecoItem key={i} item={item} resultId={data.resultId} />
        ))}
      </div>
    </div>
  );
}

function RecoItem({ item, resultId }) {
  const navigate = useNavigate();
  const inner = (
    <>
      <b>{item.title}</b>
      <span className="reco-reason">{item.reason}</span>
    </>
  );

  if (item.type === 'journey_step') {
    return (
      <button type="button" className="reco-item" onClick={() => navigate(`/result/${resultId}?step=${item.stepIndex}`)}>
        {inner}
      </button>
    );
  }

  return (
    <a className="reco-item" href={item.url} target="_blank" rel="noopener noreferrer">
      {inner}
    </a>
  );
}
