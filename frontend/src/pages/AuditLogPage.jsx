import React, { useState, useEffect } from 'react';
import mockApi from '../lib/mockApi';

export default function AuditLogPage(){
  const [logs, setLogs] = useState([]);
  const [q, setQ] = useState('');

  useEffect(()=>{
    let mounted = true;
    mockApi.getAudit().then(a=>{ if (mounted && a) setLogs(a); });
    return ()=>{ mounted=false };
  },[]);

  const filtered = logs.filter(l => (l.user || '').toLowerCase().includes(q.toLowerCase()) || (l.action || '').toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="page">
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 className="section-title">Auditoría</h2>
            <p className="section-subtitle">Revisa eventos y acciones registradas.</p>
          </div>
          <span className="pill">Admin</span>
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <input aria-label="Buscar auditoría" className="input" placeholder="Buscar usuario o acción" value={q} onChange={e=>setQ(e.target.value)} style={{ maxWidth: 360 }} />
          <div className="muted" style={{ fontSize: 12 }}>{filtered.length} eventos</div>
        </div>

        <div className="table-container" style={{ marginTop: 16 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Usuario</th>
                <th>Acción</th>
                <th>Entidad</th>
                <th>ID</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l, idx) => (
                <tr key={idx}>
                  <td>{new Date(l.created_at || l.at || Date.now()).toLocaleString()}</td>
                  <td>{l.user || l.user_id || 'N/A'}</td>
                  <td>{l.action}</td>
                  <td>{l.entity}</td>
                  <td>{l.entity_id}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="muted">No hay eventos para mostrar.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
