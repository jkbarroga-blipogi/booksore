import crypto from "node:crypto";

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    createdAt: row.created_at,
  };
}

export class UserRepository {
  #db;

  constructor(db) {
    this.#db = db;
  }

  findByEmail(email) {
    if (!email) return null;
    const stmt = this.#db.prepare("SELECT * FROM users WHERE email = ?");
    return mapUser(stmt.get(email.toLowerCase()));
  }

  findByUsername(username) {
    if (!username) return null;
    const stmt = this.#db.prepare("SELECT * FROM users WHERE username = ?");
    return mapUser(stmt.get(username.toLowerCase()));
  }

  findByUsernameOrEmail(identifier) {
    if (!identifier) return null;
    const lowered = identifier.toLowerCase();
    const stmt = this.#db.prepare("SELECT * FROM users WHERE username = ? OR email = ?");
    return mapUser(stmt.get(lowered, lowered));
  }

  findById(id) {
    const stmt = this.#db.prepare("SELECT * FROM users WHERE id = ?");
    return mapUser(stmt.get(id));
  }

  countAdmins() {
    const stmt = this.#db.prepare("SELECT COUNT(*) AS total FROM users WHERE role = 'admin'");
    return stmt.get().total;
  }

  createCustomer({ username, passwordHash }) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const stmt = this.#db.prepare(`
      INSERT INTO users (id, username, password_hash, role, created_at)
      VALUES (?, ?, ?, 'customer', ?)
    `);
    stmt.run(id, username.toLowerCase(), passwordHash, now);
    return this.findById(id);
  }

  createAdmin({ username = "admin", email, passwordHash }) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const normalizedUsername = username ? username.toLowerCase() : null;
    const normalizedEmail = email ? email.toLowerCase() : null;
    const stmt = this.#db.prepare(`
      INSERT INTO users (id, username, email, password_hash, role, created_at)
      VALUES (?, ?, ?, ?, 'admin', ?)
    `);
    stmt.run(id, normalizedUsername, normalizedEmail, passwordHash, now);
    return this.findById(id);
  }
}
