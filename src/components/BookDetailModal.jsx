import { BookCover } from "./BookCover.jsx";
import { formatPrice } from "../utils/format.js";

export function BookDetailModal({ book, cartQty, onClose, onAddToCart }) {
  if (!book) return null;

  const isOutOfStock = book.stock === 0;
  const reachedMax = cartQty >= book.stock;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-panel">
        <div className="modal-header">
          <h2 id="detail-modal-title" className="modal-title">
            {book.title}
          </h2>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close details">
            x
          </button>
        </div>

        <div className="book-cover-wrap" style={{ borderRadius: "10px", marginBottom: "16px" }}>
          <BookCover book={book} />
          {book.featured && <span className="badge-featured">Featured</span>}
        </div>

        <p style={{ margin: "0 0 6px", fontWeight: 600 }}>{book.author}</p>
        <p style={{ margin: "0 0 14px", fontSize: "0.88rem", color: "var(--ink-muted)" }}>
          {book.genre} | Published {book.publishedYear} | ISBN {book.isbn}
        </p>

        <p style={{ margin: "0 0 18px", color: "var(--ink-secondary)" }}>
          {book.description || "No synopsis recorded for this edition."}
        </p>

        <div className="book-footer" style={{ paddingTop: "14px" }}>
          <div>
            <div className="book-price" style={{ fontSize: "1.3rem" }}>
              {formatPrice(book.priceCents)}
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--ink-muted)" }}>
              {book.stock === 0 ? "Currently out of stock" : `${book.stock} copies available`}
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            disabled={isOutOfStock || reachedMax}
            onClick={() => onAddToCart(book)}
          >
            {isOutOfStock ? "Out of stock" : reachedMax ? "Max in cart" : "Add to cart"}
          </button>
        </div>
      </div>
    </div>
  );
}
