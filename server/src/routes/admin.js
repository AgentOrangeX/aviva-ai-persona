import { Router } from 'express';
import db from '../db/index.js';
import { requireAdmin } from '../middleware/auth.js';
import { PERSONA_KEYS } from '../lib/scoring.js';
import { DIMS, DIM_KEYS } from '../lib/scoring.js';
import { PERSONAS } from '../lib/personas.js';

const router = Router();
router.use(requireAdmin);

// GET /api/admin/overview — headline stats from real saved results.
router.get('/overview', (_req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) n FROM users').get().n;
  const totalResults = db.prepare('SELECT COUNT(DISTINCT user_id) n FROM results').get().n;
  const champions = db.prepare('SELECT COUNT(*) n FROM results WHERE champ_score >= 55').get().n;
  const rare = db.prepare('SELECT COUNT(*) n FROM results WHERE rare = 1').get().n;

  res.json({
    totalUsers,
    assessedUsers: totalResults,
    highPotentialChampions: champions,
    rareResults: rare,
  });
});

// GET /api/admin/distribution — persona counts across the latest result per user.
router.get('/distribution', (_req, res) => {
  // use each user's most recent result
  const rows = db
    .prepare(
      `SELECT persona, COUNT(*) n FROM (
         SELECT r.persona
         FROM results r
         JOIN (SELECT user_id, MAX(created_at) mx FROM results GROUP BY user_id) latest
           ON r.user_id = latest.user_id AND r.created_at = latest.mx
       ) GROUP BY persona`
    )
    .all();

  const counts = Object.fromEntries(PERSONA_KEYS.map((k) => [k, 0]));
  for (const r of rows) if (r.persona in counts) counts[r.persona] = r.n;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  res.json({
    total,
    distribution: PERSONA_KEYS.map((key) => ({
      key,
      name: PERSONAS[key].name,
      emoji: PERSONAS[key].emoji,
      colors: PERSONAS[key].colors,
      count: counts[key],
      pct: total ? Math.round((counts[key] / total) * 100) : 0,
    })),
  });
});

// GET /api/admin/heatmap — business area × dimension average maturity.
router.get('/heatmap', (_req, res) => {
  const rows = db
    .prepare(
      `SELECT u.business_area area, r.dim_json
       FROM results r JOIN users u ON u.id = r.user_id`
    )
    .all();

  const byArea = new Map();
  for (const row of rows) {
    const area = row.area && row.area.trim() ? row.area.trim() : 'Unspecified';
    if (!byArea.has(area)) byArea.set(area, { sums: Object.fromEntries(DIM_KEYS.map((k) => [k, 0])), n: 0 });
    const bucket = byArea.get(area);
    const dims = JSON.parse(row.dim_json);
    for (const k of DIM_KEYS) bucket.sums[k] += dims[k] || 0;
    bucket.n += 1;
  }

  const areas = [...byArea.entries()].map(([area, b]) => ({
    area,
    n: b.n,
    values: Object.fromEntries(DIM_KEYS.map((k) => [k, b.n ? Math.round(b.sums[k] / b.n) : 0])),
  }));

  res.json({ dimensions: DIMS, areas });
});

// GET /api/admin/champions — ranked high-potential people.
router.get('/champions', (_req, res) => {
  const rows = db
    .prepare(
      `SELECT r.champ_score, r.persona, r.created_at,
              u.name, u.job_title, u.business_area, u.email
       FROM results r JOIN users u ON u.id = r.user_id
       JOIN (SELECT user_id, MAX(created_at) mx FROM results GROUP BY user_id) latest
         ON r.user_id = latest.user_id AND r.created_at = latest.mx
       ORDER BY r.champ_score DESC
       LIMIT 25`
    )
    .all();

  res.json({
    champions: rows.map((r) => ({
      name: r.name,
      jobTitle: r.job_title,
      businessArea: r.business_area,
      persona: r.persona,
      personaName: PERSONAS[r.persona]?.name,
      personaEmoji: PERSONAS[r.persona]?.emoji,
      champScore: r.champ_score,
      assessedAt: r.created_at,
    })),
  });
});

// GET /api/admin/users — every user, with their FIRST result (the one that
// counts toward the leaderboard, identified by the lowest result id) and a
// total count of how many results they have saved.
router.get('/users', (_req, res) => {
  const rows = db
    .prepare(
      `SELECT u.id, u.name, u.email, u.job_title, u.business_area, u.role, u.created_at,
              fr.id          AS first_result_id,
              fr.persona     AS first_persona,
              fr.champ_score AS first_champ_score,
              fr.created_at  AS first_result_at,
              (SELECT COUNT(*) FROM results rc WHERE rc.user_id = u.id) AS result_count
         FROM users u
         LEFT JOIN (
           SELECT r.* FROM results r
           JOIN (SELECT user_id, MIN(id) AS first_id FROM results GROUP BY user_id) f
             ON r.id = f.first_id
         ) fr ON fr.user_id = u.id
        ORDER BY u.name COLLATE NOCASE ASC`
    )
    .all();

  res.json({
    users: rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      jobTitle: r.job_title,
      businessArea: r.business_area,
      role: r.role,
      createdAt: r.created_at,
      resultCount: r.result_count,
      firstResult: r.first_result_id
        ? {
            id: r.first_result_id,
            persona: r.first_persona,
            personaName: PERSONAS[r.first_persona]?.name,
            personaEmoji: PERSONAS[r.first_persona]?.emoji,
            champScore: r.first_champ_score,
            createdAt: r.first_result_at,
          }
        : null,
    })),
  });
});

// DELETE /api/admin/users/:id/first-result — removes a user's FIRST result
// (lowest result id). Because the leaderboard selects each user's MIN(id)
// result, their next-oldest result automatically becomes the new leaderboard
// entry. If they have no remaining results they simply drop off until they
// retake the assessment.
router.delete('/users/:id/first-result', (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ error: 'Invalid user id.' });
  }

  const user = db.prepare('SELECT id, name FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  const first = db
    .prepare('SELECT id FROM results WHERE user_id = ? ORDER BY id ASC LIMIT 1')
    .get(userId);
  if (!first) {
    return res.status(404).json({ error: 'This user has no results to delete.' });
  }

  db.prepare('DELETE FROM results WHERE id = ?').run(first.id);

  const remaining = db
    .prepare('SELECT COUNT(*) n FROM results WHERE user_id = ?')
    .get(userId).n;

  res.json({ deletedResultId: first.id, remaining });
});

export default router;
