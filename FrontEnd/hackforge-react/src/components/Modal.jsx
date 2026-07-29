import { useEffect, useRef, useId } from 'react';

/**
 * Accessible modal built on the native <dialog> element, which gives us the
 * focus trap, Escape handling, focus restore and top-layer stacking for free.
 * We only add: close-on-backdrop-click and the close button.
 */
export default function Modal({ open, onClose, title, children, maxWidth = 460 }) {
  const ref = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  // Escape fires "cancel"; take it over so React state stays the source of truth.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const onCancel = (e) => { e.preventDefault(); onClose(); };
    dialog.addEventListener('cancel', onCancel);
    return () => dialog.removeEventListener('cancel', onCancel);
  }, [onClose]);

  // Clicks that land on the dialog itself (not the inner panel) are backdrop clicks.
  const handleClick = (e) => { if (e.target === ref.current) onClose(); };

  return (
    <dialog ref={ref} className="modal" onClick={handleClick} aria-labelledby={titleId}>
      <div className="modal-panel" style={{ maxWidth }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 18 }}>
          <h2 id={titleId} style={{ fontSize: 19, fontWeight: 700, color: 'var(--color-primary)' }}>{title}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close dialog">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden="true">close</span>
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
