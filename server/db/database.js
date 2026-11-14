import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS books (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    isbn TEXT NOT NULL UNIQUE,
    genre TEXT NOT NULL,
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
    stock INTEGER NOT NULL CHECK (stock >= 0),
    published_year INTEGER NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    cover_url TEXT NOT NULL DEFAULT '',
    featured INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    total_cents INTEGER NOT NULL,
    items_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_books_genre ON books (genre);
  CREATE INDEX IF NOT EXISTS idx_books_featured ON books (featured);
  CREATE INDEX IF NOT EXISTS idx_books_created_at ON books (created_at);
  CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders (user_id);
`;

function migrateSchema(db) {
  const userColumns = db.prepare("PRAGMA table_info(users)").all();
  const hasUsername = userColumns.some((col) => col.name === "username");
  if (!hasUsername) {
    db.exec("ALTER TABLE users ADD COLUMN username TEXT;");
    db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users (username);");
  }
}

export function createDatabase(dbPath = "./data/booksore.db") {
  if (dbPath !== ":memory:") {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }

  const db = new DatabaseSync(dbPath);

  if (dbPath !== ":memory:") {
    db.exec("PRAGMA journal_mode = WAL;");
    db.exec("PRAGMA synchronous = NORMAL;");
  }

  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("PRAGMA busy_timeout = 5000;");
  db.exec(SCHEMA_SQL);
  migrateSchema(db);

  return db;
}
