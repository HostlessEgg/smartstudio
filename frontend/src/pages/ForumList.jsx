import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { Link, useParams } from 'react-router-dom';
import Button from '../components/ui/Button';

export default function ForumList() {
  const { courseId } = useParams();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadThreads = async () => {
    setLoading(true);
    try {
      const q = courseId ? `?courseId=${courseId}` : '';
      const res = await api.get(`/forums/threads${q}`);
      setThreads(res.data || []);
    } catch (err) {
      console.error('Error fetching threads', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadThreads();
  }, [courseId]);

  return (
    <div className="page">
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 className="section-title">Foro</h2>
            <p className="section-subtitle">Explora y participa en las discusiones del curso.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {courseId ? <span className="pill">Curso {courseId}</span> : <span className="pill">General</span>}
            <Button variant="secondary" onClick={loadThreads}>Refrescar</Button>
          </div>
        </div>

        <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
          {loading && <div className="muted">Cargando hilos...</div>}
          {!loading && threads.length === 0 && (
            <div className="muted">No hay hilos disponibles por ahora.</div>
          )}
          {!loading && threads.map(t => (
            <div key={t.id} className="card" style={{ padding: 16, border: '1px solid var(--border)', boxShadow: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{t.title}</div>
                  <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>Creado: {new Date(t.created_at).toLocaleString()}</div>
                </div>
                <Link to={`/forums/thread/${t.id}`}>
                  <Button>Ver hilo</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
