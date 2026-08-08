import { Router } from 'express';
import db from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { PERSONAS } from '../lib/personas.js';

const router = Router();
router.use(requireAuth);

function progressForUser(userId) {
  const rows = db
    .prepare('SELECT persona_key, step_index FROM journey_progress WHERE user_id = ?')
    .all(userId);
  const byPersona = {};
  for (const r of rows) {
    if (!byPersona[r.persona_key]) byPersona[r.persona_key] = [];
    byPersona[r.persona_key].push(r.step_index);
  }
  for (const key of Object.keys(byPersona)) byPersona[key].sort((a, b) => a - b);
  return byPersona;
}

// GET /api/progress — every persona journey the current user has made any
// progress on, as { personaKey: [completedStepIndex, ...] }. A persona with
// no progress simply doesn't appear as a key.
router.get('/', (req, res) => {
  res.json({ progress: progressForUser(req.user.sub) });
});

// POST /api/progress/toggle — flips one step between complete/incomplete
// for the current user. Persists server-side (not localStorage) so it
// follows the user across devices and sessions, not just this browser.
router.post('/toggle', (req, res) => {
  const { personaKey, stepIndex } = req.body || {};

  const persona = PERSONAS[personaKey];
  if (!persona) return res.status(400).json({ error: 'Unknown persona.' });
  if (!Number.isInteger(stepIndex) || stepIndex < 0 || stepIndex >= persona.journey.length) {
    return res.status(400).json({ error: 'Invalid step index for this persona.' });
  }

  const existing = db
    .prepare('SELECT id FROM journey_progress WHERE user_id = ? AND persona_key = ? AND step_index = ?')
    .get(req.user.sub, personaKey, stepIndex);

  let completed;
  if (existing) {
    db.prepare('DELETE FROM journey_progress WHERE id = ?').run(existing.id);
    completed = false;
  } else {
    db.prepare(
      'INSERT INTO journey_progress (user_id, persona_key, step_index) VALUES (?, ?, ?)'
    ).run(req.user.sub, personaKey, stepIndex);
    completed = true;
  }

  const completedSteps = progressForUser(req.user.sub)[personaKey] || [];
  res.json({ personaKey, stepIndex, completed, completedSteps });
});

export default router;
