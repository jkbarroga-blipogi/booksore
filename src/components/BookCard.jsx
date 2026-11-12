import { BookCover } from "./BookCover.jsx";
import { formatPrice } from "../utils/format.js";

function StockBadge({ stock }) {
  if (stock === 0) {
    return <span className="stock-badge out">Out of stock</span>;
  }
  if (stock <= 3) {
    return <span className="stock-badge low">Only {stock} left</span>;
  }
  return <span className="stock-badge in">{stock} in stock</span>;
}

export function BookCard({ book, cartQty, onInspect, onAddToCart }) {
  const isOutOfStock = book.stock === 0;
  const reachedMax = cartQty >= book.stock;

  return (
    <article className="book-card">
      <div className="book-cover-wrap">
        <BookCover book={book} />
        {book.featured && <span className="badge-featured">Featured</span>}
      </div>

      <div className="book-body">
        <div className="book-meta-row">
          <span className="genre-chip">{book.genre}</span>
          <span>{book.publishedYear}</span>
        </div>

        <h3 className="book-title">{book.title}</h3>
        <p className="book-author">{book.author}</p>

        <div className="book-footer">
          <span className="book-price">{formatPrice(book.priceCents)}</span>
          <StockBadge stock={book.stock} />
        </div>

        <div className="card-actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => onInspect(book)}>
            Details
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={isOutOfStock || reachedMax}
            onClick={() => onAddToCart(book)}
          >
            {isOutOfStock ? "Out of stock" : reachedMax ? "Max in cart" : "Add to cart"}
          </button>
        </div>
      </div>
    </article>
  );
}
