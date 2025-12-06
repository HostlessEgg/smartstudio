import React, { useEffect, useRef } from 'react';

export default function ConfirmModal({ open, message, onClose, onConfirm, confirmLabel = 'Aceptar', cancelLabel = 'Cancelar' }) {
  const confirmRef = useRef(null);

  useEffect(() => {
    if (open) confirmRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div className="progress-modal-backdrop" onMouseDown={onClose}>
      <div className="progress-modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <div className="progress-modal-header">
          <h3 className="progress-modal-title">Confirmación</h3>
          <button onClick={onClose} className="progress-modal-close" aria-label="Cerrar modal">✕</button>
        </div>
        <div className="progress-modal-body">
          <p>{message}</p>
          <div className="mt-4 flex gap-2">
            <button ref={confirmRef} onClick={onConfirm} className="btn btn-primary">{confirmLabel}</button>
            <button onClick={onClose} className="btn">{cancelLabel}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
