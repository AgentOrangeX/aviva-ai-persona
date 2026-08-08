import { Router } from 'express';
import db from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { PERSONAS } from '../lib/personas.js';
import { computePathwayStatus } from '../lib/pathway.js';
import { buildRecommendations } from '../lib/recommendations.js';

const router = Router();
router.use(requireAuth);

// GET /api/pathway — auth required. A user with no saved result has no
// evidence to gate levels on yet, so this returns the framework itself
// (so it can still be shown, published, with nothing achieved) rather
// than an error.
router.get('/', (req, res) => {
  const latest = db
    .prepare('SELECT * FROM results WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 1')
    .get(req.user.sub);

  if (!latest) {
    const status = computePathwayStatus({ champScore: 0, journeyPct: 0 });
    return res.json({ hasResult: false, champScore: 0, journeyPct: 0, ...status, recommendations: [] });
  }

  const persona = PERSONAS[latest.persona];
  const completedStepIndices = db
    .prepare('SELECT step_index FROM journey_progress WHERE user_id = ? AND persona_key = ?')
    .all(req.user.sub, latest.persona)
    .map((r) => r.step_index);

  const journeyPct = persona.journey.length
    ? Math.round((completedStepIndices.length / persona.journey.length) * 100)
    : 0;

  const status = computePathwayStatus({ champScore: latest.champ_score, journeyPct });

  res.json({
    hasResult: true,
    resultId: latest.id,
    champScore: latest.champ_score,
    journeyPct,
    completedSteps: completedStepIndices.length,
    totalSteps: persona.journey.length,
    personaKey: latest.persona,
    personaName: persona.name,
    personaEmoji: persona.emoji,
    ...status,
    // Same engine PER-009 uses for "what's next" — the concrete activities
    // that would actually move champScore/journeyPct toward the next
    // level's thresholds, not a second, divergent recommendation list.
    recommendations: buildRecommendations({ personaKey: latest.persona, completedStepIndices }).slice(0, 3),
  });
});

export default router;
