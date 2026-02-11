import React, { createContext, useState, useContext, useCallback } from 'react';
import api from '../lib/api';

const ToastContext = createContext(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, opts = {}) => {
    const id = Date.now() + Math.random();
    const toast = { id, message, type: opts.type || 'info', timeout: opts.timeout || 5000 };
    setToasts(t => [...t, toast]);
    if (toast.timeout > 0) {
      setTimeout(() => {
        setToasts(t => t.filter(x => x.id !== id));
      }, toast.timeout);
    }
    return id;
  }, []);

  // Undo helper: check sessionStorage for last bulk action and perform inverse
  const tryUndoLastBulk = useCallback(async () => {
    try {
      const last = sessionStorage.getItem('last_bulk_action');
      if (!last) return false;
      const obj = JSON.parse(last);
      if (obj.type === 'bulk_deactivate') {
        await api.post('/users/bulk-reactivate', { ids: obj.ids });
        sessionStorage.removeItem('last_bulk_action');
        return true;
      }
      if (obj.type === 'bulk_role') {
        // cannot undo role change reliably without previous roles; skip
        return false;
      }
      return false;
    } catch (e) { return false; }
  }, []);

  const removeToast = useCallback((id) => setToasts(t => t.filter(x => x.id !== id)), []);

  // Listen for global toast events dispatched from non-React modules (e.g. an API client)
  React.useEffect(() => {
    const handler = (e) => {
      try {
        const d = e.detail || {};
        const msg = d.message || d;
        const type = d.type || 'error';
        if (msg) addToast(msg, { type });
      } catch (err) {
        // ignore malformed events
      }
    };
    window.addEventListener('app:toast', handler);
    const undoHandler = async () => {
      // attempt undo using helper
      try {
        const last = sessionStorage.getItem('last_bulk_action');
        if (!last) return;
        const obj = JSON.parse(last);
        if (obj.type === 'bulk_deactivate') {
          await api.post('/users/bulk-reactivate', { ids: obj.ids });
          sessionStorage.removeItem('last_bulk_action');
          addToast('Acción revertida', { type: 'success' });
        }
      } catch (e) {
        addToast('No se pudo revertir', { type: 'error' });
      }
    };
    window.addEventListener('app:tryUndo', undoHandler);
    return () => window.removeEventListener('app:toast', handler);
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export default ToastContext;
