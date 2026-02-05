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
    <div role="dialog" aria-modal="true" aria-label={ariaLabel || title || 'Dialog'} className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div ref={ref} className="bg-white rounded shadow-lg p-4 w-11/12 max-w-3xl max-h-[80vh] overflow-auto" role="document" tabIndex={-1}>
        {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
        <div>{children}</div>
        <div className="mt-3 text-right">
          <button className="text-sm text-gray-700" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
