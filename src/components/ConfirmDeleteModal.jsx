import { useState } from "react";

export function ConfirmDeleteModal({ book, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false);

  if (!book) return null;

  async function handleConfirm() {
    setDeleting(true);
    try {
      await onConfirm(book);
      onClose();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-panel" style={{ maxWidth: "420px" }}>
        <div className="modal-header">
          <h2 id="delete-modal-title" className="modal-title">
            Delete Book
          </h2>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close confirm">
            x
          </button>
        </div>

        <p style={{ margin: "0 0 18px", color: "var(--ink-secondary)" }}>
          Remove <strong>{book.title}</strong> by {book.author} from the catalog? This action
          cannot be undone.
        </p>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            disabled={deleting}
            onClick={handleConfirm}
          >
            {deleting ? "Deleting..." : "Delete Book"}
          </button>
        </div>
      </div>
    </div>
  );
}
