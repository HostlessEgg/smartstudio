import React from 'react';
import { useToast } from '../contexts/ToastContext';

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div style={{ position: 'fixed', right: 16, top: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{ minWidth: 240, padding: 12, background: '#111827', color: '#fff', borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.12)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ fontSize: 14 }}>{t.message}</div>
            <button onClick={() => removeToast(t.id)} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>✕</button>
          </div>
        </div>
      ))}
    </div>
  );
}
