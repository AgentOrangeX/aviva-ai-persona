import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/index.js';
import { signToken, requireAuth } from '../middleware/auth.js';
import { config } from '../lib/config.js';
import {
  isEmail,
  isNonEmptyString,
  isStrongEnoughPassword,
  sanitiseString,
} from '../lib/validate.js';

const router = Router();

function publicUser(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    jobTitle: row.job_title,
    businessArea: row.business_area,
    role: row.role,
  };
}

// Read-only account summary: join date, how many results, latest persona.
function accountStats(userId) {
  const u = db.prepare('SELECT created_at FROM users WHERE id = ?').get(userId);
  const count = db.prepare('SELECT COUNT(*) n FROM results WHERE user_id = ?').get(userId).n;
  const latest = db
    .prepare('SELECT persona, created_at FROM results WHERE user_id = ? ORDER BY created_at DESC LIMIT 1')
    .get(userId);
  return {
    joinedAt: u?.created_at || null,
    resultCount: count,
    latestPersona: latest?.persona || null,
    latestAt: latest?.created_at || null,
  };
}

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { email, password, name, jobTitle, businessArea } = req.body || {};

  if (!isEmail(email)) return res.status(400).json({ error: 'A valid email is required.' });
  if (!isStrongEnoughPassword(password)) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  if (!isNonEmptyString(name)) return res.status(400).json({ error: 'Your name is required.' });

  const normEmail = email.trim().toLowerCase();
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(normEmail);
  if (exists) return res.status(409).json({ error: 'An account with this email already exists.' });

  const hash = bcrypt.hashSync(password, config.bcryptRounds);
  const info = db
    .prepare(
      `INSERT INTO users (email, password_hash, name, job_title, business_area, role)
       VALUES (?, ?, ?, ?, ?, 'user')`
    )
    .run(
      normEmail,
      hash,
      sanitiseString(name),
      sanitiseString(jobTitle),
      sanitiseString(businessArea)
    );

  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  const token = signToken(row);
  res.status(201).json({ token, user: publicUser(row) });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!isEmail(email) || typeof password !== 'string') {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase());
  // constant-ish response to avoid leaking which part failed
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: 'Email or password is incorrect.' });
  }
  const token = signToken(row);
  res.json({ token, user: publicUser(row) });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.sub);
  if (!row) return res.status(404).json({ error: 'User not found.' });
  res.json({ user: publicUser(row), stats: accountStats(row.id) });
});

// PATCH /api/auth/profile — update name, job title, business area, and/or email.
// Email changes require it to be unique. Returns a fresh token since the token
// embeds name/email.
router.patch('/profile', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.sub);
  if (!row) return res.status(404).json({ error: 'User not found.' });

  const { name, jobTitle, businessArea, email } = req.body || {};

  if (name !== undefined && !isNonEmptyString(name)) {
    return res.status(400).json({ error: 'Your name cannot be empty.' });
  }

  let nextEmail = row.email;
  if (email !== undefined && email.trim().toLowerCase() !== row.email) {
    if (!isEmail(email)) return res.status(400).json({ error: 'A valid email is required.' });
    nextEmail = email.trim().toLowerCase();
    const clash = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(nextEmail, row.id);
    if (clash) return res.status(409).json({ error: 'That email is already in use by another account.' });
  }

  db.prepare(
    `UPDATE users
       SET name = ?, job_title = ?, business_area = ?, email = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    name !== undefined ? sanitiseString(name) : row.name,
    jobTitle !== undefined ? sanitiseString(jobTitle) : row.job_title,
    businessArea !== undefined ? sanitiseString(businessArea) : row.business_area,
    nextEmail,
    row.id
  );

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(row.id);
  const token = signToken(updated); // name/email may have changed
  res.json({ user: publicUser(updated), stats: accountStats(updated.id), token });
});

// POST /api/auth/change-password — requires current password.
router.post('/change-password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.sub);
  if (!row) return res.status(404).json({ error: 'User not found.' });

  if (typeof currentPassword !== 'string' || !bcrypt.compareSync(currentPassword, row.password_hash)) {
    return res.status(401).json({ error: 'Your current password is incorrect.' });
  }
  if (!isStrongEnoughPassword(newPassword)) {
    return res.status(400).json({ error: 'New password must be at least 8 characters.' });
  }

  const hash = bcrypt.hashSync(newPassword, config.bcryptRounds);
  db.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").run(hash, row.id);
  res.json({ ok: true });
});

export default router;
