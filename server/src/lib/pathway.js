/**
 * The capability framework didn't exist anywhere in this app before this
 * story — there's no pre-existing "levels" concept to wire up. Rather than
 * invent a new, opaque scoring system, levels are gated on two signals that
 * are already computed and already visible to the user elsewhere:
 *   - champScore: the existing 0-100 champion-potential score (leaderboard,
 *     the "Change Champion" achievement, admin champions list)
 *   - journeyPct: % of their persona's learning journey completed (PER-005)
 * That's the "transparent evidence" the acceptance criteria asks for —
 * both numbers are already things the user can see driving other features,
 * not a hidden formula invented just for this pathway.
 */
export const PATHWAY_LEVELS = [
  {
    level: 1,
    name: 'Curious',
    minChamp: 0,
    minJourneyPct: 0,
    description: 'Found out your AI persona and where your strengths sit today.',
  },
  {
    level: 2,
    name: 'Engaged',
    minChamp: 35,
    minJourneyPct: 25,
    description: 'Started actively building on your persona strengths.',
  },
  {
    level: 3,
    name: 'Capable',
    minChamp: 55,
    minJourneyPct: 50,
    description: 'Applying AI thinking with real, visible momentum.',
  },
  {
    level: 4,
    name: 'Confident',
    minChamp: 70,
    minJourneyPct: 75,
    description: 'A go-to person for AI-enabled ways of working in your team.',
  },
  {
    level: 5,
    name: 'Champion',
    minChamp: 85,
    minJourneyPct: 100,
    description: 'Leading AI adoption by example, not just by score.',
  },
];

/**
 * A level requires BOTH thresholds — score alone isn't enough (that would
 * just be an achievement, not a capability pathway), and finishing the
 * journey alone isn't enough either (that's completion, not applied
 * capability). Requiring both is what makes this a distinct concept from
 * PER-005's progress tracker and PER-007's achievements, rather than a
 * third view of the same single number.
 */
export function computePathwayStatus({ champScore, journeyPct }) {
  let current = PATHWAY_LEVELS[0];
  for (const lvl of PATHWAY_LEVELS) {
    if (champScore >= lvl.minChamp && journeyPct >= lvl.minJourneyPct) current = lvl;
  }
  const next = PATHWAY_LEVELS.find((l) => l.level === current.level + 1) || null;

  return {
    levels: PATHWAY_LEVELS.map((l) => ({
      level: l.level,
      name: l.name,
      description: l.description,
      minChamp: l.minChamp,
      minJourneyPct: l.minJourneyPct,
      achieved: champScore >= l.minChamp && journeyPct >= l.minJourneyPct,
    })),
    currentLevel: current.level,
    currentLevelName: current.name,
    next: next && {
      level: next.level,
      name: next.name,
      description: next.description,
      minChamp: next.minChamp,
      minJourneyPct: next.minJourneyPct,
      champGap: Math.max(0, next.minChamp - champScore),
      journeyPctGap: Math.max(0, next.minJourneyPct - journeyPct),
    },
  };
}
