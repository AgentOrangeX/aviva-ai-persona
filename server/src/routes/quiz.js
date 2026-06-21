import { Router } from 'express';
import { publicQuestions } from '../lib/questions.js';
import { DIMS } from '../lib/scoring.js';
import { PERSONAS } from '../lib/personas.js';

const router = Router();

// GET /api/quiz/questions — weights stripped; safe for anonymous use
router.get('/questions', (_req, res) => {
  res.json({ questions: publicQuestions(), dimensions: DIMS });
});

// GET /api/quiz/personas — content for previews (no scoring info)
router.get('/personas', (_req, res) => {
  res.json({ personas: PERSONAS });
});

export default router;
