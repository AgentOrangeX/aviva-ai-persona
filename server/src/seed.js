/**
 * Seed demo users and results so the admin dashboard has real,
 * aggregatable data on a fresh clone. Safe to run repeatedly.
 *
 *   npm run seed        (from /server)
 */
import bcrypt from 'bcryptjs';
import db from './db/index.js';
import { QUESTIONS } from './lib/questions.js';
import { scoreAnswers, DIM_KEYS } from './lib/scoring.js';

const AREAS = ['Claims', 'Underwriting', 'Digital', 'Data & Analytics', 'Customer Ops', 'Finance', 'People'];
const TITLES = ['Analyst', 'Manager', 'Lead', 'Specialist', 'Partner', 'Director'];
const FIRST = ['Priya', 'Marcus', 'Aisha', 'Tom', 'Lena', 'Raj', 'Nadia', 'Owen', 'Sofia', 'Hassan', 'Grace', 'Ben', 'Mei', 'Kofi', 'Ivy'];
const LAST = ['Shah', 'Doyle', 'Khan', 'Brook', 'Maes', 'Patel', 'Frost', 'Hale', 'Reyes', 'Ali', 'Webb', 'Cole', 'Lin', 'Owusu', 'Park'];

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

// Pick the option that best matches a set of weighted dimension preferences.
function leanedAnswers(prefs, strength = 0.7) {
  return QUESTIONS.map((q) => {
    if (Math.random() < strength) {
      let best = -Infinity;
      let idx = 0;
      q.options.forEach((o, i) => {
        let v = 0;
        for (const [k, w] of Object.entries(prefs)) v += (o.weights[k] || 0) * w;
        if (v > best) {
          best = v;
          idx = i;
        }
      });
      return { questionId: q.id, optionIndex: idx };
    }
    return { questionId: q.id, optionIndex: Math.floor(Math.random() * q.options.length) };
  });
}

// Profiles engineered to land on each persona (plus noise), so a fresh
// dashboard shows all seven personas and a few genuine champions.
const PROFILES = [
  { prefs: { curiosity: 3, innovation: 1 } },                       // explorer
  { prefs: { technical: 2, strategy: 1.5, curiosity: 1 }, strength: 0.8 }, // optimiser
  { prefs: { influence: 3, customer: 1.5, change: 1 } },            // collaborator
  { prefs: { innovation: 3, curiosity: 1 } },                       // innovator
  { prefs: { technical: 3, innovation: 1 } },                       // builder
  { prefs: { strategy: 3, change: 1.5 } },                          // pathfinder
  { prefs: { change: 3, influence: 2.5, strategy: 1 }, strength: 0.85 }, // catalyst (rare)
  { prefs: {} },                                                    // pure noise
];

function profileAnswers(i) {
  const p = PROFILES[i % PROFILES.length];
  if (Object.keys(p.prefs).length === 0) {
    return QUESTIONS.map((q) => ({ questionId: q.id, optionIndex: Math.floor(Math.random() * q.options.length) }));
  }
  return leanedAnswers(p.prefs, p.strength ?? 0.7);
}

function run() {
  const hash = bcrypt.hashSync('Password123', 10);
  const insertUser = db.prepare(
    `INSERT INTO users (email, password_hash, name, job_title, business_area, role)
     VALUES (?, ?, ?, ?, ?, 'user')`
  );
  const insertResult = db.prepare(
    `INSERT INTO results (user_id, persona, runner_up, rare, champ_score, dim_json, answers_json, achievements)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const biases = [null, 'curiosity', 'technical', 'influence', 'strategy', 'innovation', 'customer', 'change'];
  let created = 0;

  const tx = db.transaction(() => {
    for (let i = 0; i < 70; i++) {
      const first = FIRST[i % FIRST.length];
      const last = LAST[(i * 3) % LAST.length];
      const name = `${first} ${last}`;
      const email = `${first}.${last}.${i}@example.aviva`.toLowerCase();
      if (db.prepare('SELECT id FROM users WHERE email = ?').get(email)) continue;

      const area = AREAS[i % AREAS.length];
      const title = `${area} ${TITLES[i % TITLES.length]}`;
      const info = insertUser.run(email, hash, name, title, area);

      const answers = profileAnswers(i);
      const scored = scoreAnswers(answers, QUESTIONS);
      insertResult.run(
        info.lastInsertRowid,
        scored.winner,
        scored.runnerUp,
        scored.rare ? 1 : 0,
        scored.champ,
        JSON.stringify(scored.dimPct),
        JSON.stringify(answers),
        JSON.stringify(deriveAchievements(scored))
      );
      created++;
    }
  });
  tx();

  console.log(`[seed] Created ${created} demo users with results.`);
  console.log('[seed] Demo login: any seeded email + password "Password123"');
}

run();
