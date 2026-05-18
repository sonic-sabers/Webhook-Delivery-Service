import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

let db: Database.Database;

export function getDb(): Database.Database {
  return db;
}

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
