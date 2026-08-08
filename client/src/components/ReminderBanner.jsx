import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';

export default function ReminderBanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reminder, setReminder] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.getReminderStatus().then((r) => {
      if (r.due) setReminder(r);
    }).catch(() => {});
    // Re-check once per app load, not on every render — a fresh reminder
    // becoming due mid-session isn't worth polling for.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!reminder || dismissed) return null;

  return (
    <div className="reminder-banner">
      <span className="reminder-banner-text">
        {reminder.personaEmoji} You're {reminder.completedCount}/{reminder.totalSteps} through your{' '}
        <b>{reminder.personaName}</b> journey — next up: <b>{reminder.stepTitle}</b>
      </span>
      <div className="reminder-banner-actions">
        <button
          className="btn sm"
          onClick={() => navigate(`/result/${reminder.resultId}?step=${reminder.stepIndex}`)}
        >
          Continue →
        </button>
        <button className="reminder-banner-dismiss" aria-label="Dismiss" onClick={() => setDismissed(true)}>×</button>
      </div>
    </div>
  );
}
