import { Router } from 'express';
import db from '../db/index.js';
import { requireAdmin } from '../middleware/auth.js';
import { PERSONA_KEYS } from '../lib/scoring.js';
import { DIMS, DIM_KEYS } from '../lib/scoring.js';
import { PERSONAS } from '../lib/personas.js';
import { buildAnalyticsSummary } from '../lib/analytics.js';
import { logAdminAction, listAuditLog } from '../lib/audit.js';
import { distributionToCsv, heatmapToCsv, analyticsToCsv } from '../lib/export.js';
import {
  isValidType,
  isValidStatus,
  isValidPersonaKeys,
  listResources,
  getResource,
  createResource,
  updateResource,
  setResourceStatus,
  deleteResource,
} from '../lib/learningResources.js';

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
function buildDistribution() {
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

  return {
    total,
    distribution: PERSONA_KEYS.map((key) => ({
      key,
      name: PERSONAS[key].name,
      emoji: PERSONAS[key].emoji,
      colors: PERSONAS[key].colors,
      count: counts[key],
      pct: total ? Math.round((counts[key] / total) * 100) : 0,
    })),
  };
}

router.get('/distribution', (_req, res) => {
  res.json(buildDistribution());
});

// GET /api/admin/analytics — usage, completion, drop-off and repeat-visit
// stats for PER-003. ?businessArea=<name> scopes the headline numbers to
// one area; the per-area breakdown table is always org-wide and suppresses
// any area with fewer than MIN_COHORT_SIZE attempts.
router.get('/analytics', (req, res) => {
  const areaFilter = typeof req.query.businessArea === 'string' && req.query.businessArea.trim()
    ? req.query.businessArea.trim()
    : null;
  res.json(buildAnalyticsSummary({ areaFilter }));
});

// GET /api/admin/heatmap — business area × dimension average maturity.
function buildHeatmap() {
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

  return { dimensions: DIMS, areas };
}

router.get('/heatmap', (_req, res) => {
  res.json(buildHeatmap());
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

  logAdminAction({
    adminId: req.user.sub,
    action: 'delete_first_result',
    targetUserId: userId,
    targetName: user.name,
    details: { deletedResultId: first.id, remaining },
  });

  res.json({ deletedResultId: first.id, remaining });
});

// PATCH /api/admin/users/:id/role — grant or revoke admin access.
// Self-demotion is blocked so an admin can never lock themselves out; if
// the team needs that, another admin has to do it.
router.patch('/users/:id/role', (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ error: 'Invalid user id.' });
  }

  const { role } = req.body || {};
  if (role !== 'admin' && role !== 'user') {
    return res.status(400).json({ error: "Role must be 'admin' or 'user'." });
  }

  const user = db.prepare('SELECT id, name, role FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  if (userId === req.user.sub && role === 'user') {
    return res.status(400).json({ error: 'You cannot remove your own admin access.' });
  }

  if (user.role === role) {
    return res.json({ id: user.id, role: user.role, changed: false });
  }

  db.prepare('UPDATE users SET role = ?, updated_at = datetime(\'now\') WHERE id = ?').run(role, userId);

  logAdminAction({
    adminId: req.user.sub,
    action: 'role_change',
    targetUserId: userId,
    targetName: user.name,
    details: { from: user.role, to: role },
  });

  res.json({ id: user.id, role, changed: true });
});

// GET /api/admin/audit-log — recent admin actions (role changes, result
// deletions), each with who did it, to whom, and when. Read-only; there is
// deliberately no endpoint to edit or delete entries.
router.get('/audit-log', (_req, res) => {
  res.json({ entries: listAuditLog({ limit: 100 }) });
});

