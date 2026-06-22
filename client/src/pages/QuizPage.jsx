import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { useToast } from '../components/UI.jsx';

const TAG_CLASS = {
  Insurance: 'ins',
  Leadership: 'lead',
  Scenario: 'scn',
  Aviva: 'ins',
};

const STREAK_MSGS = ['Nice pace! 🔥', "You're flying ⚡", 'On a roll! 🎯', 'Unstoppable 🚀'];

export default function QuizPage() {
  const [questions, setQuestions] = useState(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [streak, setStreak] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    api
      .getQuestions()
      .then((d) => setQuestions(d.questions))
      .catch((e) => setError(e.message));
  }, []);

  const total = questions?.length || 0;
  const answeredCount = Object.keys(answers).length;
  const current = questions?.[idx];

  const finish = useCallback(
    async (finalAnswers) => {
      const payload = Object.entries(finalAnswers).map(([qid, optionIndex]) => ({
        questionId: Number(qid),
        optionIndex,
      }));
      try {
        if (user) {
          const { result } = await api.saveResult(payload);
          navigate('/result', { state: { result, saved: true } });
        } else {
          // Results are gated: send anonymous users to register, carrying their
          // answers so they're scored and saved the moment they have an account.
          navigate('/register', { state: { pendingAnswers: payload } });
        }
      } catch (e) {
        setError(e.message);
      }
    },
    [user, navigate]
  );

  const choose = useCallback(
    (optionIndex) => {
      if (!current) return;
      const next = { ...answers, [current.id]: optionIndex };
      setAnswers(next);

      // streak feedback when answering quickly in sequence
      const c = Object.keys(next).length;
      if (c >= 3 && c % 3 === 0) {
        const m = STREAK_MSGS[Math.min(STREAK_MSGS.length - 1, Math.floor(c / 6))];
        setStreak(m);
        setTimeout(() => setStreak(''), 1500);
      }

      if (idx + 1 < total) {
        setTimeout(() => setIdx(idx + 1), 180);
      } else {
        toast({ emoji: '🎉', title: 'All done!', detail: user ? 'Crunching your persona…' : 'Create an account to reveal your persona' });
        finish(next);
      }
    },
    [current, answers, idx, total, finish, toast, user]
  );

  // keyboard 1-4 to select, arrows to navigate
  useEffect(() => {
    function onKey(e) {
      if (!current) return;
      if (['1', '2', '3', '4'].includes(e.key)) {
        const i = Number(e.key) - 1;
        if (i < current.options.length) choose(i);
      } else if (e.key === 'ArrowLeft' && idx > 0) {
        setIdx(idx - 1);
      } else if (e.key === 'ArrowRight' && answers[current.id] !== undefined && idx + 1 < total) {
        setIdx(idx + 1);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, idx, total, answers, choose]);

  if (error) return <div className="wrap"><div className="center-msg">{error}</div></div>;
  if (!questions) return <div className="wrap"><div className="center-msg">Loading the quiz…</div></div>;

  const pct = Math.round((answeredCount / total) * 100);
  const tagClass = TAG_CLASS[current.tag] || '';

  return (
    <div className="wrap">
      <div className="quiz-head">
        <div className="progress-wrap">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="progress-meta">{idx + 1} / {total}</span>
        </div>
        <div className="streak">{streak}</div>
      </div>

      <div className="qcard" key={current.id}>
        <span className={`qtag ${tagClass}`}>{current.tag}</span>
        <h2>{current.text}</h2>
        <div className="opts" role="group" aria-label="Answer options">
          {current.options.map((o, i) => (
            <button
              key={i}
              className={`opt ${answers[current.id] === i ? 'chosen' : ''}`}
              onClick={() => choose(i)}
            >
              <span className="dot" />
              <span>{o.text}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="qnav">
        <button className="btn outline sm" onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0}>
          ← Back
        </button>
        <span className="progress-meta">Tip: press 1–4 to answer</span>
        <button
          className="btn sm"
          onClick={() => setIdx(Math.min(total - 1, idx + 1))}
          disabled={answers[current.id] === undefined || idx + 1 >= total}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
