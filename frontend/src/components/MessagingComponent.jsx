import React, { useEffect, useState } from 'react';
import Button from './ui/Button';
import api from '../lib/api';
import { useToast } from '../contexts/ToastContext';

export default function MessagingComponent() {
  const [messages, setMessages] = useState([]);
  const [sentMessages, setSentMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('inbox');
  const [selected, setSelected] = useState(null);
  const [text, setText] = useState('');
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const { addToast } = useToast();

  const loadMessages = async () => {
    setLoading(true);
    try {
      const [inboxRes, sentRes] = await Promise.all([
        api.get('/messages/inbox'),
        api.get('/messages/sent')
      ]);
      setMessages(inboxRes.data?.messages || []);
      setSentMessages(sentRes.data?.messages || []);
    } catch (err) {
      addToast(err.response?.data?.error || 'No se pudieron cargar mensajes', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const send = async () => {
    if (!to.trim() || !text.trim()) {
      addToast('Completa destinatario y mensaje', { type: 'error' });
      return;
    }
    try {
      await api.post('/messages', { to, subject, message: text.trim() });
      addToast('Mensaje enviado', { type: 'success' });
      setText('');
      setSubject('');
      setTo('');
      await loadMessages();
    } catch (err) {
      addToast(err.response?.data?.error || 'No se pudo enviar el mensaje', { type: 'error' });
    }
  };

  const markRead = async (msg) => {
    if (msg.read_at) return;
    try {
      await api.post(`/messages/${msg.id}/read`);
      setMessages((prev) => prev.map(m => (m.id === msg.id ? { ...m, read_at: new Date().toISOString() } : m)));
    } catch (err) {
      addToast('No se pudo marcar como leído', { type: 'error' });
    }
  };

  return (
    <div className="page">
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 className="section-title">Mensajes</h2>
            <p className="section-subtitle">Envía y consulta mensajes recientes.</p>
          </div>
          <span className="pill">Comunicación</span>
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button variant={activeTab === 'inbox' ? 'primary' : 'ghost'} onClick={() => setActiveTab('inbox')}>Inbox</Button>
          <Button variant={activeTab === 'sent' ? 'primary' : 'ghost'} onClick={() => setActiveTab('sent')}>Enviados</Button>
          <Button variant={activeTab === 'compose' ? 'primary' : 'ghost'} onClick={() => setActiveTab('compose')}>Nuevo</Button>
        </div>

        {activeTab === 'compose' && (
          <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
            <input value={to} onChange={e=>setTo(e.target.value)} className="input" placeholder="Para (email o ID)" />
            <input value={subject} onChange={e=>setSubject(e.target.value)} className="input" placeholder="Asunto (opcional)" />
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input value={text} onChange={e=>setText(e.target.value)} className="input" placeholder="Escribe un mensaje..." style={{ flex: 1, minWidth: 220 }} />
              <Button onClick={send}>Enviar</Button>
            </div>
          </div>
        )}

        <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
          {loading && <div className="muted">Cargando mensajes...</div>}

          {activeTab === 'inbox' && !loading && messages.length === 0 && <div className="muted">No hay mensajes.</div>}
          {activeTab === 'sent' && !loading && sentMessages.length === 0 && <div className="muted">No hay mensajes enviados.</div>}

          {activeTab === 'inbox' && messages.map(m => (
            <button
              key={m.id}
              onClick={() => { setSelected(m); markRead(m); }}
              className="card"
              style={{ padding: 12, border: '1px solid var(--border)', boxShadow: 'none', textAlign: 'left', background: m.read_at ? 'var(--surface)' : 'rgba(0,122,255,0.06)' }}
            >
              <div className="muted" style={{ fontSize: 12 }}>{m.sender_name || m.sender_email || 'Sistema'} — {new Date(m.created_at).toLocaleString()}</div>
              {m.subject && <div style={{ fontWeight: 600, marginTop: 6 }}>{m.subject}</div>}
              <div style={{ marginTop: 6 }} className="muted">{m.body?.slice(0, 120)}{m.body?.length > 120 ? '…' : ''}</div>
            </button>
          ))}

          {activeTab === 'sent' && sentMessages.map(m => (
            <button
              key={m.id}
              onClick={() => setSelected(m)}
              className="card"
              style={{ padding: 12, border: '1px solid var(--border)', boxShadow: 'none', textAlign: 'left' }}
            >
              <div className="muted" style={{ fontSize: 12 }}>{m.recipient_name || m.recipient_email || 'Destino'} — {new Date(m.created_at).toLocaleString()}</div>
              {m.subject && <div style={{ fontWeight: 600, marginTop: 6 }}>{m.subject}</div>}
              <div style={{ marginTop: 6 }} className="muted">{m.body?.slice(0, 120)}{m.body?.length > 120 ? '…' : ''}</div>
            </button>
          ))}
        </div>

        {selected && (
          <div className="card" style={{ marginTop: 16, padding: 16, border: '1px solid var(--border)', boxShadow: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 600 }}>{selected.subject || 'Mensaje'}</div>
                <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                  {selected.sender_name || selected.sender_email || selected.recipient_name || selected.recipient_email}
                </div>
              </div>
              <Button variant="ghost" onClick={() => setSelected(null)}>Cerrar</Button>
            </div>
            <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>{new Date(selected.created_at).toLocaleString()}</div>
            <div style={{ marginTop: 10 }}>{selected.body}</div>
          </div>
        )}
      </div>
    </div>
  );
}
