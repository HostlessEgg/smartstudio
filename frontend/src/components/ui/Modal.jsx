import React, { useEffect, useRef } from 'react';

export default function Modal({ open, onClose, title, children, ariaLabel }){
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    // focus first focusable element inside modal
    const el = ref.current;
    const focusable = el && el.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable) focusable.focus();

    function onKey(e){
      if (e.key === 'Escape') onClose && onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label={ariaLabel || title || 'Dialog'} className="modal-backdrop">
      <div ref={ref} className="modal-panel" role="document" tabIndex={-1}>
        {title && <h3 className="section-title" style={{ fontSize: 18 }}>{title}</h3>}
        <div style={{ marginTop: 8 }}>{children}</div>
        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
