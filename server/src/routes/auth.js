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
  res.json({ user: publicUser(row) });
});

export default router;
