import bcrypt from 'bcryptjs';
import { createApp } from './app.js';
import { config, assertProductionConfig } from './lib/config.js';
import db from './db/index.js';

/** Seed the first admin from environment variables, idempotently. */
function seedAdmin() {
  const { email, password, name } = config.admin;
  if (!email || !password) {
    console.warn('[seed] ADMIN_EMAIL / ADMIN_PASSWORD not set — no admin seeded.');
    return;
  }
  const normEmail = email.trim().toLowerCase();
  const existing = db.prepare('SELECT id, role FROM users WHERE email = ?').get(normEmail);
  if (existing) {
    if (existing.role !== 'admin') {
      db.prepare('UPDATE users SET role = ? WHERE id = ?').run('admin', existing.id);
      console.log(`[seed] Promoted existing user to admin: ${normEmail}`);
    }
    return;
  }
  const hash = bcrypt.hashSync(password, config.bcryptRounds);
  db.prepare(
    `INSERT INTO users (email, password_hash, name, job_title, business_area, role)
     VALUES (?, ?, ?, 'Administrator', 'Platform', 'admin')`
  ).run(normEmail, hash, name);
  console.log(`[seed] Admin account created: ${normEmail}`);
}

assertProductionConfig();
seedAdmin();

const app = createApp();
app.listen(config.port, () => {
  console.log(`Aviva AI Persona API listening on http://localhost:${config.port} (${config.nodeEnv})`);
});
