import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';

/**
 * ResultPage renders entirely from router state (`location.state.result`),
 * which only exists mid-session — there's no way to deep-link into it
 * directly. This route exists so a reminder (or anything else) can hand
 * out a real, stable URL: fetch the result by id, then forward into the
 * existing /result rendering with the same state shape it already expects.
 */
export default function ResultByIdPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const stepParam = searchParams.get('step');
    const highlightStep = stepParam !== null ? Number(stepParam) : undefined;

    api
      .getResult(id)
      .then((r) => {
        navigate('/result', {
          replace: true,
          state: { result: r.result, saved: true, fromHistory: true, highlightStep },
        });
      })
      .catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (error) {
    return (
      <div className="wrap">
        <div className="center-msg">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap">
      <div className="center-msg">Loading your result…</div>
    </div>
  );
}
