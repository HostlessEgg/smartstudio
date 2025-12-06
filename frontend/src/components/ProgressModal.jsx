import React, { useEffect, useRef } from 'react';

export default function ProgressModal({ open, onClose, studentId, progress }) {
  const closeBtnRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    // focus the close button when opened
    closeBtnRef.current?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="progress-modal-backdrop" onMouseDown={onClose}>
      <div
        className="progress-modal" 
        role="dialog"
        aria-modal="true"
        aria-labelledby={`progress-title-${studentId}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="progress-modal-header">
          <h3 id={`progress-title-${studentId}`} className="progress-modal-title">Progreso del estudiante {studentId}</h3>
          <button ref={closeBtnRef} onClick={onClose} className="progress-modal-close" aria-label="Cerrar modal">✕</button>
        </div>

        <div className="progress-modal-body">
          {progress ? (
            Array.isArray(progress) ? (
              <ul className="progress-list">
                {progress.map((p, i) => (
                  <li key={i} className="progress-item">
                    <div><strong>Curso:</strong> {p.course_id}</div>
                    <div><strong>Completadas:</strong> {p.completed_lessons || p.completed || 0}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <pre className="text-sm">{JSON.stringify(progress, null, 2)}</pre>
            )
          ) : (
            <div>No hay datos de progreso disponibles.</div>
          )}
        </div>
      </div>
    </div>
  );
}
