/**
 * Hidden scoring dimensions. Every quiz answer carries weights toward
 * one or more of these. Persona matching is derived from them, so no
 * single answer maps obviously to a persona.
 */
export const DIMS = [
  { key: 'curiosity', label: 'Curiosity', color: '#176FC1' },
  { key: 'influence', label: 'Influence', color: '#FCCA12' },
  { key: 'innovation', label: 'Innovation', color: '#59C247' },
  { key: 'technical', label: 'Technical capability', color: '#0E4E8A' },
  { key: 'strategy', label: 'Strategic thinking', color: '#8A4FC4' },
  { key: 'change', label: 'Change leadership', color: '#E0AE00' },
  { key: 'customer', label: 'Customer focus', color: '#3FA431' },
];

export const DIM_KEYS = DIMS.map((d) => d.key);
export const DIM_LABEL = Object.fromEntries(DIMS.map((d) => [d.key, d.label]));

/**
 * Persona "lean" vectors. Used as weights in a normalised dot-product
 * against the respondent's dimension percentages.
 */
export const PERSONA_LEAN = {
  explorer: { curiosity: 3, innovation: 1.5, technical: 1, influence: 0.5 },
  // Optimiser = efficiency mindset: strategy-led use of technical skill, not raw depth.
  optimiser: { strategy: 2.5, technical: 1.5, customer: 1, curiosity: 0.5 },
  collaborator: { influence: 2.5, customer: 1.5, change: 1, curiosity: 0.5 },
  innovator: { innovation: 3, curiosity: 1.5, strategy: 1, customer: 1 },
  // Builder = deep maker: technical-first with innovation, low strategy.
  builder: { technical: 3.5, innovation: 1.5, curiosity: 0.5 },
  pathfinder: { strategy: 3, change: 1.5, influence: 1, customer: 1 },
  catalyst: { change: 3, influence: 2.5, strategy: 1.5, innovation: 1.5, curiosity: 1 },
};

export const PERSONA_KEYS = Object.keys(PERSONA_LEAN);

/**
 * Compute a full result from a set of answers.
 *
 * @param {Array<{questionId:number, optionIndex:number}>} answers
 * @param {Array} questions  the canonical question bank (with option weights)
 * @returns {{dimPct:Object, fit:Object, winner:string, runnerUp:string,
 *            ranked:Array, spread:number, champ:number, rare:boolean}}
 */
export function scoreAnswers(answers, questions) {
  const byId = new Map(questions.map((q) => [q.id, q]));

  // raw dimension totals
  const dims = Object.fromEntries(DIM_KEYS.map((k) => [k, 0]));
  for (const a of answers) {
    const q = byId.get(a.questionId);
    if (!q) continue;
    const opt = q.options[a.optionIndex];
    if (!opt) continue;
    for (const [k, v] of Object.entries(opt.weights)) {
      if (k in dims) dims[k] += v;
    }
  }

  // theoretical max per dimension (best option per question) for normalisation
  const maxRaw = Object.fromEntries(DIM_KEYS.map((k) => [k, 0]));
  for (const q of questions) {
    for (const k of DIM_KEYS) {
      const best = Math.max(0, ...q.options.map((o) => o.weights[k] || 0));
      maxRaw[k] += best;
    }
  }

  const dimPct = {};
  for (const k of DIM_KEYS) {
    dimPct[k] = maxRaw[k] ? Math.round((dims[k] / maxRaw[k]) * 100) : 0;
  }

  // persona fit: normalised weighted dot-product
  const fit = {};
  for (const key of PERSONA_KEYS) {
    const lean = PERSONA_LEAN[key];
    let s = 0;
    let wsum = 0;
    for (const [d, w] of Object.entries(lean)) {
      s += (dimPct[d] || 0) * w;
      wsum += w;
    }
    fit[key] = wsum ? s / wsum : 0;
  }

  // Catalyst is the rare leadership persona: only emerges when change
  // leadership is exceptionally high and backed by real influence, with the
  // two clearing a high combined bar. Suppressed otherwise so it stays earned.
  const catalystGate =
    dimPct.change >= 72 &&
    dimPct.influence >= 55 &&
    dimPct.change + dimPct.influence >= 150;
  if (!catalystGate) fit.catalyst *= 0.5;
  else fit.catalyst *= 1.18;

  const ranked = PERSONA_KEYS.map((k) => [k, fit[k]]).sort((a, b) => b[1] - a[1]);
  const winner = ranked[0][0];
  const runnerUp = ranked[1][0];
  const spread = ranked[0][1] - ranked[1][1];

  // Champion-potential score (admin only), 0-100. Weighted toward the
  // signals that distinguish someone who can drive AI adoption at scale:
  // change leadership and influence first, with strategy, innovation and
  // technical credibility as supporting breadth. Calibrated so a genuine
  // change-leader lands in the 70-90 band and the field spreads below.
  const champ = Math.min(
    100,
    Math.round(
      dimPct.change * 0.42 +
        dimPct.influence * 0.30 +
        dimPct.strategy * 0.12 +
        dimPct.innovation * 0.10 +
        dimPct.technical * 0.06
    )
  );

  const rare = winner === 'catalyst' || dimPct.innovation >= 85;

  return { dimPct, fit, winner, runnerUp, ranked, spread, champ, rare };
}
