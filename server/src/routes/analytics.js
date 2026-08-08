import { Router } from 'express';
import db from '../db/index.js';
import { isValidEventType, isValidQuestionIndex } from '../lib/analytics.js';

const router = Router();

// POST /api/analytics/event — open to everyone, including anonymous quiz
// takers. Deliberately accepts no free-text fields and no PII: visitorId
// and attemptId are opaque client-generated ids, and business_area is
// pulled from the logged-in user's own profile server-side (never trusted
// from the request body) so it can't be spoofed.
router.post('/event', (req, res) => {
  const { visitorId, attemptId, eventType, questionIndex } = req.body || {};

  if (typeof visitorId !== 'string' || !visitorId || visitorId.length > 64) {
    return res.status(400).json({ error: 'Invalid visitorId.' });
  }
  if (typeof attemptId !== 'string' || !attemptId || attemptId.length > 64) {
    return res.status(400).json({ error: 'Invalid attemptId.' });
  }
  if (!isValidEventType(eventType)) {
    return res.status(400).json({ error: "eventType must be 'start', 'step', or 'complete'." });
  }
  let qIndex = null;
  if (eventType === 'step') {
    if (!isValidQuestionIndex(questionIndex)) {
      return res.status(400).json({ error: 'Invalid questionIndex for a step event.' });
    }
    qIndex = questionIndex;
  }

  let businessArea = null;
  if (req.user) {
    const row = db.prepare('SELECT business_area FROM users WHERE id = ?').get(req.user.sub);
    businessArea = row?.business_area || null;
  }

  db.prepare(
    `INSERT INTO quiz_events (visitor_id, attempt_id, user_id, business_area, event_type, question_index)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(visitorId, attemptId, req.user?.sub || null, businessArea, eventType, qIndex);

  res.status(201).json({ ok: true });
});

export default router;
