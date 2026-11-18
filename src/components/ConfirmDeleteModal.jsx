import { useEffect, useState } from "react";
import { useDialogFocus } from "../hooks/useDialogFocus.js";

export function ConfirmDeleteModal({ book, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  useDialogFocus(Boolean(book), onClose, '[data-dialog="confirm-delete"]');

  useEffect(() => {
    setDeleting(false);
    setErrorMsg("");
  }, [book?.id]);

  if (!book) return null;

  async function handleConfirm() {
    setDeleting(true);
    setErrorMsg("");
    try {
      await onConfirm(book);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || "The book could not be deleted. Try again.");
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
      aria-describedby="delete-modal-description"
      onClick={(event) => {
        if (event.target === event.currentTarget && !deleting) onClose();
      }}
    >
      <div className="modal-panel modal-panel-sm" data-dialog="confirm-delete" tabIndex={-1}>
        <div className="modal-header">
          <h2 id="delete-modal-title" className="modal-title">
            Delete book
          </h2>
          <button
            type="button"
            className="close-btn"
            onClick={onClose}
            disabled={deleting}
            aria-label="Close delete confirmation"
          >
            x
          </button>
        </div>

        <p id="delete-modal-description" className="modal-description">
          Remove <strong>{book.title}</strong> by {book.author} from the catalog? This action
          cannot be undone.
        </p>

        {errorMsg && (
          <div className="alert alert-error" role="alert">
            {errorMsg}
          </div>
        )}

        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-secondary"
            data-autofocus
            onClick={onClose}
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            disabled={deleting}
            onClick={handleConfirm}
          >
            {deleting ? "Deleting..." : "Delete book"}
          </button>
        </div>
      </div>
    </div>
  );
}
