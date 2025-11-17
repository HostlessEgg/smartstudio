import React, { useEffect } from 'react';

export default function Toast({ message, type = 'info', onClose, duration = 3500 }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => onClose && onClose(), duration);
    return () => clearTimeout(t);
  }, [message, duration, onClose]);

  if (!message) return null;

  const bg = type === 'error' ? 'bg-red-600' : (type === 'success' ? 'bg-green-600' : 'bg-gray-800');

  return (
    <div className={`fixed bottom-6 right-6 ${bg} text-white px-4 py-2 rounded shadow flex items-center gap-3 transition-opacity`} role="status">
      <div className="flex-1 text-sm">{message}</div>
      <button onClick={() => onClose && onClose()} className="text-white bg-black/20 px-2 py-1 rounded">Cerrar</button>
    </div>
  );
}
