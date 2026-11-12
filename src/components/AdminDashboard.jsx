import { useState } from "react";
import { formatPrice } from "../utils/format.js";

export function AdminDashboard({
  adminUser,
  books,
  stats,
  onLogin,
  onAddBook,
  onEditBook,
  onDeleteBook,
  onQuickUpdate,
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  async function handleLoginSubmit(e) {
    e.preventDefault();
    setAuthError("");
    setLoggingIn(true);
    try {
      await onLogin({ email, password });
      setPassword("");
    } catch (err) {
      setAuthError(err.message || "Sign in failed");
    } finally {
      setLoggingIn(false);
    }
  }

  if (!adminUser) {
    return (
      <section className="login-card" aria-labelledby="admin-signin-title">
        <h2 id="admin-signin-title" className="modal-title" style={{ marginBottom: "8px" }}>
          Admin Sign In
        </h2>
        <p style={{ margin: "0 0 18px", color: "var(--ink-secondary)", fontSize: "0.9rem" }}>
          Sign in with your configured store admin account to create, edit, restock, or remove
          books.
        </p>

        {authError && (
          <div className="alert alert-error" role="alert">
            {authError}
          </div>
        )}

        <form onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <label className="form-field">
            <span className="field-label">Admin Email</span>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@booksore.local"
              required
            />
          </label>

          <label className="form-field">
            <span className="field-label">Password</span>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <button type="submit" className="btn btn-primary" disabled={loggingIn}>
            {loggingIn ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </section>
    );
  }

  return (
    <section className="admin-panel" aria-labelledby="admin-heading">
      <div className="admin-header-bar">
        <div>
          <h2 id="admin-heading" className="section-title">
            Admin Inventory Dashboard
          </h2>
          <p style={{ margin: "4px 0 0", color: "var(--ink-secondary)", fontSize: "0.9rem" }}>
            Signed in as {adminUser.email}
          </p>
        </div>

        <button type="button" className="btn btn-primary" onClick={onAddBook}>
          + Add Book
        </button>
      </div>

      <div className="admin-kpis">
        <div className="metric-box">
          <div className="metric-value">{stats.totalTitles}</div>
          <div className="metric-label">Total Titles</div>
        </div>
        <div className="metric-box">
          <div className="metric-value">{stats.totalUnits}</div>
          <div className="metric-label">Total Units</div>
        </div>
        <div className="metric-box">
          <div className="metric-value">{stats.lowStockCount}</div>
          <div className="metric-label">Low Stock (1 to 3)</div>
        </div>
        <div className="metric-box">
          <div className="metric-value">{stats.outOfStockCount}</div>
          <div className="metric-label">Out of Stock</div>
        </div>
      </div>

      <div className="table-wrap">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Title & Author</th>
              <th>ISBN</th>
              <th>Genre</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Featured</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {books.map((book) => (
              <tr key={book.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{book.title}</div>
                  <div style={{ fontSize: "0.82rem", color: "var(--ink-muted)" }}>{book.author}</div>
                </td>
                <td style={{ fontVariantNumeric: "tabular-nums" }}>{book.isbn}</td>
                <td>{book.genre}</td>
                <td style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
                  {formatPrice(book.priceCents)}
                </td>
                <td>
                  <div className="qty-stepper">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      aria-label={`Decrease stock for ${book.title}`}
                      disabled={book.stock <= 0}
                      onClick={() => onQuickUpdate(book.id, { stock: Math.max(0, book.stock - 1) })}
                    >
                      -
                    </button>
                    <span style={{ minWidth: "24px", textAlign: "center", fontWeight: 600 }}>
                      {book.stock}
                    </span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      aria-label={`Increase stock for ${book.title}`}
                      onClick={() => onQuickUpdate(book.id, { stock: book.stock + 1 })}
                    >
                      +
                    </button>
                  </div>
                </td>
                <td>
                  <button
                    type="button"
                    className={`btn btn-sm ${book.featured ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => onQuickUpdate(book.id, { featured: !book.featured })}
                  >
                    {book.featured ? "Featured" : "Standard"}
                  </button>
                </td>
                <td>
                  <div className="row-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => onEditBook(book)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => onDeleteBook(book)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
