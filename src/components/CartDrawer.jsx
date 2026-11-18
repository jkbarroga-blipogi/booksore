import { useState } from "react";
import { formatPrice } from "../utils/format.js";
import { useDialogFocus } from "../hooks/useDialogFocus.js";

export function CartDrawer({
  isOpen,
  items,
  onClose,
  onUpdateQty,
  onRemoveItem,
  onCheckout,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [stockErrors, setStockErrors] = useState([]);
  const [receipt, setReceipt] = useState(null);
  useDialogFocus(isOpen, onClose, '[data-dialog="cart"]');

  if (!isOpen) return null;

  const subtotalCents = items.reduce(
    (sum, item) => sum + item.book.priceCents * item.quantity,
    0,
  );

  async function handleCheckout() {
    setSubmitting(true);
    setErrorMsg("");
    setStockErrors([]);
    try {
      const order = await onCheckout();
      setReceipt(order);
    } catch (err) {
      setErrorMsg(err.message || "Checkout failed");
      setStockErrors(err.details || []);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="drawer-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setReceipt(null);
          onClose();
        }
      }}
    >
      <div className="drawer-panel" data-dialog="cart" tabIndex={-1}>
        <div className="modal-header" style={{ marginBottom: 0 }}>
          <h2 id="cart-drawer-title" className="modal-title">
            Shopping cart
          </h2>
          <button
            type="button"
            className="close-btn"
            onClick={() => {
              setReceipt(null);
              onClose();
            }}
            aria-label="Close cart"
          >
            x
          </button>
        </div>

        {receipt && (
          <div className="alert alert-success" role="status">
            <strong>Order confirmed</strong>
            <div style={{ fontSize: "0.82rem", marginTop: "4px" }}>
              Order ID: {receipt.orderId}
            </div>
            <div style={{ fontSize: "0.85rem", marginTop: "4px" }}>
              Total paid: {formatPrice(receipt.totalCents)}
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="alert alert-error" role="alert">
            <strong>{errorMsg}</strong>
            {stockErrors.length > 0 && (
              <ul style={{ margin: "6px 0 0 18px", padding: 0 }}>
                {stockErrors.map((detail) => (
                  <li key={detail.bookId}>
                    {detail.title}: requested {detail.requested}, available {detail.available}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {items.length === 0 ? (
          <div className="empty-state" style={{ marginTop: "12px" }}>
            Your cart is empty. Add in-stock titles from the storefront to place an order.
          </div>
        ) : (
          <>
            <div className="cart-items">
              {items.map(({ book, quantity }) => (
                <div className="cart-item" key={book.id}>
                  <div className="cart-item-top">
                    <div>
                      <div style={{ fontWeight: 600 }}>{book.title}</div>
                      <div style={{ fontSize: "0.82rem", color: "var(--ink-muted)" }}>
                        {formatPrice(book.priceCents)} each | {book.stock} available
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => onRemoveItem(book.id)}
                    >
                      Remove
                    </button>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div className="qty-stepper">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        aria-label={`Decrease quantity of ${book.title}`}
                        onClick={() => onUpdateQty(book.id, quantity - 1)}
                      >
                        -
                      </button>
                      <span style={{ minWidth: "24px", textAlign: "center", fontWeight: 600 }}>
                        {quantity}
                      </span>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        aria-label={`Increase quantity of ${book.title}`}
                        disabled={quantity >= book.stock}
                        onClick={() => onUpdateQty(book.id, quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <strong>{formatPrice(book.priceCents * quantity)}</strong>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>{formatPrice(subtotalCents)}</span>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                disabled={submitting}
                onClick={handleCheckout}
              >
                {submitting ? "Processing order..." : "Complete order"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
