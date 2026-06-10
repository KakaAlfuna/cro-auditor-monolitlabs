import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  size?: "default" | "large";
  insetX?: boolean;
  overlay?: boolean;
  onClose?: () => void;
}

export function Modal({
  open,
  title,
  description,
  children,
  size = "default",
  insetX = false,
  overlay = true,
  onClose,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    if (overlay) {
      document.body.style.overflow = "hidden";
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && onClose) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      if (overlay) {
        document.body.style.overflow = previousOverflow;
      }
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, overlay]);

  if (!open) return null;

  const dialogClass =
    size === "large" ? "ds-modal__dialog ds-modal__dialog--large" : "ds-modal__dialog";
  const modalClass = [
    "ds-modal",
    insetX && "ds-modal--inset-x",
    !overlay && "ds-modal--plain",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={modalClass} role="presentation">
      {overlay &&
        (onClose ? (
          <button
            type="button"
            className="ds-modal__backdrop"
            aria-label="Close dialog"
            onClick={onClose}
          />
        ) : (
          <div className="ds-modal__backdrop" aria-hidden="true" />
        ))}
      <div
        className={dialogClass}
        role="dialog"
        aria-modal={overlay ? "true" : "false"}
        aria-labelledby="ds-modal-title"
        aria-describedby={description ? "ds-modal-desc" : undefined}
      >
        <header className="ds-modal__header">
          <div className="ds-modal__header-main">
            <h2 id="ds-modal-title" className="ds-modal__title">
              {title}
            </h2>
            {description && (
              <p id="ds-modal-desc" className="ds-modal__desc">
                {description}
              </p>
            )}
          </div>
          {onClose && (
            <button
              type="button"
              className="ds-modal__close"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={18} strokeWidth={2} aria-hidden="true" />
            </button>
          )}
        </header>
        <div className="ds-modal__body">{children}</div>
      </div>
    </div>
  );
}
