import { useEffect, useState } from "react";

const EMPTY_FORM = {
  title: "",
  author: "",
  isbn: "",
  genre: "",
  priceDollars: "",
  stock: "0",
  publishedYear: String(new Date().getFullYear()),
  coverUrl: "",
  description: "",
  featured: false,
};

function toFormState(book) {
  if (!book) return EMPTY_FORM;
  return {
    title: book.title,
    author: book.author,
    isbn: book.isbn,
    genre: book.genre,
    priceDollars: (book.priceCents / 100).toFixed(2),
    stock: String(book.stock),
    publishedYear: String(book.publishedYear),
    coverUrl: book.coverUrl || "",
    description: book.description || "",
    featured: Boolean(book.featured),
  };
}

export function BookFormModal({ isOpen, editingBook, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(toFormState(editingBook));
      setFieldErrors({});
      setServerError("");
    }
  }, [isOpen, editingBook]);

  if (!isOpen) return null;

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function validateClient() {
    const errors = {};
    if (!form.title.trim()) errors.title = "Title is required";
    if (!form.author.trim()) errors.author = "Author is required";
    const cleanIsbn = form.isbn.replace(/[\s-]+/g, "").toUpperCase();
    if (!/^(?:\d{9}[\dX]|\d{13})$/.test(cleanIsbn)) {
      errors.isbn = "Enter a valid 10-digit or 13-digit ISBN";
    }
    if (!form.genre.trim()) errors.genre = "Genre is required";
    const priceNum = Number(form.priceDollars);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      errors.priceCents = "Price must be 0 or greater";
    }
    const stockNum = Number(form.stock);
    if (!Number.isInteger(stockNum) || stockNum < 0) {
      errors.stock = "Stock must be a non-negative whole number";
    }
    const yearNum = Number(form.publishedYear);
    if (!Number.isInteger(yearNum) || yearNum < 1450 || yearNum > 2100) {
      errors.publishedYear = "Year must be between 1450 and 2100";
    }
    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError("");

    const clientErrors = validateClient();
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

    setSubmitting(true);
    try {
      await onSave({
        title: form.title.trim(),
        author: form.author.trim(),
        isbn: form.isbn.trim(),
        genre: form.genre.trim(),
        priceCents: Math.round(Number(form.priceDollars) * 100),
        stock: Number(form.stock),
        publishedYear: Number(form.publishedYear),
        coverUrl: form.coverUrl.trim(),
        description: form.description.trim(),
        featured: form.featured,
      });
      onClose();
    } catch (err) {
      setServerError(err.message || "Failed to save book");
      if (Array.isArray(err.details)) {
        const mapped = {};
        for (const issue of err.details) {
          if (issue.path) mapped[issue.path] = issue.message;
        }
        setFieldErrors(mapped);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="book-form-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-panel">
        <div className="modal-header">
          <h2 id="book-form-title" className="modal-title">
            {editingBook ? "Edit Book" : "Add New Book"}
          </h2>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close form">
            x
          </button>
        </div>

        {serverError && (
          <div className="alert alert-error" role="alert">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            <label className="form-field full">
              <span className="field-label">Title</span>
              <input
                className="input"
                type="text"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                required
              />
              {fieldErrors.title && <span className="field-error">{fieldErrors.title}</span>}
            </label>

            <label className="form-field">
              <span className="field-label">Author</span>
              <input
                className="input"
                type="text"
                value={form.author}
                onChange={(e) => setField("author", e.target.value)}
                required
              />
              {fieldErrors.author && <span className="field-error">{fieldErrors.author}</span>}
            </label>

            <label className="form-field">
              <span className="field-label">ISBN (10 or 13 digits)</span>
              <input
                className="input"
                type="text"
                value={form.isbn}
                onChange={(e) => setField("isbn", e.target.value)}
                placeholder="9780135957059"
                required
              />
              {fieldErrors.isbn && <span className="field-error">{fieldErrors.isbn}</span>}
            </label>

            <label className="form-field">
              <span className="field-label">Genre</span>
              <input
                className="input"
                type="text"
                value={form.genre}
                onChange={(e) => setField("genre", e.target.value)}
                placeholder="Literary Fiction"
                required
              />
              {fieldErrors.genre && <span className="field-error">{fieldErrors.genre}</span>}
            </label>

            <label className="form-field">
              <span className="field-label">Price (USD)</span>
              <input
                className="input"
                type="number"
                step="0.01"
                min="0"
                value={form.priceDollars}
                onChange={(e) => setField("priceDollars", e.target.value)}
                placeholder="19.99"
                required
              />
              {fieldErrors.priceCents && (
                <span className="field-error">{fieldErrors.priceCents}</span>
              )}
            </label>

            <label className="form-field">
              <span className="field-label">Stock</span>
              <input
                className="input"
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={(e) => setField("stock", e.target.value)}
                required
              />
              {fieldErrors.stock && <span className="field-error">{fieldErrors.stock}</span>}
            </label>

            <label className="form-field">
              <span className="field-label">Published Year</span>
              <input
                className="input"
                type="number"
                min="1450"
                max="2100"
                step="1"
                value={form.publishedYear}
                onChange={(e) => setField("publishedYear", e.target.value)}
                required
              />
              {fieldErrors.publishedYear && (
                <span className="field-error">{fieldErrors.publishedYear}</span>
              )}
            </label>

            <label className="form-field full">
              <span className="field-label">Cover Image URL (optional)</span>
              <input
                className="input"
                type="url"
                value={form.coverUrl}
                onChange={(e) => setField("coverUrl", e.target.value)}
                placeholder="https://example.com/cover.jpg"
              />
              {fieldErrors.coverUrl && (
                <span className="field-error">{fieldErrors.coverUrl}</span>
              )}
            </label>

            <label className="form-field full">
              <span className="field-label">Description</span>
              <textarea
                className="textarea"
                rows={3}
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
              />
              {fieldErrors.description && (
                <span className="field-error">{fieldErrors.description}</span>
              )}
            </label>

            <label className="form-field full" style={{ flexDirection: "row", alignItems: "center", gap: "8px" }}>
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setField("featured", e.target.checked)}
              />
              <span className="field-label">Feature this book on storefront highlights</span>
            </label>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "18px" }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Saving..." : editingBook ? "Save Changes" : "Create Book"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
