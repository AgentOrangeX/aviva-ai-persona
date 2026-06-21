import { Router } from 'express';
import db from '../db/index.js';
import { QUESTIONS } from '../lib/questions.js';
import { scoreAnswers, DIM_KEYS } from '../lib/scoring.js';
import { PERSONAS } from '../lib/personas.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/** Server-side achievement derivation so they cannot be spoofed by the client. */
function deriveAchievements(scored) {
  const dp = scored.dimPct;
  const out = ['finisher'];
  if (scored.rare) out.push('rare');
  if (DIM_KEYS.filter((k) => dp[k] >= 70).length >= 3) out.push('balanced');
  if (dp.curiosity >= 90) out.push('curious');
  const top = [...DIM_KEYS].sort((a, b) => dp[b] - dp[a])[0];
  if (top === 'customer') out.push('customer');
  if (scored.champ >= 55) out.push('champion');
  return out;
}

function validateAnswers(answers) {
  if (!Array.isArray(answers)) return 'Answers must be an array.';
  const ids = new Set();
  for (const a of answers) {
    if (typeof a?.questionId !== 'number' || typeof a?.optionIndex !== 'number') {
      return 'Each answer needs a numeric questionId and optionIndex.';
    }
    const q = QUESTIONS.find((x) => x.id === a.questionId);
    if (!q) return `Unknown questionId: ${a.questionId}.`;
    if (a.optionIndex < 0 || a.optionIndex >= q.options.length) {
      return `Invalid optionIndex for question ${a.questionId}.`;
    }
    ids.add(a.questionId);
  }
  if (ids.size !== QUESTIONS.length) {
    return `Expected ${QUESTIONS.length} answers, received ${ids.size}.`;
  }
  return null;
}

function enrich(scored, achievements) {
  const persona = PERSONAS[scored.winner];
  const runnerUp = PERSONAS[scored.runnerUp];
  return {
    persona: { key: scored.winner, ...persona },
    runnerUp: { key: scored.runnerUp, name: runnerUp.name, emoji: runnerUp.emoji },
    dimPct: scored.dimPct,
    rare: scored.rare,
    champScore: scored.champ,
    achievements,
  };
}

// POST /api/results/score — open to all; computes a result but does NOT save.
router.post('/score', (req, res) => {
  const { answers } = req.body || {};
  const err = validateAnswers(answers);
  if (err) return res.status(400).json({ error: err });

  const scored = scoreAnswers(answers, QUESTIONS);
  const achievements = deriveAchievements(scored);
  res.json({ result: enrich(scored, achievements), saved: false });
});

// POST /api/results — requires login; scores AND persists.
router.post('/', requireAuth, (req, res) => {
  const { answers } = req.body || {};
  const err = validateAnswers(answers);
  if (err) return res.status(400).json({ error: err });

  const scored = scoreAnswers(answers, QUESTIONS);
  const achievements = deriveAchievements(scored);

  const info = db
    .prepare(
      `INSERT INTO results
        (user_id, persona, runner_up, rare, champ_score, dim_json, answers_json, achievements)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      req.user.sub,
      scored.winner,
      scored.runnerUp,
      scored.rare ? 1 : 0,
      scored.champ,
      JSON.stringify(scored.dimPct),
      JSON.stringify(answers),
      JSON.stringify(achievements)
    );

  res.status(201).json({
    result: enrich(scored, achievements),
    saved: true,
    resultId: info.lastInsertRowid,
  });
});

// GET /api/results/mine — current user's saved results, newest first.
router.get('/mine', requireAuth, (req, res) => {
  const rows = db
    .prepare('SELECT * FROM results WHERE user_id = ? ORDER BY created_at DESC')
    .all(req.user.sub);
  const results = rows.map((r) => {
    const scored = {
      winner: r.persona,
      runnerUp: r.runner_up,
      dimPct: JSON.parse(r.dim_json),
      rare: !!r.rare,
      champ: r.champ_score,
    };
    return {
      id: r.id,
      createdAt: r.created_at,
      ...enrich(scored, JSON.parse(r.achievements)),
    };
  });
  res.json({ results });
});

export default router;
