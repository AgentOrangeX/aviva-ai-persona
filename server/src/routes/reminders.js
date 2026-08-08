import { Router } from 'express';
import db from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { PERSONAS } from '../lib/personas.js';

const router = Router();
router.use(requireAuth);

const FREQUENCY_MS = {
  weekly: 7 * 24 * 60 * 60 * 1000,
  biweekly: 14 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
};

// GET /api/reminders/status — the only real notification channel this app
// has today is itself: there is no email/SMS integration anywhere in the
// codebase, so "reminder" here means an in-app banner shown when the user
// is next active, not a scheduled outbound message. The chosen frequency
// still does real work: it throttles how often this endpoint reports a
// reminder as due, via reminders_last_shown_at.
router.get('/status', (req, res) => {
  const user = db
    .prepare('SELECT reminders_enabled, reminder_frequency, reminders_last_shown_at FROM users WHERE id = ?')
    .get(req.user.sub);

  if (!user.reminders_enabled) return res.json({ due: false });

  const latest = db
    .prepare('SELECT * FROM results WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 1')
    .get(req.user.sub);
  if (!latest) return res.json({ due: false }); // nothing to remind them about yet

  const persona = PERSONAS[latest.persona];
  const totalSteps = persona.journey.length;
  const completed = db
    .prepare('SELECT step_index FROM journey_progress WHERE user_id = ? AND persona_key = ?')
    .all(req.user.sub, latest.persona)
    .map((r) => r.step_index);

  if (completed.length >= totalSteps) return res.json({ due: false }); // journey already finished

  const nextStepIndex = [...Array(totalSteps).keys()].find((i) => !completed.includes(i));

  const interval = FREQUENCY_MS[user.reminder_frequency] || FREQUENCY_MS.weekly;
  const lastShown = user.reminders_last_shown_at ? new Date(user.reminders_last_shown_at).getTime() : null;
  const due = lastShown === null || Date.now() - lastShown >= interval;

  if (!due) return res.json({ due: false });

  db.prepare("UPDATE users SET reminders_last_shown_at = datetime('now') WHERE id = ?").run(req.user.sub);

  res.json({
    due: true,
    resultId: latest.id,
    personaKey: latest.persona,
    personaName: persona.name,
    personaEmoji: persona.emoji,
    stepIndex: nextStepIndex,
    stepTitle: persona.journey[nextStepIndex].title,
    completedCount: completed.length,
    totalSteps,
  });
});

export default router;
