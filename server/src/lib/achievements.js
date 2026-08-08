import { DIM_KEYS } from './scoring.js';

/**
 * Every achievement's criteria is published here in plain language — shown
 * to the user whether or not they've unlocked it (PER-007: "awarded only
 * against published criteria"). `progress` returns 0-100: how close a
 * locked achievement is to unlocking, so the UI can show a next milestone
 * rather than a flat "Locked".
 */
export const ACHIEVEMENTS = [
  {
    key: 'finisher',
    emoji: '🏁',
    name: 'Finisher',
    criteria: 'Complete the assessment.',
    unlocked: () => true,
    progress: () => 100,
  },
  {
    key: 'rare',
    emoji: '💎',
    name: 'Rare Find',
    criteria: 'Match the rare Catalyst persona, or score 85+ in Innovation.',
    unlocked: (s) => s.winner === 'catalyst' || s.dimPct.innovation >= 85,
    progress: (s) => (s.winner === 'catalyst' ? 100 : pct(s.dimPct.innovation, 85)),
  },
  {
    key: 'balanced',
    emoji: '⚖️',
    name: 'Well Rounded',
    criteria: 'Score 70%+ in at least 3 of the 7 dimensions.',
    unlocked: (s) => countAtLeast(s.dimPct, 70) >= 3,
    progress: (s) => pct(countAtLeast(s.dimPct, 70), 3),
  },
  {
    key: 'curious',
    emoji: '🧭',
    name: 'Endlessly Curious',
    criteria: 'Score 90+ in Curiosity.',
    unlocked: (s) => s.dimPct.curiosity >= 90,
    progress: (s) => pct(s.dimPct.curiosity, 90),
  },
  {
    key: 'customer',
    emoji: '❤️',
    name: 'Customer Champion',
    criteria: 'Customer focus is your single highest-scoring dimension.',
    unlocked: (s) => topDimension(s.dimPct) === 'customer',
    progress: (s) => {
      const top = Math.max(...DIM_KEYS.map((k) => s.dimPct[k] || 0));
      return top ? pct(s.dimPct.customer, top) : 0;
    },
  },
  {
    key: 'champion',
    emoji: '⚡',
    name: 'Change Champion',
    criteria: 'Reach a champion-potential score of 55+.',
    unlocked: (s) => s.champ >= 55,
    progress: (s) => pct(s.champ, 55),
  },
];

function pct(value, target) {
  if (!target) return 0;
  return Math.max(0, Math.min(100, Math.round((value / target) * 100)));
}
function countAtLeast(dimPct, threshold) {
  return DIM_KEYS.filter((k) => (dimPct[k] || 0) >= threshold).length;
}
function topDimension(dimPct) {
  return [...DIM_KEYS].sort((a, b) => (dimPct[b] || 0) - (dimPct[a] || 0))[0];
}

/** Achievement keys a scored result has actually earned. */
export function deriveAchievements(scored) {
  return ACHIEVEMENTS.filter((a) => a.unlocked(scored)).map((a) => a.key);
}

/**
 * Every achievement with its unlocked state and, for locked ones, progress
 * toward the next milestone — what the UI needs to show "earned and next
 * milestones" rather than a binary earned/locked list.
 */
export function achievementProgress(scored) {
  return ACHIEVEMENTS.map((a) => {
    const unlocked = a.unlocked(scored);
    return {
      key: a.key,
      emoji: a.emoji,
      name: a.name,
      criteria: a.criteria,
      unlocked,
      progress: unlocked ? 100 : a.progress(scored),
    };
  });
}
