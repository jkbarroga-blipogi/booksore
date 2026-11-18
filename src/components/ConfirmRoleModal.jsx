import { useEffect, useState } from "react";

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function ConfirmRoleModal({ user, onClose, onConfirm }) {
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setErrorMsg("");
    setSubmitting(false);
  }, [user?.id]);

  useEffect(() => {
    if (!user) return undefined;
    const panel = document.querySelector('[data-dialog="confirm-role"]');
    const previousFocus = document.activeElement;

    function getFocusable() {
      if (!(panel instanceof HTMLElement)) return [];
      return Array.from(panel.querySelectorAll(FOCUSABLE)).filter(
        (element) => element instanceof HTMLElement && element.offsetParent !== null,
      );
    }

    const preferred = panel?.querySelector("[data-autofocus]");
    if (preferred instanceof HTMLElement) {
      preferred.focus();
    } else {
      getFocusable()[0]?.focus();
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = getFocusable();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previousFocus instanceof HTMLElement) {
        previousFocus.focus();
      }
    };
  }, [user, onClose]);

  if (!user) return null;

  const isDemotion = user.role === "admin";
  const handle = user.username ? `@${user.username}` : user.email;

  async function handleConfirm() {
    setSubmitting(true);
    setErrorMsg("");
    try {
      await onConfirm(user);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || "The role could not be updated. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="role-modal-title"
      aria-describedby="role-modal-description"
      onClick={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      <div className="modal-panel modal-panel-sm" data-dialog="confirm-role" tabIndex={-1}>
        <div className="modal-header">
          <h2 id="role-modal-title" className="modal-title">
            {isDemotion ? "Remove admin access?" : "Grant admin access?"}
          </h2>
          <button
            type="button"
            className="close-btn"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close role confirmation"
          >
            x
          </button>
        </div>

        <p id="role-modal-description" className="modal-description">
          {isDemotion
            ? `${handle} will lose inventory tools and member management. The account stays active as a customer.`
            : `${handle} will be able to manage inventory and change member roles across the shop.`}
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
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`btn ${isDemotion ? "btn-danger" : "btn-primary"}`}
            onClick={handleConfirm}
            disabled={submitting}
          >
            {submitting
              ? "Updating..."
              : isDemotion
                ? "Make customer"
                : "Make admin"}
          </button>
        </div>
      </div>
    </div>
  );
}
