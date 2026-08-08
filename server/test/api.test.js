import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-1234567890abcdef';
process.env.DATABASE_PATH = process.env.DATABASE_PATH || ':memory:';

const { createApp } = await import('../src/app.js');
const { default: db } = await import('../src/db/index.js');

let server;
let base;
let userToken;
let adminToken;

before(async () => {
  // seed an admin directly
  const email = 'admin@test.local';
  if (!db.prepare('SELECT id FROM users WHERE email = ?').get(email)) {
    db.prepare(
      "INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, 'admin')"
    ).run(email, bcrypt.hashSync('AdminPass123', 10), 'Admin');
  }
  await new Promise((resolve) => {
    server = createApp().listen(0, () => {
      base = `http://localhost:${server.address().port}`;
      resolve();
    });
  });
});

after(() => server?.close());

async function call(path, opts = {}) {
  const res = await fetch(base + path, {
    method: opts.method || 'GET',
    headers: {
      'content-type': 'application/json',
      ...(opts.token ? { authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

let fullAnswers;

test('questions load without exposing weights', async () => {
  const r = await call('/api/quiz/questions');
  assert.equal(r.status, 200);
  assert.equal(r.body.questions.length, 28);
  assert.ok(!JSON.stringify(r.body.questions).includes('weights'));
  fullAnswers = r.body.questions.map((q) => ({ questionId: q.id, optionIndex: 0 }));
});

test('anonymous can score but result is not saved', async () => {
  const r = await call('/api/results/score', { method: 'POST', body: { answers: fullAnswers } });
  assert.equal(r.status, 200);
  assert.equal(r.body.saved, false);
  assert.ok(r.body.result.persona.key);
});

test('anonymous cannot save a result', async () => {
  const r = await call('/api/results', { method: 'POST', body: { answers: fullAnswers } });
  assert.equal(r.status, 401);
});

test('registration creates a user-role account', async () => {
  const r = await call('/api/auth/register', {
    method: 'POST',
    body: { email: 'user@test.local', password: 'Password123', name: 'Test User', jobTitle: 'Analyst', businessArea: 'Claims' },
  });
  assert.equal(r.status, 201);
  assert.equal(r.body.user.role, 'user');
  userToken = r.body.token;
});

test('duplicate email is rejected', async () => {
  const r = await call('/api/auth/register', {
    method: 'POST',
    body: { email: 'user@test.local', password: 'Password123', name: 'Dup' },
  });
  assert.equal(r.status, 409);
});

test('invalid registration is rejected', async () => {
  const r = await call('/api/auth/register', { method: 'POST', body: { email: 'bad', password: 'x', name: '' } });
  assert.equal(r.status, 400);
});

test('authenticated user can save and read their results', async () => {
  const save = await call('/api/results', { method: 'POST', body: { answers: fullAnswers }, token: userToken });
  assert.equal(save.status, 201);
  assert.equal(save.body.saved, true);

  const mine = await call('/api/results/mine', { token: userToken });
  assert.equal(mine.status, 200);
  assert.equal(mine.body.results.length, 1);
});

test('normal user is blocked from admin endpoints', async () => {
  const r = await call('/api/admin/overview', { token: userToken });
  assert.equal(r.status, 403);
});

test('anonymous is blocked from admin endpoints', async () => {
  const r = await call('/api/admin/overview');
  assert.equal(r.status, 401);
});

test('admin can log in and read all dashboards', async () => {
  const login = await call('/api/auth/login', { method: 'POST', body: { email: 'admin@test.local', password: 'AdminPass123' } });
  assert.equal(login.status, 200);
  assert.equal(login.body.user.role, 'admin');
  adminToken = login.body.token;

  for (const path of ['/api/admin/overview', '/api/admin/distribution', '/api/admin/heatmap', '/api/admin/champions']) {
    const r = await call(path, { token: adminToken });
    assert.equal(r.status, 200, `${path} should be 200`);
  }
});

test('wrong password is rejected', async () => {
  const r = await call('/api/auth/login', { method: 'POST', body: { email: 'admin@test.local', password: 'nope' } });
  assert.equal(r.status, 401);
});

test('non-admin cannot change roles', async () => {
  const list = await call('/api/admin/users', { token: adminToken });
  const target = list.body.users.find((u) => u.email === 'user@test.local');
  const r = await call(`/api/admin/users/${target.id}/role`, { method: 'PATCH', body: { role: 'admin' }, token: userToken });
  assert.equal(r.status, 403);
});

test('admin can grant admin access to another user', async () => {
  const list = await call('/api/admin/users', { token: adminToken });
  const target = list.body.users.find((u) => u.email === 'user@test.local');

  const r = await call(`/api/admin/users/${target.id}/role`, { method: 'PATCH', body: { role: 'admin' }, token: adminToken });
  assert.equal(r.status, 200);
  assert.equal(r.body.role, 'admin');
  assert.equal(r.body.changed, true);

  // the promoted user's ALREADY-ISSUED token should now pass requireAdmin,
  // because the check re-reads the DB rather than trusting the stale claim
  const check = await call('/api/admin/overview', { token: userToken });
  assert.equal(check.status, 200);
});

test('revoking admin access takes effect immediately on an existing token', async () => {
  const list = await call('/api/admin/users', { token: adminToken });
  const target = list.body.users.find((u) => u.email === 'user@test.local');

  const revoke = await call(`/api/admin/users/${target.id}/role`, { method: 'PATCH', body: { role: 'user' }, token: adminToken });
  assert.equal(revoke.status, 200);
  assert.equal(revoke.body.role, 'user');

  // same old token as before — should now be rejected without waiting for expiry
  const check = await call('/api/admin/overview', { token: userToken });
  assert.equal(check.status, 403);
});

test('admin cannot remove their own admin access', async () => {
  const me = await call('/api/auth/me', { token: adminToken });
  const r = await call(`/api/admin/users/${me.body.user.id}/role`, { method: 'PATCH', body: { role: 'user' }, token: adminToken });
  assert.equal(r.status, 400);
});

test('invalid role value is rejected', async () => {
  const list = await call('/api/admin/users', { token: adminToken });
  const target = list.body.users.find((u) => u.email === 'user@test.local');
  const r = await call(`/api/admin/users/${target.id}/role`, { method: 'PATCH', body: { role: 'superadmin' }, token: adminToken });
  assert.equal(r.status, 400);
});

test('unknown user id returns 404', async () => {
  const r = await call('/api/admin/users/999999/role', { method: 'PATCH', body: { role: 'admin' }, token: adminToken });
  assert.equal(r.status, 404);
});

// ---- PER-003: usage analytics ----------------------------------------

test('analytics event validates its inputs', async () => {
  const missingVisitor = await call('/api/analytics/event', {
    method: 'POST',
    body: { attemptId: 'a1', eventType: 'start' },
  });
  assert.equal(missingVisitor.status, 400);

  const badType = await call('/api/analytics/event', {
    method: 'POST',
    body: { visitorId: 'v1', attemptId: 'a1', eventType: 'nope' },
  });
  assert.equal(badType.status, 400);

  const stepWithoutIndex = await call('/api/analytics/event', {
    method: 'POST',
    body: { visitorId: 'v1', attemptId: 'a1', eventType: 'step' },
  });
  assert.equal(stepWithoutIndex.status, 400);

  const ok = await call('/api/analytics/event', {
    method: 'POST',
    body: { visitorId: 'v1', attemptId: 'a1', eventType: 'start' },
  });
  assert.equal(ok.status, 201);
});

test('non-admin and anonymous cannot read the analytics dashboard', async () => {
  const asUser = await call('/api/admin/analytics', { token: userToken });
  assert.equal(asUser.status, 403);
  const anon = await call('/api/admin/analytics');
  assert.equal(anon.status, 401);
});

test('analytics dashboard tallies starts, completions, drop-off and repeat visits', async () => {
  // attempt A: logged-in user (business_area 'Claims'), starts, answers 2 of 28
  // questions, then abandons — should land in the earliest drop-off bucket.
  await call('/api/analytics/event', { method: 'POST', token: userToken, body: { visitorId: 'visitor-A', attemptId: 'attempt-A1', eventType: 'start' } });
  await call('/api/analytics/event', { method: 'POST', token: userToken, body: { visitorId: 'visitor-A', attemptId: 'attempt-A1', eventType: 'step', questionIndex: 0 } });
  await call('/api/analytics/event', { method: 'POST', token: userToken, body: { visitorId: 'visitor-A', attemptId: 'attempt-A1', eventType: 'step', questionIndex: 1 } });

  // same visitor comes back later and finishes — makes visitor-A a repeat visitor.
  await call('/api/analytics/event', { method: 'POST', token: userToken, body: { visitorId: 'visitor-A', attemptId: 'attempt-A2', eventType: 'start' } });
  for (let i = 0; i < 28; i++) {
    await call('/api/analytics/event', { method: 'POST', token: userToken, body: { visitorId: 'visitor-A', attemptId: 'attempt-A2', eventType: 'step', questionIndex: i } });
  }
  await call('/api/analytics/event', { method: 'POST', token: userToken, body: { visitorId: 'visitor-A', attemptId: 'attempt-A2', eventType: 'complete' } });

  // anonymous visitor starts and never answers a single question.
  await call('/api/analytics/event', { method: 'POST', body: { visitorId: 'visitor-B', attemptId: 'attempt-B1', eventType: 'start' } });

  const r = await call('/api/admin/analytics', { token: adminToken });
  assert.equal(r.status, 200);

  // 3 attempts total across the two visitors (attempt-A1, attempt-A2, attempt-B1),
  // plus the earlier single-event 'a1' attempt from the validation test above.
  assert.ok(r.body.starts >= 4);
  assert.ok(r.body.completions >= 1);
  assert.ok(r.body.repeatVisitors >= 1, 'visitor-A should count as a repeat visitor');

  const noneBucket = r.body.dropOff.find((d) => d.key === 'none');
  assert.ok(noneBucket.count >= 1, 'visitor-B abandoned before answering anything');
  const q1Bucket = r.body.dropOff.find((d) => d.key === 'q1');
  assert.ok(q1Bucket.count >= 1, 'visitor-A abandoned in the first quarter of questions on attempt-A1');

  const claims = r.body.areas.find((a) => a.area === 'Claims');
  assert.ok(claims, 'Claims area should appear in the breakdown');
  assert.equal(claims.suppressed, true, 'fewer than 5 attempts should be suppressed for privacy');
  assert.equal(claims.completions, null);
});

test('area filter scopes the headline stats', async () => {
  const claimsOnly = await call('/api/admin/analytics?businessArea=Claims', { token: adminToken });
  assert.equal(claimsOnly.status, 200);
  // both attempt-A1 and attempt-A2 were made by the 'Claims' user; the
  // stray anonymous/global events from other tests should be excluded.
  assert.equal(claimsOnly.body.starts, 2);
  assert.equal(claimsOnly.body.completions, 1);
});

test('trust proxy is configured so client IPs behind Railway\'s reverse proxy are honoured', async () => {
  // Without this, every request looks like it comes from the same IP (the
  // proxy's), which makes IP-based rate limiting useless in production —
  // and express-rate-limit logs a ValidationError to stderr on every
  // request once X-Forwarded-For shows up without trust proxy set.
  const { createApp } = await import('../src/app.js');
  const app = createApp();
  assert.equal(app.get('trust proxy'), 1);
});

// ---- PER-004: audit log and anonymised export --------------------------

test('audit log records a role change, newest first', async () => {
  const before = await call('/api/admin/audit-log', { token: adminToken });
  assert.equal(before.status, 200);
  const countBefore = before.body.entries.length;

  const list = await call('/api/admin/users', { token: adminToken });
  const target = list.body.users.find((u) => u.email === 'user@test.local');

  await call(`/api/admin/users/${target.id}/role`, { method: 'PATCH', body: { role: 'admin' }, token: adminToken });
  await call(`/api/admin/users/${target.id}/role`, { method: 'PATCH', body: { role: 'user' }, token: adminToken });

  const after = await call('/api/admin/audit-log', { token: adminToken });
  assert.equal(after.body.entries.length, countBefore + 2);

  const latest = after.body.entries[0]; // newest first
  assert.equal(latest.action, 'role_change');
  assert.equal(latest.targetName, target.name);
  assert.deepEqual(latest.details, { from: 'admin', to: 'user' });
});

test('non-admin cannot read the audit log', async () => {
  const r = await call('/api/admin/audit-log', { token: userToken });
  assert.equal(r.status, 403);
});

test('export rejects an unknown dataset and requires admin', async () => {
  const badDataset = await call('/api/admin/export?dataset=nope', { token: adminToken });
  assert.equal(badDataset.status, 400);

  const nonAdmin = await call('/api/admin/export?dataset=distribution', { token: userToken });
  assert.equal(nonAdmin.status, 403);
});

test('export returns CSV for each anonymised dataset', async () => {
  for (const dataset of ['distribution', 'heatmap', 'analytics']) {
    const res = await fetch(base + `/api/admin/export?dataset=${dataset}`, {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(res.status, 200, `${dataset} export should be 200`);
    assert.match(res.headers.get('content-type') || '', /text\/csv/);
    const text = await res.text();
    assert.ok(text.split('\n').length > 1, `${dataset} export should have a header and at least one row`);
    // never leaks a name or email — only aggregate labels/numbers
    assert.ok(!text.includes('@test.local'), `${dataset} export must not contain an email address`);
  }
});

// ---- PER-034: learning content administration --------------------------

test('non-admin cannot manage learning resources', async () => {
  const r = await call('/api/admin/learning-resources', {
    method: 'POST',
    token: userToken,
    body: { title: 'x', type: 'link', url: 'https://example.com', personaKeys: ['explorer'] },
  });
  assert.equal(r.status, 403);
});

test('creating a resource validates every field', async () => {
  const cases = [
    { body: { type: 'link', url: 'https://x.com', personaKeys: ['explorer'] }, why: 'missing title' },
    { body: { title: 't', type: 'nope', url: 'https://x.com', personaKeys: ['explorer'] }, why: 'bad type' },
    { body: { title: 't', type: 'link', url: 'not-a-url', personaKeys: ['explorer'] }, why: 'bad url' },
    { body: { title: 't', type: 'link', url: 'https://x.com', personaKeys: [] }, why: 'empty personas' },
    { body: { title: 't', type: 'link', url: 'https://x.com', personaKeys: ['not-a-persona'] }, why: 'invalid persona key' },
  ];
  for (const c of cases) {
    const r = await call('/api/admin/learning-resources', { method: 'POST', token: adminToken, body: c.body });
    assert.equal(r.status, 400, `should reject: ${c.why}`);
  }
});

test('a new resource is created as a draft and is not yet published anywhere', async () => {
  const r = await call('/api/admin/learning-resources', {
    method: 'POST',
    token: adminToken,
    body: { title: 'Prompting basics', description: 'Quick primer', type: 'video', url: 'https://example.com/video', personaKeys: ['explorer', 'builder'] },
  });
  assert.equal(r.status, 201);
  assert.equal(r.body.resource.status, 'draft');
  assert.deepEqual(r.body.resource.personas, ['builder', 'explorer']); // stored order-independent, returned sorted

  const list = await call('/api/admin/learning-resources', { token: adminToken });
  assert.ok(list.body.resources.some((x) => x.id === r.body.resource.id));
});

test('publishing, editing, archiving and deleting a resource all log to the audit trail', async () => {
  const create = await call('/api/admin/learning-resources', {
    method: 'POST',
    token: adminToken,
    body: { title: 'Audit target', type: 'link', url: 'https://example.com/a', personaKeys: ['optimiser'] },
  });
  const id = create.body.resource.id;

  const publish = await call(`/api/admin/learning-resources/${id}/status`, { method: 'PATCH', token: adminToken, body: { status: 'published' } });
  assert.equal(publish.status, 200);
  assert.equal(publish.body.resource.status, 'published');

  const edit = await call(`/api/admin/learning-resources/${id}`, {
    method: 'PATCH', token: adminToken,
    body: { title: 'Audit target (edited)', type: 'link', url: 'https://example.com/a', personaKeys: ['optimiser'] },
  });
  assert.equal(edit.status, 200);
  assert.equal(edit.body.resource.title, 'Audit target (edited)');
  // editing content is not a status endpoint, so status should be untouched
  assert.equal(edit.body.resource.status, 'published');

  const archive = await call(`/api/admin/learning-resources/${id}/status`, { method: 'PATCH', token: adminToken, body: { status: 'archived' } });
  assert.equal(archive.status, 200);

  const del = await call(`/api/admin/learning-resources/${id}`, { method: 'DELETE', token: adminToken });
  assert.equal(del.status, 200);

  const audit = await call('/api/admin/audit-log', { token: adminToken });
  const actions = audit.body.entries.filter((e) => e.targetName === 'Audit target' || e.targetName === 'Audit target (edited)').map((e) => e.action);
  assert.ok(actions.includes('resource_create'));
  assert.ok(actions.includes('resource_status_change'));
  assert.ok(actions.includes('resource_update'));
  assert.ok(actions.includes('resource_delete'));
});

test('only published resources assigned to the matched persona appear in a result', async () => {
  // Find out which persona a full set of "always pick option 0" answers wins,
  // using the same scoring the app uses, so this test is deterministic
  // regardless of how the scoring weights are tuned.
  const preview = await call('/api/results/score', { method: 'POST', body: { answers: fullAnswers } });
  const winner = preview.body.result.persona.key;
  const other = winner === 'explorer' ? 'builder' : 'explorer';

  const published = await call('/api/admin/learning-resources', {
    method: 'POST', token: adminToken,
    body: { title: 'Winner resource', type: 'link', url: 'https://example.com/winner', personaKeys: [winner] },
  });
  await call(`/api/admin/learning-resources/${published.body.resource.id}/status`, { method: 'PATCH', token: adminToken, body: { status: 'published' } });

  const draftForWinner = await call('/api/admin/learning-resources', {
    method: 'POST', token: adminToken,
    body: { title: 'Still a draft', type: 'link', url: 'https://example.com/draft', personaKeys: [winner] },
  });

  const publishedForOther = await call('/api/admin/learning-resources', {
    method: 'POST', token: adminToken,
    body: { title: 'Wrong persona', type: 'link', url: 'https://example.com/other', personaKeys: [other] },
  });
  await call(`/api/admin/learning-resources/${publishedForOther.body.resource.id}/status`, { method: 'PATCH', token: adminToken, body: { status: 'published' } });

  const result = await call('/api/results/score', { method: 'POST', body: { answers: fullAnswers } });
  const titles = result.body.result.learningResources.map((r) => r.title);

  assert.ok(titles.includes('Winner resource'), 'published resource for the matched persona should appear');
  assert.ok(!titles.includes('Still a draft'), 'draft resources should never appear to users');
  assert.ok(!titles.includes('Wrong persona'), "resources for a persona the user didn't match should not appear");
});

// ---- PER-005: learning journey progress tracking ------------------------

test('anonymous cannot read or toggle progress', async () => {
  const get = await call('/api/progress');
  assert.equal(get.status, 401);
  const toggle = await call('/api/progress/toggle', { method: 'POST', body: { personaKey: 'explorer', stepIndex: 0 } });
  assert.equal(toggle.status, 401);
});

test('a fresh user has no progress recorded for a persona they have not touched', async () => {
  const r = await call('/api/progress', { token: userToken });
  assert.equal(r.status, 200);
  assert.equal(r.body.progress.explorer, undefined);
});

test('toggle validates persona key and step index bounds', async () => {
  const badPersona = await call('/api/progress/toggle', { method: 'POST', token: userToken, body: { personaKey: 'not-a-persona', stepIndex: 0 } });
  assert.equal(badPersona.status, 400);

  const negative = await call('/api/progress/toggle', { method: 'POST', token: userToken, body: { personaKey: 'explorer', stepIndex: -1 } });
  assert.equal(negative.status, 400);

  const tooHigh = await call('/api/progress/toggle', { method: 'POST', token: userToken, body: { personaKey: 'explorer', stepIndex: 4 } }); // explorer has 4 steps: 0-3
  assert.equal(tooHigh.status, 400);

  const notInt = await call('/api/progress/toggle', { method: 'POST', token: userToken, body: { personaKey: 'explorer', stepIndex: 1.5 } });
  assert.equal(notInt.status, 400);
});

test('toggling a step marks it complete, then undone, and persists in between', async () => {
  const on = await call('/api/progress/toggle', { method: 'POST', token: userToken, body: { personaKey: 'explorer', stepIndex: 2 } });
  assert.equal(on.status, 200);
  assert.equal(on.body.completed, true);
  assert.deepEqual(on.body.completedSteps, [2]);

  // persists across a fresh read, not just in the toggle response
  const mid = await call('/api/progress', { token: userToken });
  assert.deepEqual(mid.body.progress.explorer, [2]);

  const off = await call('/api/progress/toggle', { method: 'POST', token: userToken, body: { personaKey: 'explorer', stepIndex: 2 } });
  assert.equal(off.status, 200);
  assert.equal(off.body.completed, false);
  assert.deepEqual(off.body.completedSteps, []);

  const after = await call('/api/progress', { token: userToken });
  assert.equal(after.body.progress.explorer, undefined);
});

test('progress is isolated per user', async () => {
  await call('/api/progress/toggle', { method: 'POST', token: userToken, body: { personaKey: 'explorer', stepIndex: 0 } });

  const adminView = await call('/api/progress', { token: adminToken });
  assert.equal(adminView.body.progress.explorer, undefined, "one user's progress must not leak into another's");

  // clean up so later tests in this file see a known state
  await call('/api/progress/toggle', { method: 'POST', token: userToken, body: { personaKey: 'explorer', stepIndex: 0 } });
});

// ---- PER-007: achievement badges & milestones ---------------------------

test('every result includes published criteria and progress for every achievement, not just earned ones', async () => {
  const r = await call('/api/results/score', { method: 'POST', body: { answers: fullAnswers } });
  assert.equal(r.status, 200);
  const list = r.body.result.achievementProgress;
  assert.ok(Array.isArray(list) && list.length >= 6);

  for (const a of list) {
    assert.equal(typeof a.criteria, 'string');
    assert.ok(a.criteria.length > 0, 'criteria must be published (non-empty) even when locked');
    assert.equal(typeof a.unlocked, 'boolean');
    assert.equal(typeof a.progress, 'number');
    assert.ok(a.progress >= 0 && a.progress <= 100);
    if (a.unlocked) assert.equal(a.progress, 100);
  }

  // achievements earned should exactly match the unlocked keys in the catalogue
  const unlockedKeys = list.filter((a) => a.unlocked).map((a) => a.key).sort();
  assert.deepEqual(unlockedKeys, [...r.body.result.achievements].sort());
});

test('a locked achievement never reports 100% progress', async () => {
  const r = await call('/api/results/score', { method: 'POST', body: { answers: fullAnswers } });
  const locked = r.body.result.achievementProgress.filter((a) => !a.unlocked);
  for (const a of locked) assert.ok(a.progress < 100, `${a.key} is locked but reports 100% progress`);
});

test('achievement sharing preference defaults off and can be toggled via profile', async () => {
  const me = await call('/api/auth/me', { token: userToken });
  assert.equal(me.body.user.shareAchievements, false);

  const on = await call('/api/auth/profile', { method: 'PATCH', token: userToken, body: { shareAchievements: true } });
  assert.equal(on.status, 200);
  assert.equal(on.body.user.shareAchievements, true);

  const confirm = await call('/api/auth/me', { token: userToken });
  assert.equal(confirm.body.user.shareAchievements, true);

  const off = await call('/api/auth/profile', { method: 'PATCH', token: userToken, body: { shareAchievements: false } });
  assert.equal(off.body.user.shareAchievements, false);
});

test('shareAchievements rejects a non-boolean value', async () => {
  const r = await call('/api/auth/profile', { method: 'PATCH', token: userToken, body: { shareAchievements: 'yes' } });
  assert.equal(r.status, 400);
});

test('updating unrelated profile fields does not reset the sharing preference', async () => {
  await call('/api/auth/profile', { method: 'PATCH', token: userToken, body: { shareAchievements: true } });
  const r = await call('/api/auth/profile', { method: 'PATCH', token: userToken, body: { jobTitle: 'Senior Analyst' } });
  assert.equal(r.body.user.shareAchievements, true, 'omitting the field should leave it unchanged, not reset it');

  // reset for isolation from any later tests
  await call('/api/auth/profile', { method: 'PATCH', token: userToken, body: { shareAchievements: false } });
});

// ---- Leaderboard route (previously untested — the literal route this
// session's /:id-ordering bug would have silently broken) --------------

test('leaderboard is reachable and returns ranked entries with a "me" section', async () => {
  const r = await call('/api/results/leaderboard', { token: userToken });
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.body.leaderboard));
  assert.equal(typeof r.body.totalRanked, 'number');
  // the user has saved results earlier in this suite, so they should have a rank
  assert.ok(r.body.me, 'requesting user should have their own standing returned');
});

test('leaderboard requires auth', async () => {
  const r = await call('/api/results/leaderboard');
  assert.equal(r.status, 401);
});

// ---- GET /api/results/:id ------------------------------------------------

test("a user can fetch their own result by id, but not another user's", async () => {
  const saved = await call('/api/results', { method: 'POST', token: userToken, body: { answers: fullAnswers } });
  assert.equal(saved.status, 201);
  const id = saved.body.resultId;

  const mine = await call(`/api/results/${id}`, { token: userToken });
  assert.equal(mine.status, 200);
  assert.equal(mine.body.result.id, id);

  const asAdmin = await call(`/api/results/${id}`, { token: adminToken });
  assert.equal(asAdmin.status, 404, "another user's result id should 404, not reveal it exists");
});

test('fetching an unknown or invalid result id 404s / 400s appropriately', async () => {
  const unknown = await call('/api/results/999999', { token: userToken });
  assert.equal(unknown.status, 404);
  const invalid = await call('/api/results/not-a-number', { token: userToken });
  assert.equal(invalid.status, 400);
});

// ---- PER-008: personal learning reminders --------------------------------

test('reminders default off, and status reports not due when disabled', async () => {
  const me = await call('/api/auth/me', { token: userToken });
  assert.equal(me.body.user.remindersEnabled, false);
  assert.equal(me.body.user.reminderFrequency, 'weekly');

  const status = await call('/api/reminders/status', { token: userToken });
  assert.equal(status.status, 200);
  assert.equal(status.body.due, false);
});

test('reminder frequency rejects an invalid value', async () => {
  const r = await call('/api/auth/profile', { method: 'PATCH', token: userToken, body: { reminderFrequency: 'daily' } });
  assert.equal(r.status, 400);
});

test('enabling reminders with unfinished journey steps reports due, then throttles by frequency', async () => {
  await call('/api/auth/profile', { method: 'PATCH', token: userToken, body: { remindersEnabled: true, reminderFrequency: 'weekly' } });

  const saved = await call('/api/results', { method: 'POST', token: userToken, body: { answers: fullAnswers } });
  const winnerKey = saved.body.result.persona.key;

  const first = await call('/api/reminders/status', { token: userToken });
  assert.equal(first.body.due, true);
  assert.equal(first.body.personaKey, winnerKey);
  assert.equal(first.body.stepIndex, 0, 'with nothing completed yet, the next step should be index 0');
  assert.equal(typeof first.body.stepTitle, 'string');

  const second = await call('/api/reminders/status', { token: userToken });
  assert.equal(second.body.due, false);

  await call('/api/auth/profile', { method: 'PATCH', token: userToken, body: { remindersEnabled: false } });
});

test('completing the whole journey means no reminder is due', async () => {
  const saved = await call('/api/results', { method: 'POST', token: userToken, body: { answers: fullAnswers } });
  const winnerKey = saved.body.result.persona.key;
  const totalSteps = saved.body.result.persona.journey.length;

  await call('/api/auth/profile', { method: 'PATCH', token: userToken, body: { remindersEnabled: true } });

  for (let i = 0; i < totalSteps; i++) {
    await call('/api/progress/toggle', { method: 'POST', token: userToken, body: { personaKey: winnerKey, stepIndex: i } });
  }

  const status = await call('/api/reminders/status', { token: userToken });
  assert.equal(status.body.due, false, 'a fully completed journey should never trigger a reminder');

  // clean up: this test intentionally completes every step, which would
  // otherwise leak into any later test that expects an incomplete journey
  // for this same user (fullAnswers always scores the same persona)
  for (let i = 0; i < totalSteps; i++) {
    await call('/api/progress/toggle', { method: 'POST', token: userToken, body: { personaKey: winnerKey, stepIndex: i } });
  }
  await call('/api/auth/profile', { method: 'PATCH', token: userToken, body: { remindersEnabled: false } });
});

test('reminders require auth', async () => {
  const r = await call('/api/reminders/status');
  assert.equal(r.status, 401);
});

// ---- PER-009: dynamic learning recommendations ---------------------------

test('recommendations require auth', async () => {
  const r = await call('/api/recommendations');
  assert.equal(r.status, 401);
});

test('a user with no saved result gets an empty recommendation list, not an error', async () => {
  // register a brand-new user with no results at all
  const email = `noresult_${Date.now()}@test.local`;
  const reg = await call('/api/auth/register', { method: 'POST', body: { email, password: 'password123', name: 'No Result User' } });
  assert.equal(reg.status, 201);
  const freshToken = reg.body.token;

  const r = await call('/api/recommendations', { token: freshToken });
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.recommendations, []);
  assert.equal(r.body.personaKey, null);
});

test('recommendations exclude journey steps already marked complete', async () => {
  const saved = await call('/api/results', { method: 'POST', token: userToken, body: { answers: fullAnswers } });
  const winnerKey = saved.body.result.persona.key;
  const totalSteps = saved.body.result.persona.journey.length;

  const before = await call('/api/recommendations', { token: userToken });
  assert.equal(before.status, 200);
  assert.equal(before.body.personaKey, winnerKey);
  const journeyItemsBefore = before.body.recommendations.filter((r) => r.type === 'journey_step');
  assert.ok(journeyItemsBefore.some((r) => r.stepIndex === 0), 'step 0 should be recommended before it is completed');

  await call('/api/progress/toggle', { method: 'POST', token: userToken, body: { personaKey: winnerKey, stepIndex: 0 } });

  const after = await call('/api/recommendations', { token: userToken });
  const journeyItemsAfter = after.body.recommendations.filter((r) => r.type === 'journey_step');
  assert.ok(!journeyItemsAfter.some((r) => r.stepIndex === 0), 'a completed step must never appear as a recommended next action');

  // clean up
  await call('/api/progress/toggle', { method: 'POST', token: userToken, body: { personaKey: winnerKey, stepIndex: 0 } });
});

test('every recommendation includes a human-readable reason', async () => {
  await call('/api/results', { method: 'POST', token: userToken, body: { answers: fullAnswers } });
  const r = await call('/api/recommendations', { token: userToken });
  assert.ok(r.body.recommendations.length > 0);
  for (const item of r.body.recommendations) {
    assert.equal(typeof item.reason, 'string');
    assert.ok(item.reason.length > 0, 'every recommendation must say why it was recommended');
  }
});

test('completing every journey step removes all journey recommendations, leaving only resources (if any)', async () => {
  const saved = await call('/api/results', { method: 'POST', token: userToken, body: { answers: fullAnswers } });
  const winnerKey = saved.body.result.persona.key;
  const totalSteps = saved.body.result.persona.journey.length;

  for (let i = 0; i < totalSteps; i++) {
    await call('/api/progress/toggle', { method: 'POST', token: userToken, body: { personaKey: winnerKey, stepIndex: i } });
  }

  const r = await call('/api/recommendations', { token: userToken });
  assert.ok(!r.body.recommendations.some((item) => item.type === 'journey_step'));

  // clean up — see the equivalent note in the reminders test above
  for (let i = 0; i < totalSteps; i++) {
    await call('/api/progress/toggle', { method: 'POST', token: userToken, body: { personaKey: winnerKey, stepIndex: i } });
  }
});

test('published resources for the matched persona appear in recommendations, draft ones do not', async () => {
  const saved = await call('/api/results', { method: 'POST', token: userToken, body: { answers: fullAnswers } });
  const winnerKey = saved.body.result.persona.key;

  const pub = await call('/api/admin/learning-resources', {
    method: 'POST', token: adminToken,
    body: { title: 'Reco Published', type: 'link', url: 'https://example.com/reco-pub', personaKeys: [winnerKey] },
  });
  await call(`/api/admin/learning-resources/${pub.body.resource.id}/status`, { method: 'PATCH', token: adminToken, body: { status: 'published' } });

  await call('/api/admin/learning-resources', {
    method: 'POST', token: adminToken,
    body: { title: 'Reco Draft', type: 'link', url: 'https://example.com/reco-draft', personaKeys: [winnerKey] },
  });

  const r = await call('/api/recommendations', { token: userToken });
  const titles = r.body.recommendations.map((item) => item.title);
  assert.ok(titles.includes('Reco Published'));
  assert.ok(!titles.includes('Reco Draft'));
});
