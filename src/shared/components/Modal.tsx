import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import styles from "./Modal.module.css";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  showCloseButton?: boolean;
}

// ── Nested-modal coordination ────────────────────────────────────────
// Every open modal registers here so the most recently opened one is
// always rendered on top.
const BASE_Z_INDEX = 1000;
let modalCounter = 0;
const openModalIds: number[] = [];
const stackListeners = new Set<() => void>();
let stackSnapshot: number[] = [];

function subscribeToStack(callback: () => void) {
  stackListeners.add(callback);
  return () => stackListeners.delete(callback);
}

function getStackSnapshot() {
  return stackSnapshot;
}

function notifyStackChanged() {
  stackSnapshot = [...openModalIds];
  stackListeners.forEach((l) => l());
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [modalId] = useState(() => ++modalCounter);

  const stack = useSyncExternalStore(subscribeToStack, getStackSnapshot, () => []);
  const stackIndex = stack.indexOf(modalId);
  const zIndex = stackIndex >= 0 ? BASE_Z_INDEX + stackIndex + 1 : BASE_Z_INDEX;

  // Determine portal target: if there's a fullscreen element, portal into it
  // so the modal sits in the same top-layer stacking context.
  const portalTarget = document.fullscreenElement ?? document.body;

  // Register/unregister with the open-modal stack. This both assigns the
  // z-index step and owns body-scroll locking (locked while *any* modal is
  // open, not just this one).
  useEffect(() => {
    if (!isOpen) {
      const idx = openModalIds.indexOf(modalId);
      if (idx !== -1) {
        openModalIds.splice(idx, 1);
        notifyStackChanged();
      }
      document.body.style.overflow = openModalIds.length > 0 ? "hidden" : "";
      return;
    }
    openModalIds.push(modalId);
    notifyStackChanged();
    document.body.style.overflow = "hidden";
    return () => {
      const idx = openModalIds.indexOf(modalId);
      if (idx !== -1) {
        openModalIds.splice(idx, 1);
        notifyStackChanged();
      }
      document.body.style.overflow = openModalIds.length > 0 ? "hidden" : "";
    };
  }, [isOpen, modalId]);

  // Escape closes only the topmost modal, so nested modals unwind one at a time.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !isOpen) return;
      if (stack[stack.length - 1] === modalId) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, modalId, stack]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className={styles.modalOverlay}
      style={{ zIndex }}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div className={`${styles.modalDialog} ${styles[`modal${size.charAt(0).toUpperCase() + size.slice(1)}`]}`}>
        {(title || showCloseButton) && (
          <div className={styles.modalHeader}>
            {title && (
              <h2 id="modal-title" className={styles.modalTitle}>
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                className={styles.modalCloseBtn}
                onClick={onClose}
                aria-label="Close modal"
              >
                ✕
              </button>
            )}
          </div>
        )}
        <div className={styles.modalBody}>{children}</div>
      </div>
    </div>,
    portalTarget
  );
};

export default Modal;