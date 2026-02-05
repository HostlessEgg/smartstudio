import React from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';

export default function BulkPreviewModal({ open, onClose, preview }){
  return (
    <Modal open={open} onClose={onClose} title="Previsualización de Importación">
      <div className="mb-3">
        <pre className="bg-gray-100 p-2">
          {preview && preview.length ? preview.join('\n') : 'No hay datos'}
        </pre>
      </div>
      <div className="flex justify-end gap-2">
        <Button onClick={onClose} className="text-sm">Cerrar</Button>
        <Button onClick={() => alert('Mock: aplicar import')} className="text-sm bg-blue-600 text-white">Aplicar import (mock)</Button>
      </div>
    </Modal>
  );
}
