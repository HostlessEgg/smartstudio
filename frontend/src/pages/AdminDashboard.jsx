import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import AdminTasks from './AdminTasks';
import Button from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState({ status: 'unknown', message: '', checkedAt: null });
  const { addToast } = useToast();
  const navigate = useNavigate();

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const [summaryRes, healthRes] = await Promise.all([
        api.get('/admin/summary'),
        api.get('/health')
      ]);
      setSummary(summaryRes.data);
      setHealth({
        status: healthRes.data?.status === 'OK' ? 'ok' : 'warn',
        message: healthRes.data?.message || 'Sin mensaje',
        checkedAt: new Date()
      });
    } catch (err) {
      console.error('Error fetching admin summary', err);
      addToast('No se pudo obtener resumen admin', { type: 'error' });
      setHealth({ status: 'error', message: 'No se pudo consultar health', checkedAt: new Date() });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSummary(); }, []);

  return (
    <div className="page">
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 className="section-title">Panel administrador</h2>
            <p className="section-subtitle">Resumen del sistema y accesos clave.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button onClick={fetchSummary}>{loading ? 'Cargando...' : 'Actualizar'}</Button>
            <Button variant="secondary" onClick={() => navigate('/admin/users')}>Usuarios</Button>
          </div>
        </div>

        {loading ? (
          <div style={{ marginTop: 16 }}><Spinner message="Cargando resumen..." /></div>
        ) : summary ? (
          <div className="cards-grid" style={{ marginTop: 16 }}>
            <Card title="Usuarios" value={summary?.db?.users ?? '—'} icon="ri-user-3-line" />
            <Card title="Cursos" value={summary?.db?.courses ?? '—'} icon="ri-book-2-line" />
            <Card title="Entregas" value={summary?.db?.submissions ?? '—'} icon="ri-inbox-archive-line" />
            <Card title="Migraciones" value={summary?.db?.migrations ?? '—'} icon="ri-git-merge-line" />
          </div>
        ) : (
          <div style={{ marginTop: 16 }}><EmptyState title="Sin datos" description="No se encontró información del sistema." /></div>
        )}

        <div style={{ marginTop: 16 }}>
          <h3 style={{ fontWeight: 600 }}>Estado del sistema</h3>
          <div className="card" style={{ marginTop: 8, padding: 16, display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <StatusPill status={health.status} />
              <span className="muted">{health.message || '—'}</span>
              {health.checkedAt && <span className="muted" style={{ fontSize: 12 }}>Actualizado: {health.checkedAt.toLocaleString()}</span>}
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <MiniStat label="DB" value={summary?.db ? 'Conectado' : '—'} />
              <MiniStat label="Migraciones" value={summary?.db?.migrations ?? '—'} />
              <MiniStat label="Usuarios" value={summary?.db?.users ?? '—'} />
            </div>
          </div>
        </div>

        <div className="cards-grid" style={{ marginTop: 16 }}>
          <Card title="Foro (hilos)" value={summary?.db?.forum_threads ?? '—'} icon="ri-message-2-line" />
          <Card title="Entregas de quiz" value={summary?.db?.quiz_submissions ?? '—'} icon="ri-questionnaire-line" />
          <Card title="Tareas" value={summary?.db?.assignments ?? '—'} icon="ri-todo-line" />
        </div>

        <div style={{ marginTop: 16 }}>
          <h3 style={{ fontWeight: 600 }}>Tareas recientes</h3>
          <div className="table-container" style={{ marginTop: 8 }}>
            {summary?.recent_assignments && summary.recent_assignments.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Tarea</th>
                    <th>Inicio</th>
                    <th>Entrega</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.recent_assignments.map(a => (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 600 }}>{a.title}</td>
                      <td className="muted">{a.start_at ? new Date(a.start_at).toLocaleString() : '—'}</td>
                      <td className="muted">{a.end_at ? new Date(a.end_at).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="muted" style={{ padding: 12 }}>Sin tareas recientes</div>
            )}
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <h3 style={{ fontWeight: 600 }}>Estado (raw)</h3>
          <pre className="card-muted" style={{ marginTop: 8, padding: 12, border: '1px solid var(--border)', overflowX: 'auto' }}>{summary ? JSON.stringify(summary, null, 2) : 'Sin datos'}</pre>
        </div>

        <div style={{ marginTop: 16 }}>
          <AdminTasks />
        </div>
      </div>
    </div>
  );
}

function Card({ title, value, icon }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="card-header">
        <div className="card-title" style={{ fontSize: 16 }}>{title}</div>
        <div className="card-icon"><i className={icon || 'ri-bar-chart-2-line'} aria-hidden="true"></i></div>
      </div>
      <div style={{ fontSize: 24, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    ok: { label: 'OK', bg: '#DCFCE7', color: '#166534' },
    warn: { label: 'Warn', bg: '#FEF9C3', color: '#854D0E' },
    error: { label: 'Error', bg: '#FEE2E2', color: '#991B1B' },
    unknown: { label: 'Desconocido', bg: '#E5E7EB', color: '#111827' }
  };
  const cfg = map[status] || map.unknown;
  return (
    <span style={{ padding: '4px 10px', borderRadius: 999, background: cfg.bg, color: cfg.color, fontSize: 12, fontWeight: 600 }}>
      {cfg.label}
    </span>
  );
}

function MiniStat({ label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span className="muted" style={{ fontSize: 12 }}>{label}:</span>
      <span style={{ fontSize: 13, fontWeight: 600 }}>{value}</span>
    </div>
  );
}
