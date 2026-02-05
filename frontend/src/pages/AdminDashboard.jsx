import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import AdminTasks from './AdminTasks';

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState({ status: 'unknown', message: '', checkedAt: null });
  const { addToast } = useToast();

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
            <button onClick={fetchSummary} className="btn-primary">{loading ? 'Cargando...' : 'Actualizar'}</button>
            <a href="/admin/users" className="btn-ghost" style={{ display: 'inline-flex', alignItems: 'center' }}>Administrar Usuarios</a>
          </div>
        </div>

        {loading ? (
          <div style={{ marginTop: 16 }}><Spinner message="Cargando resumen..." /></div>
        ) : summary ? (
          <div className="grid-3" style={{ marginTop: 16 }}>
            <Card title="Usuarios" value={summary?.db?.users ?? '—'} />
            <Card title="Cursos" value={summary?.db?.courses ?? '—'} />
            <Card title="Entregas" value={summary?.db?.submissions ?? '—'} />
            <Card title="Migraciones" value={summary?.db?.migrations ?? '—'} />
          </div>
        ) : (
          <div style={{ marginTop: 16 }}><EmptyState title="Sin datos" description="No se encontró información del sistema." /></div>
        )}

        <div style={{ marginTop: 16 }}>
          <h3 style={{ fontWeight: 600 }}>Health</h3>
          <div className="card-muted" style={{ marginTop: 8, padding: 12, border: '1px solid var(--border)', display: 'grid', gap: 8 }}>
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

        <div className="grid-3" style={{ marginTop: 16 }}>
          <Card title="Foro (threads)" value={summary?.db?.forum_threads ?? '—'} />
          <Card title="Foro (hilos)" value={summary?.db?.forum_threads ?? '—'} />
          <Card title="Entregas de quiz" value={summary?.db?.quiz_submissions ?? '—'} />
          <Card title="Tareas" value={summary?.db?.assignments ?? '—'} />
        </div>

        <div style={{ marginTop: 16 }}>
          <h3 style={{ fontWeight: 600 }}>Tareas recientes</h3>
          <div className="card-muted" style={{ marginTop: 8, padding: 12, border: '1px solid var(--border)' }}>
            {summary?.recent_assignments && summary.recent_assignments.length > 0 ? (
              <ul style={{ display: 'grid', gap: 8 }}>
                {summary.recent_assignments.map(a => (
                  <li key={a.id} style={{ paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 600 }}>{a.title}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{a.start_at ? new Date(a.start_at).toLocaleString() : ''} — {a.end_at ? new Date(a.end_at).toLocaleString() : ''}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="muted">Sin tareas recientes</div>
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

function Card({ title, value }) {
  return (
    <div className="card" style={{ padding: 14 }}>
      <div className="muted" style={{ fontSize: 12 }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 600, marginTop: 4 }}>{value}</div>
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
