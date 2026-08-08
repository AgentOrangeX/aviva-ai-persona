import db from '../db/index.js';
import { QUESTIONS } from './questions.js';

// Business areas with fewer than this many attempts are not broken out
// individually — showing exact numbers for a 2-3 person area risks
// identifying who did or didn't complete it. Matches the acceptance
// criteria for PER-003 ("without exposing individuals").
export const MIN_COHORT_SIZE = 5;

const VALID_EVENT_TYPES = new Set(['start', 'step', 'complete']);

export function isValidEventType(t) {
  return VALID_EVENT_TYPES.has(t);
}

export function isValidQuestionIndex(i) {
  return Number.isInteger(i) && i >= 0 && i < QUESTIONS.length;
}

function dropOffBuckets() {
  // Quartile buckets over however many questions the quiz currently has,
  // so this doesn't need editing if the question bank grows or shrinks.
  const n = QUESTIONS.length;
  const edges = [0, Math.round(n * 0.25), Math.round(n * 0.5), Math.round(n * 0.75), n];
  return [
    { key: 'none', label: 'Left before answering', min: null, max: null },
    { key: 'q1', label: `Questions 1–${edges[1]}`, min: 0, max: edges[1] - 1 },
    { key: 'q2', label: `Questions ${edges[1] + 1}–${edges[2]}`, min: edges[1], max: edges[2] - 1 },
    { key: 'q3', label: `Questions ${edges[2] + 1}–${edges[3]}`, min: edges[2], max: edges[3] - 1 },
    { key: 'q4', label: `Questions ${edges[3] + 1}–${edges[4]}`, min: edges[3], max: edges[4] - 1 },
  ];
}

function bucketFor(buckets, furthestIndex) {
  if (furthestIndex == null) return buckets[0];
  return buckets.find((b) => b.min !== null && furthestIndex >= b.min && furthestIndex <= b.max) || buckets[buckets.length - 1];
}

/**
 * Builds the full analytics summary. When areaFilter is passed, every
 * count is scoped to attempts whose snapshot business_area matches it
 * (an unspecified/anonymous attempt never matches a named filter).
 */
export function buildAnalyticsSummary({ areaFilter } = {}) {
  // One row per attempt: when it started, whether it completed, the
  // furthest question index reached, and the visitor/area it belongs to.
  const attempts = db
    .prepare(
      `SELECT
         attempt_id,
         visitor_id,
         MIN(CASE WHEN event_type = 'start' THEN created_at END)   AS started_at,
         MAX(CASE WHEN event_type = 'complete' THEN 1 ELSE 0 END)  AS completed,
         MAX(CASE WHEN event_type = 'step' THEN question_index END) AS furthest_index,
         -- an attempt can touch a null area (anonymous) or a real one; take
         -- whichever non-null value shows up, consistent for the attempt
         MAX(business_area) AS business_area_raw
       FROM quiz_events
       GROUP BY attempt_id
       HAVING started_at IS NOT NULL`
    )
    .all()
    .map((a) => ({
      ...a,
      business_area: a.business_area_raw && a.business_area_raw.trim() ? a.business_area_raw.trim() : 'Unspecified',
    }));

  const scoped = areaFilter ? attempts.filter((a) => a.business_area === areaFilter) : attempts;

  const starts = scoped.length;
  const completions = scoped.filter((a) => a.completed).length;
  const completionRate = starts ? completions / starts : 0;

  const visitorAttemptCounts = new Map();
  for (const a of scoped) {
    visitorAttemptCounts.set(a.visitor_id, (visitorAttemptCounts.get(a.visitor_id) || 0) + 1);
  }
  const uniqueVisitors = visitorAttemptCounts.size;
  const repeatVisitors = [...visitorAttemptCounts.values()].filter((n) => n > 1).length;
  const repeatVisitorRate = uniqueVisitors ? repeatVisitors / uniqueVisitors : 0;

  const buckets = dropOffBuckets();
  const dropOffCounts = Object.fromEntries(buckets.map((b) => [b.key, 0]));
  for (const a of scoped) {
    if (a.completed) continue; // only unfinished attempts have a drop-off point
    const bucket = bucketFor(buckets, a.furthest_index);
    dropOffCounts[bucket.key] += 1;
  }
  const droppedTotal = starts - completions;

  // Per-area breakdown, always computed org-wide (ignores areaFilter — the
  // filter narrows the headline stats above; this table is the "which
  // areas" view). Areas below MIN_COHORT_SIZE are suppressed.
  const byArea = new Map();
  for (const a of attempts) {
    const area = a.business_area;
    if (!byArea.has(area)) byArea.set(area, { starts: 0, completions: 0 });
    const bucket = byArea.get(area);
    bucket.starts += 1;
    if (a.completed) bucket.completions += 1;
  }

  const areas = [...byArea.entries()]
    .map(([area, b]) => ({
      area,
      starts: b.starts,
      suppressed: b.starts < MIN_COHORT_SIZE,
      completions: b.starts < MIN_COHORT_SIZE ? null : b.completions,
      completionRate: b.starts < MIN_COHORT_SIZE ? null : b.completions / b.starts,
    }))
    .sort((a, b) => b.starts - a.starts);

  return {
    starts,
    completions,
    completionRate,
    uniqueVisitors,
    repeatVisitors,
    repeatVisitorRate,
    dropOff: buckets.map((b) => ({
      key: b.key,
      label: b.label,
      count: dropOffCounts[b.key],
      pct: droppedTotal ? Math.round((dropOffCounts[b.key] / droppedTotal) * 100) : 0,
    })),
    areas,
  };
}