// GET /api/admin/export?dataset=distribution|heatmap|analytics — CSV export
// of aggregate data only (PER-004: "export anonymised data"). Deliberately
// does NOT cover /champions or /users, since those are name-identifiable —
// this endpoint only ever serves data that was already anonymous.
router.get('/export', (req, res) => {
  const dataset = req.query.dataset;
  let csv;
  let filename;

  if (dataset === 'distribution') {
    csv = distributionToCsv(buildDistribution());
    filename = 'persona-distribution.csv';
  } else if (dataset === 'heatmap') {
    csv = heatmapToCsv(buildHeatmap());
    filename = 'maturity-heatmap.csv';
  } else if (dataset === 'analytics') {
    csv = analyticsToCsv(buildAnalyticsSummary({}));
    filename = 'usage-analytics.csv';
  } else {
    return res.status(400).json({ error: "dataset must be 'distribution', 'heatmap', or 'analytics'." });
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
});

// ---- PER-034: learning content administration --------------------------

function validateResourceBody(body) {
  const { title, description, type, url, personaKeys } = body || {};
  if (typeof title !== 'string' || !title.trim()) return 'Title is required.';
  if (title.length > 200) return 'Title must be 200 characters or fewer.';
  if (description !== undefined && description !== null && typeof description !== 'string') {
    return 'Description must be text.';
  }
  if (!isValidType(type)) return "type must be 'document', 'video', 'link', or 'platform_url'.";
  if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) return 'A valid http(s) URL is required.';
  if (!isValidPersonaKeys(personaKeys)) return 'personaKeys must be a non-empty array of valid persona keys.';
  return null;
}

// GET /api/admin/learning-resources — every resource regardless of status,
// each with its assigned personas. Admin-only; this is the authoring view,
// not what learners see (see publishedResourcesForPersona for that).
router.get('/learning-resources', (_req, res) => {
  res.json({ resources: listResources() });
});

// POST /api/admin/learning-resources — always created as 'draft'; use the
// status endpoint below to publish once it's ready.
router.post('/learning-resources', (req, res) => {
  const err = validateResourceBody(req.body);
  if (err) return res.status(400).json({ error: err });

  const { title, description, type, url, personaKeys } = req.body;
  const resource = createResource({ title: title.trim(), description, type, url, personaKeys, createdBy: req.user.sub });

  logAdminAction({
    adminId: req.user.sub,
    action: 'resource_create',
    targetName: resource.title,
    details: { resourceId: resource.id, type: resource.type, personas: resource.personas },
  });

  res.status(201).json({ resource });
});

// PATCH /api/admin/learning-resources/:id — edits content and persona
// assignment. Does not touch status; use the status endpoint for that so
// "publish" and "archive" stay explicit, auditable actions on their own.
router.patch('/learning-resources/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid resource id.' });

  const existing = getResource(id);
  if (!existing) return res.status(404).json({ error: 'Resource not found.' });

  const err = validateResourceBody(req.body);
  if (err) return res.status(400).json({ error: err });

  const { title, description, type, url, personaKeys } = req.body;
  const resource = updateResource(id, { title: title.trim(), description, type, url, personaKeys });

  logAdminAction({
    adminId: req.user.sub,
    action: 'resource_update',
    targetName: resource.title,
    details: { resourceId: id },
  });

  res.json({ resource });
});

// PATCH /api/admin/learning-resources/:id/status — publish, archive, or
// send back to draft. Kept as its own endpoint so publishing a resource
// (which makes it visible to real users) is always its own distinct,
// auditable action rather than a side effect of an edit.
router.patch('/learning-resources/:id/status', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid resource id.' });

  const existing = getResource(id);
  if (!existing) return res.status(404).json({ error: 'Resource not found.' });

  const { status } = req.body || {};
  if (!isValidStatus(status)) return res.status(400).json({ error: "status must be 'draft', 'published', or 'archived'." });

  if (existing.status === status) {
    return res.json({ resource: existing, changed: false });
  }

  const resource = setResourceStatus(id, status);

  logAdminAction({
    adminId: req.user.sub,
    action: 'resource_status_change',
    targetName: resource.title,
    details: { resourceId: id, from: existing.status, to: status },
  });

  res.json({ resource, changed: true });
});

// DELETE /api/admin/learning-resources/:id — removes it entirely, including
// its persona assignments. Once deleted it stops appearing in any learning
// record on the next request; there is no "undo" beyond the audit record
// of what it was.
router.delete('/learning-resources/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid resource id.' });

  const existing = getResource(id);
  if (!existing) return res.status(404).json({ error: 'Resource not found.' });

  deleteResource(id);

  logAdminAction({
    adminId: req.user.sub,
    action: 'resource_delete',
    targetName: existing.title,
    details: { resourceId: id, type: existing.type, personas: existing.personas },
  });

  res.json({ deletedResourceId: id });
});

export default router;
