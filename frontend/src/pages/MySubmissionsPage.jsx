import React, { useEffect, useState } from 'react';
import Button from '../components/ui/Button';
import Spinner from '../components/Spinner';
import api from '../lib/api';
import Modal from '../components/ui/Modal';

export default function MySubmissionsPage(){
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/my/submissions');
      setSubs(res.data || []);
    } catch (e) {
      // toast via interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{ load(); },[]);

  return (
    <div className="page">
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 className="section-title">Mis Entregas</h2>
            <p className="section-subtitle">Historial y estado de tus envíos.</p>
          </div>
          <span className="pill">Estudiante</span>
        </div>

        {loading ? <div style={{ marginTop: 16 }}><Spinner /></div> : (
          <div className="table-container" style={{ marginTop: 16 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Asignación</th>
                  <th>Estado</th>
                  <th>Puntaje</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {subs.map(s => (
                  <tr key={s.id}>
                    <td>{s.id}</td>
                    <td style={{ fontWeight: 600 }}>{s.assignment_title || s.assignment_id}</td>
                    <td>
                      <span className={`badge ${s.score !== null && s.score !== undefined ? 'badge-success' : 'badge-warning'}`}>
                        {s.score !== null && s.score !== undefined ? 'Calificada' : 'Enviada'}
                      </span>
                      {s.feedback ? <span className="muted" style={{ marginLeft: 8, fontSize: 12 }}>Feedback disponible</span> : null}
                    </td>
                    <td>{s.score !== null && s.score !== undefined ? s.score : '—'}</td>
                    <td className="muted">{s.created_at ? new Date(s.created_at).toLocaleString() : ''}</td>
                    <td>
                      <Button variant="ghost" onClick={()=>{ setDetail(s); setDetailOpen(true); }}>Ver entrega</Button>
                    </td>
                  </tr>
                ))}
                {subs.length === 0 && (
                  <tr>
                    <td className="muted" colSpan={6}>Sin entregas aún.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title="Detalle de entrega" ariaLabel="Detalle de entrega">
        {detail ? (
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ fontWeight: 600 }}>{detail.assignment_title || detail.assignment_id}</div>
            <div className="muted" style={{ fontSize: 12 }}>Enviada: {detail.created_at ? new Date(detail.created_at).toLocaleString() : '—'}</div>
            <div><strong>Estado:</strong> {detail.score !== null && detail.score !== undefined ? 'Calificada' : 'Enviada'}</div>
            <div><strong>Puntaje:</strong> {detail.score !== null && detail.score !== undefined ? detail.score : '—'}</div>
            <div><strong>Feedback:</strong> {detail.feedback || '—'}</div>
            <div><strong>Texto:</strong> {detail.text_submission || '—'}</div>
            <div><strong>Archivo:</strong> {detail.file_url ? (<a href={detail.file_url} target="_blank" rel="noreferrer">Ver archivo</a>) : '—'}</div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
