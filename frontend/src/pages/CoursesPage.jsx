import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import api from '../lib/api';

export default function CoursesPage() {
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get('/my-courses');
        const base = res.data || [];

        const enriched = await Promise.all(base.map(async (course) => {
          const [progressRes, detailsRes] = await Promise.all([
            api.get(`/progress/${course.id}`).catch(() => ({ data: { total_lessons: 0, completed_lessons: 0 } })),
            api.get(`/courses/${course.id}`).catch(() => ({ data: { modules: [] } }))
          ]);
          const totalLessons = Number(progressRes.data?.total_lessons || 0);
          const completedLessons = Number(progressRes.data?.completed_lessons || 0);
          const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
          const modules = detailsRes.data?.modules || [];
          const modulesCount = modules.length;
          const lessonsCount = modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);

          return {
            ...course,
            progress,
            modulesCount,
            lessonsCount
          };
        }));

        if (mounted) setCourses(enriched);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    if (tab === 'active') return courses.filter(c => (c.progress || 0) < 100);
    if (tab === 'completed') return courses.filter(c => (c.progress || 0) >= 100);
    return courses;
  }, [courses, tab]);

  return (
    <div className="page">
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 className="section-title">Cursos</h2>
            <p className="section-subtitle">Consulta tus cursos y el avance general.</p>
          </div>
          <span className="pill">Académico</span>
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button variant={tab === 'all' ? 'primary' : 'ghost'} onClick={() => setTab('all')}>Todos</Button>
          <Button variant={tab === 'active' ? 'primary' : 'ghost'} onClick={() => setTab('active')}>Activos</Button>
          <Button variant={tab === 'completed' ? 'primary' : 'ghost'} onClick={() => setTab('completed')}>Completados</Button>
        </div>

        <div className="cards-grid" style={{ marginTop: 16 }}>
          {loading && <div className="muted">Cargando cursos...</div>}
          {!loading && filtered.length === 0 && <div className="muted">No hay cursos para mostrar.</div>}
          {filtered.map(course => (
            <div key={course.id} className="card" style={{ padding: 16, border: '1px solid var(--border)', boxShadow: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{course.title}</div>
                  <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>{course.instructor_name || 'Sin instructor'}</div>
                </div>
                <span className={`badge ${course.progress >= 100 ? 'badge-success' : 'badge-primary'}`}>
                  {course.progress >= 100 ? 'Completado' : 'Activo'}
                </span>
              </div>
              <div style={{ marginTop: 12 }}>
                <div className="progress-info">
                  <span className="muted">Progreso</span>
                  <span className="muted">{course.progress}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${course.progress}%` }} />
                </div>
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span className="badge badge-secondary">{course.modulesCount} módulos</span>
                <span className="badge badge-primary">{course.lessonsCount} lecciones</span>
              </div>
              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                <Link to={`/course/${course.id}`}>
                  <Button variant="secondary">Ver curso</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
