import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./Modal.css";

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
// always rendered on top. Rendering through a portal escapes any ancestor
// that establishes a containing block for `position: fixed` (e.g. the
// `backdrop-filter` on `.main-content`), which is what previously clipped
// modals to the MainContainer area.
const BASE_Z_INDEX = 1000;
let modalCounter = 0;
const openModalIds: number[] = [];

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  // A stable, unique id for this modal instance (created once).
  const modalIdRef = useRef<number>(-1);
  if (modalIdRef.current === -1) modalIdRef.current = ++modalCounter;
  const modalId = modalIdRef.current;

  const [zIndex, setZIndex] = useState(BASE_Z_INDEX);

  // Register/unregister with the open-modal stack. This both assigns the
  // z-index step and owns body-scroll locking (locked while *any* modal is
  // open, not just this one).
  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = openModalIds.length > 0 ? "hidden" : "";
      return;
    }
    openModalIds.push(modalId);
    setZIndex(BASE_Z_INDEX + openModalIds.length);
    document.body.style.overflow = "hidden";
    return () => {
      const idx = openModalIds.indexOf(modalId);
      if (idx !== -1) openModalIds.splice(idx, 1);
      setZIndex(BASE_Z_INDEX);
      document.body.style.overflow = openModalIds.length > 0 ? "hidden" : "";
    };
  }, [isOpen, modalId]);

  // Escape closes only the topmost modal, so nested modals unwind one at a time.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !isOpen) return;
      if (openModalIds[openModalIds.length - 1] === modalId) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, modalId]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="modal-overlay"
      style={{ zIndex }}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div className={`modal-dialog modal-${size}`}>
        {(title || showCloseButton) && (
          <div className="modal-header">
            {title && (
              <h2 id="modal-title" className="modal-title">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                className="modal-close-btn"
                onClick={onClose}
                aria-label="Close modal"
              >
                ✕
              </button>
            )}
          </div>
        )}
        <div className="modal-body">{children}</div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
