import { formatPrice } from "../utils/format.js";

export function MyOrdersModal({ isOpen, onClose, orders, loading }) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="orders-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-panel" style={{ maxWidth: "580px" }}>
        <div className="modal-header">
          <h2 id="orders-modal-title" className="modal-title">
            My Past Orders
          </h2>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close orders">
            x
          </button>
        </div>

        {loading ? (
          <div className="empty-state">Loading your order history...</div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            No orders found yet. Add books to your cart and complete checkout while signed in!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {orders.map((order) => (
              <div
                key={order.orderId}
                style={{
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  padding: "16px",
                  background: "var(--bg-canvas)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "0.85rem", color: "var(--ink-muted)" }}>
                  <span>Order: {order.orderId.slice(0, 8)}...</span>
                  <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px" }}>
                  {order.items.map((item, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.92rem" }}>
                      <span>
                        {item.title} <strong style={{ color: "var(--ink-muted)" }}>x{item.quantity}</strong>
                      </span>
                      <span style={{ fontWeight: 600 }}>{formatPrice(item.subtotalCents)}</span>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "8px", display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                  <span>Total Paid</span>
                  <span style={{ color: "var(--brand-primary)" }}>{formatPrice(order.totalCents)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
