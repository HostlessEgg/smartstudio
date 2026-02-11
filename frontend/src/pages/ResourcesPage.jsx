import React, { useEffect, useState } from 'react';
import Button from '../components/ui/Button';
import api from '../lib/api';

export default function ResourcesPage() {
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get('/resources');
        if (mounted) setResources(res.data?.resources || []);
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
            <h2 className="section-title">Recursos</h2>
            <p className="section-subtitle">Materiales disponibles para clases y tareas.</p>
          </div>
          <span className="pill">Repositorio</span>
        </div>

        <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
          {loading && <div className="muted">Cargando recursos...</div>}
          {!loading && resources.length === 0 && <div className="muted">No hay recursos.</div>}
          {resources.map(resource => (
            <div key={resource.id} className="card" style={{ padding: 16, border: '1px solid var(--border)', boxShadow: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{resource.title}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{resource.file_type || 'N/A'} · {resource.file_size || 'N/D'}</div>
                </div>
                {resource.url ? (
                  <a href={resource.url} className="btn btn-outline">Descargar</a>
                ) : (
                  <Button variant="secondary">Descargar</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
