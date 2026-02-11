import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import Spinner from '../components/Spinner';
import Button from '../components/ui/Button';

export default function AdminAudits() {
  const [audits, setAudits] = useState([]);
  const [meta, setMeta] = useState({ page: 1, per_page: 50, total: 0, total_pages: 1 });
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [downloading, setDownloading] = useState(false);

  const fetch = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/admin/audits', { params: { page, per_page: meta.per_page, q } });
      setAudits(res.data.data || []);
      setMeta(res.data.meta || meta);
    } catch (e) {
      // toast via interceptor
    } finally { setLoading(false); }
  };

  useEffect(() => { fetch(1); }, []);

  const exportCsv = async () => {
    setDownloading(true);
    try {
      const res = await api.get('/admin/audits/export', {
        params: { q },
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'audits.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      // toast via interceptor
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="page">
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 className="section-title">Auditoría</h2>
            <p className="section-subtitle">Trazabilidad de acciones del sistema.</p>
          </div>
          <span className="pill">Admin</span>
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input className="input" placeholder="Buscar acción/entidad/ip" value={q} onChange={e=>setQ(e.target.value)} style={{ flex: 1, minWidth: 220 }} />
          <Button onClick={()=>fetch(1)}>Buscar</Button>
          <Button variant="secondary" onClick={exportCsv} disabled={downloading}>{downloading ? 'Exportando...' : 'Exportar CSV'}</Button>
        </div>

        {loading ? <div style={{ marginTop: 16 }}><Spinner message="Cargando auditoría..." /></div> : (
          <div className="table-container" style={{ marginTop: 16 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Id</th>
                  <th>Usuario</th>
                  <th>Acción</th>
                  <th>Entidad</th>
                  <th>Detalles</th>
                  <th>IP</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {audits.map(a => (
                  <tr key={a.id}>
                    <td>{a.id}</td>
                    <td>{a.user_id}</td>
                    <td><span className="badge badge-primary">{a.action}</span></td>
                    <td>{a.entity} {a.entity_id ? `#${a.entity_id}` : ''}</td>
                    <td><pre style={{ whiteSpace: 'pre-wrap', fontSize: 11, margin: 0 }}>{a.details}</pre></td>
                    <td>{a.ip}</td>
                    <td className="muted">{new Date(a.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button variant="ghost" onClick={()=>fetch(Math.max(1, meta.page-1))}>Anterior</Button>
          <div className="muted">Página {meta.page} / {meta.total_pages}</div>
          <Button variant="ghost" onClick={()=>fetch(Math.min(meta.total_pages, meta.page+1))}>Siguiente</Button>
        </div>
      </div>
    </div>
  );
}
