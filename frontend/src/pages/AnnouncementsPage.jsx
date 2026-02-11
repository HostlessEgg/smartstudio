import React, { useEffect, useState } from 'react';
import Button from '../components/ui/Button';
import api from '../lib/api';

export default function AnnouncementsPage() {
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get('/announcements');
        if (mounted) setAnnouncements(res.data?.announcements || []);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="page">
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 className="section-title">Anuncios</h2>
            <p className="section-subtitle">Información y comunicados institucionales.</p>
          </div>
          <span className="pill">Comunicados</span>
        </div>

        <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
          {loading && <div className="muted">Cargando anuncios...</div>}
          {!loading && announcements.length === 0 && <div className="muted">No hay anuncios.</div>}
          {announcements.map(item => (
            <div key={item.id} className="card" style={{ padding: 16, border: '1px solid var(--border)', boxShadow: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{item.title}</div>
                  <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>{new Date(item.created_at).toLocaleDateString()}</div>
                </div>
                <span className={`badge ${item.priority === 'high' ? 'badge-danger' : item.priority === 'low' ? 'badge-secondary' : 'badge-primary'}`}>
                  {item.priority || 'normal'}
                </span>
              </div>
              <div style={{ marginTop: 10 }} className="muted">{item.body}</div>
              {item.author_name && <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>Por {item.author_name}</div>}
              <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="secondary">Ver detalle</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
