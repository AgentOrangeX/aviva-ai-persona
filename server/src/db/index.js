/**
 * Database access layer.
 *
 * Primary driver: better-sqlite3 (fast, synchronous, ships prebuilt binaries).
 * Fallback driver: Node's built-in node:sqlite (Node >= 22.5), used automatically
 * when better-sqlite3 cannot be loaded (e.g. a CI box without a native toolchain).
 *
 * Both expose the small synchronous surface the app needs:
 *   db.prepare(sql).get(...args)  -> row | undefined
 *   db.prepare(sql).all(...args)  -> row[]
 *   db.prepare(sql).run(...args)  -> { lastInsertRowid }
 *   db.exec(sql)
 *   db.transaction(fn)            -> callable
 *   db.pragma(str)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '..', '..', 'data', 'app.db');
// Only create a directory for file-backed databases (not :memory:).
if (DB_PATH !== ':memory:') {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

let db;

try {
  const { default: Database } = await import('better-sqlite3');
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
} catch (err) {
  // Fallback: built-in node:sqlite with a better-sqlite3-compatible shim.
  const { DatabaseSync } = await import('node:sqlite');
  const raw = new DatabaseSync(DB_PATH);
  raw.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

  db = {
    _raw: raw,
    prepare(sql) {
      const stmt = raw.prepare(sql);
      return {
        get: (...a) => stmt.get(...a),
        all: (...a) => stmt.all(...a),
        run: (...a) => {
          const r = stmt.run(...a);
          return { lastInsertRowid: r.lastInsertRowid, changes: r.changes };
        },
      };
    },
    exec: (sql) => raw.exec(sql),
    pragma: (p) => raw.exec('PRAGMA ' + p + ';'),
    transaction(fn) {
      return (...args) => {
        raw.exec('BEGIN');
        try {
          const out = fn(...args);
          raw.exec('COMMIT');
          return out;
        } catch (e) {
          raw.exec('ROLLBACK');
          throw e;
        }
      };
    },
  };
  console.warn('[db] better-sqlite3 unavailable; using built-in node:sqlite fallback.');
}

// bootstrap schema
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

export default db;
