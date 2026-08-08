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
