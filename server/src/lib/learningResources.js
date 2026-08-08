import db from '../db/index.js';
import { PERSONA_KEYS } from './scoring.js';

export const RESOURCE_TYPES = ['document', 'video', 'link', 'platform_url'];
export const RESOURCE_STATUSES = ['draft', 'published', 'archived'];

export function isValidType(t) {
  return RESOURCE_TYPES.includes(t);
}
export function isValidStatus(s) {
  return RESOURCE_STATUSES.includes(s);
}
export function isValidPersonaKeys(keys) {
  return Array.isArray(keys) && keys.length > 0 && keys.every((k) => PERSONA_KEYS.includes(k));
}

function withPersonas(row) {
  const personas = db
    .prepare('SELECT persona_key FROM resource_personas WHERE resource_id = ? ORDER BY persona_key')
    .all(row.id)
    .map((r) => r.persona_key);
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type,
    url: row.url,
    status: row.status,
    personas,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listResources() {
  const rows = db.prepare('SELECT * FROM learning_resources ORDER BY updated_at DESC, id DESC').all();
  return rows.map(withPersonas);
}

export function getResource(id) {
  const row = db.prepare('SELECT * FROM learning_resources WHERE id = ?').get(id);
  return row ? withPersonas(row) : null;
}

function setPersonaAssignments(resourceId, personaKeys) {
  db.prepare('DELETE FROM resource_personas WHERE resource_id = ?').run(resourceId);
  const insert = db.prepare('INSERT INTO resource_personas (resource_id, persona_key) VALUES (?, ?)');
  for (const key of personaKeys) insert.run(resourceId, key);
}

export function createResource({ title, description, type, url, personaKeys, createdBy }) {
  const info = db
    .prepare(
      `INSERT INTO learning_resources (title, description, type, url, status, created_by)
       VALUES (?, ?, ?, ?, 'draft', ?)`
    )
    .run(title, description || null, type, url, createdBy);
  setPersonaAssignments(info.lastInsertRowid, personaKeys);
  return getResource(info.lastInsertRowid);
}

export function updateResource(id, { title, description, type, url, personaKeys }) {
  db.prepare(
    `UPDATE learning_resources
     SET title = ?, description = ?, type = ?, url = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(title, description || null, type, url, id);
  setPersonaAssignments(id, personaKeys);
  return getResource(id);
}

export function setResourceStatus(id, status) {
  db.prepare(`UPDATE learning_resources SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(status, id);
  return getResource(id);
}

export function deleteResource(id) {
  db.prepare('DELETE FROM learning_resources WHERE id = ?').run(id); // cascades to resource_personas
}

/** Published resources assigned to one persona — what a user actually sees. */
export function publishedResourcesForPersona(personaKey) {
  const rows = db
    .prepare(
      `SELECT lr.id, lr.title, lr.description, lr.type, lr.url, lr.updated_at
       FROM learning_resources lr
       JOIN resource_personas rp ON rp.resource_id = lr.id
       WHERE rp.persona_key = ? AND lr.status = 'published'
       ORDER BY lr.updated_at DESC, lr.id DESC`
    )
    .all(personaKey);
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    type: r.type,
    url: r.url,
    updatedAt: r.updated_at,
  }));
}
