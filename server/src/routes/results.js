import { Router } from 'express';
import db from '../db/index.js';
import { QUESTIONS } from '../lib/questions.js';
import { scoreAnswers } from '../lib/scoring.js';
import { PERSONAS } from '../lib/personas.js';
import { requireAuth } from '../middleware/auth.js';
import { publishedResourcesForPersona } from '../lib/learningResources.js';
import { deriveAchievements, achievementProgress } from '../lib/achievements.js';

const router = Router();

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
    // Full catalogue with published criteria + progress toward each locked
    // one (PER-007) — the client no longer needs its own copy of the
    // thresholds, so there's exactly one place these can drift from reality.
    achievementProgress: achievementProgress(scored),
    // Admin-curated additions (PER-034) — separate from the static
    // `persona.journey` content above, which stays hand-authored in code.
    // This can change without a deploy, so we look it up fresh every time
    // rather than baking it into the PERSONAS object.
    learningResources: publishedResourcesForPersona(scored.winner),
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

function rowToResult(r) {
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
}

// GET /api/results/mine — current user's saved results, newest first.
router.get('/mine', requireAuth, (req, res) => {
  const rows = db
    .prepare('SELECT * FROM results WHERE user_id = ? ORDER BY created_at DESC')
    .all(req.user.sub);
  res.json({ results: rows.map(rowToResult) });
});

// GET /api/results/leaderboard — top 20 by champion score, counting only
// each user's FIRST assessment (retakes are excluded). Also returns the
// requesting user's own rank, even if they fall outside the top 20.
router.get('/leaderboard', requireAuth, (req, res) => {
  // One row per user: their earliest result (lowest id = first taken).
  const firstResults = db
    .prepare(
      `SELECT r.user_id, r.persona, r.champ_score, r.rare, r.created_at, u.name
         FROM results r
         JOIN (SELECT user_id, MIN(id) AS first_id FROM results GROUP BY user_id) f
           ON r.id = f.first_id
         JOIN users u ON u.id = r.user_id
        ORDER BY r.champ_score DESC, r.created_at ASC`
    )
    .all();

  // Assign dense ranks (ties share a rank).
  const ranked = firstResults.map((row, i) => ({ ...row, rank: i + 1 }));

  const top = ranked.slice(0, 20).map((r) => ({
    rank: r.rank,
    name: r.name,
    persona: r.persona,
    personaName: PERSONAS[r.persona]?.name,
    personaEmoji: PERSONAS[r.persona]?.emoji,
    champScore: r.champ_score,
    rare: !!r.rare,
    isMe: r.user_id === req.user.sub,
  }));

  // The requesting user's own standing (based on their first result).
  const mine = ranked.find((r) => r.user_id === req.user.sub);
  const me = mine
    ? {
        rank: mine.rank,
        total: ranked.length,
        champScore: mine.champ_score,
        persona: mine.persona,
        personaName: PERSONAS[mine.persona]?.name,
        personaEmoji: PERSONAS[mine.persona]?.emoji,
        inTop: mine.rank <= 20,
      }
    : null;

  res.json({ leaderboard: top, me, totalRanked: ranked.length });
});

// GET /api/results/:id — a single saved result, scoped to its owner. This
// gives reminders (PER-008) and any other "come back to this" link a
// stable URL to point at, rather than relying on React Router state that
// only exists mid-session. Registered last so it never shadows the literal
// routes above ('mine', 'leaderboard') — Express matches route patterns in
// registration order, and '/:id' would otherwise swallow both.
router.get('/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid result id.' });

  const row = db.prepare('SELECT * FROM results WHERE id = ?').get(id);
  if (!row || row.user_id !== req.user.sub) {
    // 404 rather than 403 — don't confirm to a caller that a given id
    // belongs to someone else.
    return res.status(404).json({ error: 'Result not found.' });
  }
  res.json({ result: rowToResult(row) });
});

export default router;
