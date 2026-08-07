import jwt from 'jsonwebtoken';
import { config } from '../lib/config.js';
import db from '../db/index.js';

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, email: user.email, name: user.name },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

function readToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  return null;
}

/** Populates req.user if a valid token is present; never blocks. */
export function attachUser(req, _res, next) {
  const token = readToken(req);
  if (token) {
    try {
      req.user = jwt.verify(token, config.jwtSecret);
    } catch {
      req.user = null;
    }
  }
  next();
}

/** Requires a logged-in user. */
export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
  next();
}

/**
 * Requires the admin role. Order after requireAuth.
 *
 * Deliberately re-reads the role from the database rather than trusting the
 * JWT's `role` claim: tokens live for config.jwtExpiresIn (7 days by
 * default), so if we only checked the claim, revoking someone's admin
 * access would not take effect until their existing token expired. Grants
 * take effect immediately either way, since a fresh grant is a superset of
 * what the stale claim already allowed.
 */
export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
  const row = db.prepare('SELECT role FROM users WHERE id = ?').get(req.user.sub);
  if (!row) return res.status(401).json({ error: 'Authentication required.' });
  if (row.role !== 'admin') return res.status(403).json({ error: 'Administrator access only.' });
  next();
}
