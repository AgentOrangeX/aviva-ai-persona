import db from '../db/index.js';

/**
 * Records one admin action for the audit trail (PER-004). Always looks the
 * admin's current name up fresh from the DB rather than trusting the JWT's
 * name claim, which can go stale between login and action if they were
 * renamed in the meantime.
 */
export function logAdminAction({ adminId, action, targetUserId = null, targetName = null, details = {} }) {
  const admin = db.prepare('SELECT name FROM users WHERE id = ?').get(adminId);
  db.prepare(
    `INSERT INTO admin_audit_log (admin_user_id, admin_name, action, target_user_id, target_name, details_json)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(adminId, admin?.name || 'Unknown admin', action, targetUserId, targetName, JSON.stringify(details));
}

export function listAuditLog({ limit = 100 } = {}) {
  return db
    .prepare(
      `SELECT id, admin_name, action, target_name, details_json, created_at
       FROM admin_audit_log
       ORDER BY created_at DESC, id DESC
       LIMIT ?`
    )
    .all(limit)
    .map((r) => ({
      id: r.id,
      adminName: r.admin_name,
      action: r.action,
      targetName: r.target_name,
      details: JSON.parse(r.details_json),
      createdAt: r.created_at,
    }));
}
