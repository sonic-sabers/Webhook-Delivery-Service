import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Module-level singleton. better-sqlite3 is synchronous and not safe to share
 * across threads, but Node.js is single-threaded, so one instance is correct.
 */
let db: Database.Database;

export function getDb(): Database.Database {
  return db;
}

/**
 * Initialises the SQLite database and applies the schema (idempotent via IF NOT EXISTS).
 *
 * WAL mode allows concurrent readers while a writer holds the lock — critical for
 * the worker (writer) and HTTP handlers (readers) running in the same process.
 *
 * @param dbPath Filesystem path or ':memory:' for in-memory (used in tests).
 */
export function initDb(dbPath: string): void {
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const schema = fs.readFileSync(
    path.join(__dirname, 'schema.sql'),
    'utf-8'
  );
  db.exec(schema);
}
