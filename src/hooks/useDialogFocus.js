import { useEffect, useRef } from "react";

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Traps keyboard focus inside a dialog panel identified by a stable selector.
 * Uses DOM lookup instead of a React ref so panels that mount and unmount
 * dynamically never depend on ref attachment timing.
 */
export function useDialogFocus(isOpen, onClose, dialogSelector) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return undefined;
    const panel = document.querySelector(dialogSelector);
    const previousFocus = document.activeElement;

    function getFocusable() {
      if (!panel) return [];
      return Array.from(panel.querySelectorAll(FOCUSABLE)).filter(
        (element) => element instanceof HTMLElement && element.offsetParent !== null,
      );
    }

    const preferred = panel?.querySelector("[data-autofocus]");
    if (preferred instanceof HTMLElement) {
      preferred.focus();
    } else {
      const first = getFocusable()[0];
      if (first) {
        first.focus();
      } else if (panel instanceof HTMLElement) {
        panel.focus();
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = getFocusable();
      if (focusable.length === 0) {
        event.preventDefault();
        if (panel instanceof HTMLElement) panel.focus();
        return;
      }

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
  }, [isOpen, dialogSelector]);
}
