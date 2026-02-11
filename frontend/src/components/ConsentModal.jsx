import React, { useEffect, useRef, useState } from 'react';
import Button from './ui/Button';

export default function ConsentModal({ open, onClose, onConfirm, studentId }) {
  const [expiresAt, setExpiresAt] = useState('');
  const confirmRef = useRef(null);

  useEffect(() => {
    if (open) confirmRef.current?.focus();
  }, [open]);

  if (!open) return null;

  const submit = () => {
    onConfirm({ studentId, expiresAt: expiresAt || null });
  };

  return (
    <div className="progress-modal-backdrop" onMouseDown={onClose}>
      <div className="progress-modal" role="dialog" aria-modal="true" onMouseDown={(e)=>e.stopPropagation()}>
        <div className="progress-modal-header">
          <h3 className="progress-modal-title">Conceder consentimiento</h3>
          <button onClick={onClose} className="progress-modal-close" aria-label="Cerrar modal">✕</button>
        </div>
        <div className="progress-modal-body">
          <p>Opcional: establece una fecha de expiración para el acceso del representante.</p>
          <div className="mt-2">
            <label className="label">Fecha de expiración</label>
            <input type="date" value={expiresAt} onChange={e=>setExpiresAt(e.target.value)} className="input" />
          </div>
          <div className="mt-4 flex gap-2">
            <Button ref={confirmRef} onClick={submit}>Confirmar</Button>
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
