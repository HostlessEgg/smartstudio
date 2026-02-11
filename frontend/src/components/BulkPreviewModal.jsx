import React, { useState } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { useToast } from '../contexts/ToastContext';
import api from '../lib/api';

export default function BulkPreviewModal({ open, onClose, preview, csv = '', importType = 'users' }){
  const { addToast } = useToast();
  const [applying, setApplying] = useState(false);
  return (
    <Modal open={open} onClose={onClose} title="Previsualización de Importación">
      <div className="mb-3">
        <pre className="bg-gray-100 p-2">
          {preview && preview.length ? preview.join('\n') : 'No hay datos'}
        </pre>
      </div>
      <div className="flex justify-end gap-2">
        <Button onClick={onClose} className="text-sm">Cerrar</Button>
        <Button
          onClick={async () => {
            if (!csv) {
              addToast('No hay CSV para aplicar', { type: 'error' });
              return;
            }
            setApplying(true);
            try {
              const endpoint = importType === 'enrollments' ? '/admin/enrollments/bulk' : '/admin/import/users';
              await api.post(endpoint, { csv });
              addToast('Importación aplicada', { type: 'success' });
              onClose();
            } catch (err) {
              addToast(err.response?.data?.error || 'No se pudo aplicar la importación', { type: 'error' });
            } finally {
              setApplying(false);
            }
          }}
          className="text-sm"
          disabled={applying}
        >
          {applying ? 'Aplicando...' : 'Aplicar importación'}
        </Button>
      </div>
    </Modal>
  );
}
