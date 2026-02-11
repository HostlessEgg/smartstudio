import React, { useEffect, useMemo, useState } from 'react';
import Button from '../components/ui/Button';
import api from '../lib/api';

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    users: 0,
    courses: 0,
    submissions: 0,
    assignments: 0,
    forum_threads: 0,
    quiz_submissions: 0
  });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get('/admin/summary');
        const db = res.data?.db || {};
        if (mounted) {
          setSummary({
            users: db.users || 0,
            courses: db.courses || 0,
            submissions: db.submissions || 0,
            assignments: db.assignments || 0,
            forum_threads: db.forum_threads || 0,
            quiz_submissions: db.quiz_submissions || 0
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const reportCards = useMemo(() => ([
    {
      id: 'academic',
      name: 'Reporte Académico',
      description: 'Promedio general, cursos y evaluaciones.',
      icon: 'ri-line-chart-fill',
      color: 'var(--secondary)',
      meta: `Cursos: ${summary.courses} · Tareas: ${summary.assignments}`
    },
    {
      id: 'attendance',
      name: 'Reporte de Asistencia',
      description: 'Entregas vs tareas como proxy de asistencia.',
      icon: 'ri-calendar-check-fill',
      color: 'var(--success)',
      meta: `Entregas: ${summary.submissions}`
    },
    {
      id: 'usage',
      name: 'Reporte de Uso',
      description: 'Actividad de plataforma y participación.',
      icon: 'ri-computer-fill',
      color: 'var(--warning)',
      meta: `Usuarios: ${summary.users} · Foros: ${summary.forum_threads}`
    }
  ]), [summary]);

  const downloadCsv = (scope = 'general') => {
    const rows = [
      ['Reporte', 'Usuarios', 'Cursos', 'Asignaciones', 'Entregas', 'Foros', 'Quizzes'],
      [
        scope,
        summary.users,
        summary.courses,
        summary.assignments,
        summary.submissions,
        summary.forum_threads,
        summary.quiz_submissions
      ]
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte-${scope}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  return (
    <div className="page">
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 className="section-title">Reportes</h2>
            <p className="section-subtitle">Indicadores clave del sistema.</p>
          </div>
          <span className="pill">Admin</span>
        </div>

        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => downloadCsv('general')}>Generar reporte general</Button>
        </div>

        <div className="cards-grid" style={{ marginTop: 16 }}>
          <div className="card" style={{ padding: 16, border: '1px solid var(--border)', boxShadow: 'none' }}>
            <div style={{ fontWeight: 600 }}>Usuarios</div>
            <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>{summary.users}</div>
            <div className="muted" style={{ fontSize: 12 }}>Registrados</div>
          </div>
          <div className="card" style={{ padding: 16, border: '1px solid var(--border)', boxShadow: 'none' }}>
            <div style={{ fontWeight: 600 }}>Cursos</div>
            <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>{summary.courses}</div>
            <div className="muted" style={{ fontSize: 12 }}>Totales</div>
          </div>
          <div className="card" style={{ padding: 16, border: '1px solid var(--border)', boxShadow: 'none' }}>
            <div style={{ fontWeight: 600 }}>Entregas</div>
            <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>{summary.submissions}</div>
            <div className="muted" style={{ fontSize: 12 }}>Registradas</div>
          </div>
        </div>

        <div className="cards-grid" style={{ marginTop: 16 }}>
          {loading && <div className="muted">Cargando reportes...</div>}
          {!loading && reportCards.map(r => (
            <div key={r.id} className="card" style={{ padding: 16, border: '1px solid var(--border)', boxShadow: 'none' }}>
              <div className="card-header">
                <h4 style={{ fontWeight: 600 }}>{r.name}</h4>
                <i className={r.icon} style={{ color: r.color }}></i>
              </div>
              <p className="muted">{r.description}</p>
              <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>{r.meta}</div>
              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="secondary" onClick={() => downloadCsv(r.id)}>Descargar</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
