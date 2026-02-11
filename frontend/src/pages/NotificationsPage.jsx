import React, { useEffect, useMemo, useState } from 'react';
import Button from '../components/ui/Button';
import api from '../lib/api';

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);

  const unreadCount = useMemo(() => messages.filter(m => !m.read_at).length, [messages]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/messages/inbox');
      setMessages(res.data?.messages || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id) => {
    await api.post(`/messages/${id}/read`);
    setMessages((prev) => prev.map(m => (m.id === id ? { ...m, read_at: new Date().toISOString() } : m)));
  };

  const markAll = async () => {
    const unread = messages.filter(m => !m.read_at);
    await Promise.all(unread.map(m => api.post(`/messages/${m.id}/read`).catch(() => null)));
    setMessages((prev) => prev.map(m => ({ ...m, read_at: m.read_at || new Date().toISOString() })));
  };
  return (
    <div className="page">
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 className="section-title">Notificaciones</h2>
            <p className="section-subtitle">Centro de actividad y alertas.</p>
          </div>
          <span className="pill">{unreadCount} sin leer</span>
        </div>

        <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
          {loading && <div className="muted">Cargando notificaciones...</div>}
          {!loading && messages.length === 0 && <div className="muted">No hay notificaciones.</div>}
          {messages.map(n => (
            <button
              key={n.id}
              onClick={() => markRead(n.id)}
              className="card"
              style={{ padding: 16, border: '1px solid var(--border)', boxShadow: 'none', textAlign: 'left', background: n.read_at ? 'var(--surface)' : 'rgba(0,122,255,0.06)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{n.subject || 'Nuevo mensaje'}</div>
                  <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>{n.sender_name || n.sender_email || 'Sistema'}</div>
                  <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>{new Date(n.created_at).toLocaleString()}</div>
                </div>
                <span className={`badge ${n.read_at ? 'badge-secondary' : 'badge-primary'}`}>{n.read_at ? 'Leído' : 'Nuevo'}</span>
              </div>
            </button>
          ))}
        </div>

        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={markAll} disabled={!unreadCount}>Marcar todo como leído</Button>
        </div>
      </div>
    </div>
  );
}
