import crypto from "node:crypto";

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
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
    const stmt = this.#db.prepare("SELECT * FROM users WHERE email = ?");
    return mapUser(stmt.get(email.toLowerCase()));
  }

  findById(id) {
    const stmt = this.#db.prepare("SELECT * FROM users WHERE id = ?");
    return mapUser(stmt.get(id));
  }

  countAdmins() {
    const stmt = this.#db.prepare("SELECT COUNT(*) AS total FROM users WHERE role = 'admin'");
    return stmt.get().total;
  }

  createAdmin({ email, passwordHash }) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const stmt = this.#db.prepare(`
      INSERT INTO users (id, email, password_hash, role, created_at)
      VALUES (?, ?, ?, 'admin', ?)
    `);
    stmt.run(id, email.toLowerCase(), passwordHash, now);
    return this.findById(id);
  }
}
