import { Router } from 'express';
import db from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { PERSONAS } from '../lib/personas.js';
import { buildRecommendations } from '../lib/recommendations.js';

const router = Router();
router.use(requireAuth);

// GET /api/recommendations — based on the user's most recent persona
// result. Returns an empty list (not an error) for a user with no result
// yet, or one who has completed everything currently available — both are
// legitimate states the client renders distinct messaging for.
router.get('/', (req, res) => {
  const latest = db
    .prepare('SELECT * FROM results WHERE user_id = ? ORDER BY created_at DESC LIMIT 1')
    .get(req.user.sub);

  if (!latest) {
    return res.json({ recommendations: [], personaKey: null, resultId: null });
  }

  const completedStepIndices = db
    .prepare('SELECT step_index FROM journey_progress WHERE user_id = ? AND persona_key = ?')
    .all(req.user.sub, latest.persona)
    .map((r) => r.step_index);

  const persona = PERSONAS[latest.persona];
  const recommendations = buildRecommendations({ personaKey: latest.persona, completedStepIndices });

  res.json({
    recommendations,
    personaKey: latest.persona,
    personaName: persona.name,
    personaEmoji: persona.emoji,
    resultId: latest.id,
  });
});

export default router;
