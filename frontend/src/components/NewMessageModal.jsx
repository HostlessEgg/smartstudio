import React, { useState } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { useToast } from '../contexts/ToastContext';
import api from '../lib/api';

export default function NewMessageModal({ open, onClose }) {
  const { addToast } = useToast();
  const [form, setForm] = useState({ to: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!form.to || !form.message) {
      addToast('Completa destinatario y mensaje', { type: 'error' });
      return;
    }
    setSending(true);
    try {
      await api.post('/messages', { to: form.to, subject: form.subject, message: form.message });
      addToast('Mensaje enviado', { type: 'success' });
      setForm({ to: '', subject: '', message: '' });
      onClose();
    } catch (err) {
      addToast(err.response?.data?.error || 'No se pudo enviar el mensaje', { type: 'error' });
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Nuevo mensaje">
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <label className="label">Para</label>
          <input className="input" placeholder="Nombre o correo" value={form.to} onChange={e => setForm({ ...form, to: e.target.value })} />
        </div>
        <div>
          <label className="label">Asunto</label>
          <input className="input" placeholder="Asunto" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
        </div>
        <div>
          <label className="label">Mensaje</label>
          <textarea className="input" rows={4} placeholder="Escribe tu mensaje" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
        </div>
      </div>
      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button onClick={send} disabled={sending}>{sending ? 'Enviando...' : 'Enviar'}</Button>
      </div>
    </Modal>
  );
}
