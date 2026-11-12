import crypto from "node:crypto";

const SORT_COLUMNS = {
  createdAt: "created_at",
  title: "title",
  author: "author",
  priceCents: "price_cents",
  stock: "stock",
  publishedYear: "published_year",
};

const ORDER_DIRECTIONS = {
  asc: "ASC",
  desc: "DESC",
};

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    isbn: row.isbn,
    genre: row.genre,
    priceCents: row.price_cents,
    stock: row.stock,
    publishedYear: row.published_year,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class BookRepository {
  #db;

  constructor(db) {
    this.#db = db;
  }

  findById(id) {
    const stmt = this.#db.prepare("SELECT * FROM books WHERE id = ?");
    return mapRow(stmt.get(id));
  }

  findByIsbn(isbn) {
    const stmt = this.#db.prepare("SELECT * FROM books WHERE isbn = ?");
    return mapRow(stmt.get(isbn));
  }

  findAll({ q, genre, page = 1, limit = 12, sort = "createdAt", order = "desc" } = {}) {
    const conditions = [];
    const params = [];

    if (q) {
      conditions.push("(title LIKE ? OR author LIKE ? OR isbn LIKE ?)");
      const likeTerm = `%${q}%`;
      params.push(likeTerm, likeTerm, likeTerm);
    }

    if (genre) {
      conditions.push("genre = ?");
      params.push(genre);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const sortColumn = SORT_COLUMNS[sort] ?? "created_at";
    const orderDirection = ORDER_DIRECTIONS[order] ?? "DESC";
    const offset = (page - 1) * limit;

    const countStmt = this.#db.prepare(`SELECT COUNT(*) AS total FROM books ${whereClause}`);
    const { total } = countStmt.get(...params);

    const listStmt = this.#db.prepare(
      `SELECT * FROM books ${whereClause} ORDER BY ${sortColumn} ${orderDirection}, rowid ${orderDirection} LIMIT ? OFFSET ?`,
    );
    const rows = listStmt.all(...params, limit, offset);

    return {
      items: rows.map(mapRow),
      total,
    };
  }

  create(data) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const stmt = this.#db.prepare(`
      INSERT INTO books (
        id, title, author, isbn, genre, price_cents, stock, published_year, description, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.title,
      data.author,
      data.isbn,
      data.genre,
      data.priceCents,
      data.stock,
      data.publishedYear,
      data.description ?? "",
      now,
      now,
    );

    return this.findById(id);
  }

  update(id, updates) {
    const existing = this.findById(id);
    if (!existing) return null;

    const fieldMap = {
      title: "title",
      author: "author",
      isbn: "isbn",
      genre: "genre",
      priceCents: "price_cents",
      stock: "stock",
      publishedYear: "published_year",
      description: "description",
    };

    const assignments = [];
    const values = [];

    for (const [key, column] of Object.entries(fieldMap)) {
      if (updates[key] !== undefined) {
        assignments.push(`${column} = ?`);
        values.push(updates[key]);
      }
    }

    if (assignments.length === 0) {
      return existing;
    }

    const now = new Date().toISOString();
    assignments.push("updated_at = ?");
    values.push(now, id);

    const stmt = this.#db.prepare(`UPDATE books SET ${assignments.join(", ")} WHERE id = ?`);
    stmt.run(...values);

    return this.findById(id);
  }

  remove(id) {
    const stmt = this.#db.prepare("DELETE FROM books WHERE id = ?");
    const result = stmt.run(id);
    return result.changes > 0;
  }

  getStats() {
    const summaryStmt = this.#db.prepare(`
      SELECT
        COUNT(*) AS totalTitles,
        COALESCE(SUM(stock), 0) AS totalUnits,
        COALESCE(SUM(CASE WHEN stock <= 3 THEN 1 ELSE 0 END), 0) AS lowStockCount
      FROM books
    `);
    const summary = summaryStmt.get();

    const genreStmt = this.#db.prepare("SELECT DISTINCT genre FROM books ORDER BY genre ASC");
    const genres = genreStmt.all().map((row) => row.genre);

    return {
      totalTitles: summary.totalTitles,
      totalUnits: summary.totalUnits,
      lowStockCount: summary.lowStockCount,
      genres,
    };
  }
}
