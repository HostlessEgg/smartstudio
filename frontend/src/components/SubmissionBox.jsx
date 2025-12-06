import React, { useState } from 'react';
import axios from 'axios';
import Toast from './Toast';

export default function SubmissionBox({ assignmentId: initialAssignmentId = '', onSubmitted }) {
  const [assignmentId, setAssignmentId] = useState(initialAssignmentId);
  const [text, setText] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const isValidUrl = (u) => {
    if (!u) return false;
    try {
      // eslint-disable-next-line no-new
      new URL(u);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!assignmentId) {
      setToast({ message: 'Debe indicar el ID de la asignación', type: 'error' });
      return;
    }
    if (!text && !fileUrl && !selectedFile) {
      setToast({ message: 'Debe proporcionar texto o una URL de archivo', type: 'error' });
      return;
    }
    if (fileUrl && !isValidUrl(fileUrl)) {
      setToast({ message: 'La URL del archivo no es válida', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      // If a file is selected, request presigned url and upload
      let finalFileUrl = fileUrl || null;
      if (selectedFile) {
        // ask backend for presign or fallback
        const presignRes = await axios.post('/api/uploads/presign', { filename: selectedFile.name, contentType: selectedFile.type });
        if (presignRes.data && presignRes.data.uploadUrl) {
          // upload using PUT
          await axios.put(presignRes.data.uploadUrl, selectedFile, { headers: { 'Content-Type': selectedFile.type } });
          finalFileUrl = presignRes.data.fileUrl;
        } else if (presignRes.data && presignRes.data.fallback && presignRes.data.uploadEndpoint) {
          // fallback: use form upload
          const form = new FormData();
          form.append('file', selectedFile, selectedFile.name);
          const uploadRes = await axios.post(presignRes.data.uploadEndpoint, form, { headers: { 'Content-Type': 'multipart/form-data' } });
          finalFileUrl = uploadRes.data.fileUrl;
        } else {
          throw new Error('No se pudo obtener URL de subida');
        }
      }
      const res = await axios.post(`/api/assignments/${assignmentId}/submissions`, {
        text_submission: text || null,
        file_url: finalFileUrl || null
      });
      setToast({ message: 'Entrega enviada correctamente', type: 'success' });
      setText(''); setFileUrl('');
      setSelectedFile(null);
      if (onSubmitted) onSubmitted(res.data);
    } catch (err) {
      console.error('Error sending submission', err);
      setToast({ message: err.response?.data?.error || 'Error enviando entrega', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h4 className="font-semibold mb-2">Enviar entrega</h4>
      <form onSubmit={handleSubmit} className="space-y-2">
        <div>
          <label className="block text-sm">Assignment ID</label>
          <input value={assignmentId} onChange={e => setAssignmentId(e.target.value)} className="border p-2 w-full" placeholder="ID de la asignación" />
        </div>
        <div>
          <label className="block text-sm">Texto / Comentarios</label>
          <textarea value={text} onChange={e => setText(e.target.value)} className="border p-2 w-full" rows={4} />
        </div>
        <div>
          <label className="block text-sm">Adjuntar archivo (opcional)</label>
          <input type="file" onChange={e => setSelectedFile(e.target.files[0] || null)} className="border p-2 w-full" />
          <div className="mt-2 text-sm text-gray-600">O pega una URL pública:</div>
          <input value={fileUrl} onChange={e => setFileUrl(e.target.value)} className="border p-2 w-full mt-1" placeholder="https://..." />
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={loading} className="bg-green-600 text-white px-3 py-1 rounded">
            {loading ? 'Enviando...' : 'Enviar entrega'}
          </button>
        </div>
      </form>
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
}
