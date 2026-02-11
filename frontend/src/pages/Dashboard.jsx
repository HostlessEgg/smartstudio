import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ usersTotal: 0, subjectsTotal: 0, coursesTotal: 0, submissionsTotal: 0 });
  const [studentSummary, setStudentSummary] = useState({
    attendancePercent: 0,
    averageScore: 0,
    pendingAssignments: 0
  });
  const [teacherSummary, setTeacherSummary] = useState({
    studentsCount: 0,
    pendingSubmissions: 0,
    recentAssignments: []
  });

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const [coursesRes, messagesRes] = await Promise.all([
          api.get('/my-courses').catch(() => ({ data: [] })),
          api.get('/messages/inbox').catch(() => ({ data: { messages: [] } }))
        ]);
        if (mounted) {
          setCourses(coursesRes.data || []);
          setMessages(messagesRes.data?.messages || []);
        }

        if (user.role === 'student') {
          const assignmentsRes = await api.get('/my/assignments').catch(() => ({ data: [] }));
          const assignments = assignmentsRes.data || [];
          const pending = assignments.filter(a => a.status === 'pending').length;
          const submitted = assignments.filter(a => a.status === 'submitted').length;
          const total = assignments.length;
          const scored = assignments.filter(a => a.score !== null && typeof a.score !== 'undefined');
          const averageScore = scored.length
            ? scored.reduce((acc, cur) => acc + Number(cur.score || 0), 0) / scored.length
            : 0;
          const attendancePercent = total > 0 ? Math.round((submitted / total) * 100) : 0;
          if (mounted) {
            setStudentSummary({
              attendancePercent,
              averageScore: Number.isFinite(averageScore) ? Number(averageScore.toFixed(1)) : 0,
              pendingAssignments: pending
            });
          }
        }

        if (user.role === 'teacher') {
          const summaryRes = await api.get('/teacher/summary').catch(() => ({ data: { students_count: 0, pending_submissions: 0, recent_assignments: [] } }));
          if (mounted) {
            setTeacherSummary({
              studentsCount: summaryRes.data?.students_count || 0,
              pendingSubmissions: summaryRes.data?.pending_submissions || 0,
              recentAssignments: summaryRes.data?.recent_assignments || []
            });
          }
        }

        if (user.role === 'admin') {
          const summaryRes = await api.get('/admin/summary').catch(() => ({ data: { db: {} } }));
          if (mounted) {
            setStats({
              usersTotal: summaryRes.data?.db?.users || 0,
              subjectsTotal: summaryRes.data?.db?.assignments || 0,
              coursesTotal: summaryRes.data?.db?.courses || 0,
              submissionsTotal: summaryRes.data?.db?.submissions || 0
            });
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();
    return () => { mounted = false; };
  }, [user]);

  return (
    <div className="page">
      <div className="card" style={{ padding: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <h2 className="section-title">Bienvenido{user ? `, ${user.name || user.email}` : ''}</h2>
          <p className="section-subtitle">Resumen rápido de tu actividad y accesos.</p>
        </div>

        <div className="cards-grid">
          <Link to="/calendar" className="card" style={{ padding: 18, textDecoration: 'none' }}>
            <div className="card-header">
              <div className="card-title">Calendario</div>
              <div className="card-icon"><i className="ri-calendar-event-line" aria-hidden="true"></i></div>
            </div>
            <div className="muted" style={{ fontSize: 13 }}>Ver tareas y eventos</div>
          </Link>

          <Link to="/forums" className="card" style={{ padding: 18, textDecoration: 'none' }}>
            <div className="card-header">
              <div className="card-title">Foros</div>
              <div className="card-icon" style={{ background: 'var(--secondary)' }}><i className="ri-chat-1-line" aria-hidden="true"></i></div>
            </div>
            <div className="muted" style={{ fontSize: 13 }}>Participa en discusiones</div>
          </Link>

          <div className="card" style={{ padding: 18 }}>
            <div className="card-header">
              <div className="card-title">Mis cursos</div>
              <div className="card-icon" style={{ background: 'var(--primary)' }}><i className="ri-book-2-line" aria-hidden="true"></i></div>
            </div>
            <div className="muted" style={{ fontSize: 13 }}>Accede a tu contenido</div>
            <MyCourses courses={courses} loading={loading} />
          </div>
        </div>

        {user?.role === 'student' && (
          <div style={{ marginTop: 16, display: 'grid', gap: 16 }}>
            <div className="cards-grid">
              <div className="card" style={{ padding: 16, border: '1px solid var(--border)', boxShadow: 'none' }}>
                <div className="muted" style={{ fontSize: 12 }}>Asistencia</div>
                <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>{studentSummary.attendancePercent}%</div>
                <div className="muted" style={{ fontSize: 12 }}>Entregas vs tareas</div>
              </div>
              <div className="card" style={{ padding: 16, border: '1px solid var(--border)', boxShadow: 'none' }}>
                <div className="muted" style={{ fontSize: 12 }}>Promedio</div>
                <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>{studentSummary.averageScore}</div>
                <div className="muted" style={{ fontSize: 12 }}>Calificaciones</div>
              </div>
              <div className="card" style={{ padding: 16, border: '1px solid var(--border)', boxShadow: 'none' }}>
                <div className="muted" style={{ fontSize: 12 }}>Tareas pendientes</div>
                <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>{studentSummary.pendingAssignments}</div>
                <div className="muted" style={{ fontSize: 12 }}>Pendientes</div>
              </div>
              <div className="card" style={{ padding: 16, border: '1px solid var(--border)', boxShadow: 'none' }}>
                <div className="muted" style={{ fontSize: 12 }}>Cursos activos</div>
                <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>{courses.length}</div>
                <div className="muted" style={{ fontSize: 12 }}>Inscritos</div>
              </div>
            </div>

            <div className="card" style={{ padding: 18 }}>
              <div className="card-header">
                <div className="card-title">Actividad reciente</div>
                <span className="badge badge-primary">Mensajes</span>
              </div>
              {loading && <div className="muted">Cargando actividad...</div>}
              {!loading && messages.length === 0 && <div className="muted">Sin actividad reciente.</div>}
              <div style={{ display: 'grid', gap: 10 }}>
                {messages.slice(0, 3).map(m => (
                  <div key={m.id} className="card" style={{ padding: 12, border: '1px solid var(--border)', boxShadow: 'none' }}>
                    <div style={{ fontWeight: 600 }}>{m.sender_name || m.sender_email || 'Sistema'}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{m.subject || 'Mensaje'}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {user?.role === 'teacher' && (
          <div style={{ marginTop: 16, display: 'grid', gap: 16 }}>
            <div className="cards-grid">
              <div className="card" style={{ padding: 16, border: '1px solid var(--border)', boxShadow: 'none' }}>
                <div className="muted" style={{ fontSize: 12 }}>Estudiantes</div>
                <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>{teacherSummary.studentsCount}</div>
                <div className="muted" style={{ fontSize: 12 }}>Activos</div>
              </div>
              <div className="card" style={{ padding: 16, border: '1px solid var(--border)', boxShadow: 'none' }}>
                <div className="muted" style={{ fontSize: 12 }}>Cursos activos</div>
                <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>{courses.length}</div>
                <div className="muted" style={{ fontSize: 12 }}>A cargo</div>
              </div>
              <div className="card" style={{ padding: 16, border: '1px solid var(--border)', boxShadow: 'none' }}>
                <div className="muted" style={{ fontSize: 12 }}>Tareas por calificar</div>
                <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>{teacherSummary.pendingSubmissions}</div>
                <div className="muted" style={{ fontSize: 12 }}>Pendientes</div>
              </div>
              <div className="card" style={{ padding: 16, border: '1px solid var(--border)', boxShadow: 'none' }}>
                <div className="muted" style={{ fontSize: 12 }}>Mensajes</div>
                <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>{messages.length}</div>
                <div className="muted" style={{ fontSize: 12 }}>Inbox</div>
              </div>
            </div>

            <div className="card" style={{ padding: 18 }}>
              <div className="card-header">
                <div className="card-title">Cursos recientes</div>
                <Link to="/teacher/courses" className="badge badge-primary" style={{ textDecoration: 'none' }}>Ver todos</Link>
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                {teacherSummary.recentAssignments.slice(0, 3).map(a => (
                  <div key={a.id} className="card" style={{ padding: 12, border: '1px solid var(--border)', boxShadow: 'none' }}>
                    <div style={{ fontWeight: 600 }}>{a.title || 'Assignment'}</div>
                    <div className="muted" style={{ fontSize: 12 }}>Creado: {a.created_at ? new Date(a.created_at).toLocaleDateString() : 'N/A'}</div>
                  </div>
                ))}
                {!loading && teacherSummary.recentAssignments.length === 0 && <div className="muted">No hay assignments recientes.</div>}
              </div>
            </div>
          </div>
        )}

        {user?.role === 'admin' && (
          <div style={{ marginTop: 16, display: 'grid', gap: 16 }}>
            <div className="cards-grid">
              <div className="card" style={{ padding: 16, border: '1px solid var(--border)', boxShadow: 'none' }}>
                <div className="muted" style={{ fontSize: 12 }}>Usuarios</div>
                <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>{stats.usersTotal}</div>
                <div className="muted" style={{ fontSize: 12 }}>Registrados</div>
              </div>
              <div className="card" style={{ padding: 16, border: '1px solid var(--border)', boxShadow: 'none' }}>
                <div className="muted" style={{ fontSize: 12 }}>Cursos</div>
                <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>{stats.coursesTotal}</div>
                <div className="muted" style={{ fontSize: 12 }}>Activos</div>
              </div>
              <div className="card" style={{ padding: 16, border: '1px solid var(--border)', boxShadow: 'none' }}>
                <div className="muted" style={{ fontSize: 12 }}>Entregas</div>
                <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>{stats.submissionsTotal}</div>
                <div className="muted" style={{ fontSize: 12 }}>Registradas</div>
              </div>
              <div className="card" style={{ padding: 16, border: '1px solid var(--border)', boxShadow: 'none' }}>
                <div className="muted" style={{ fontSize: 12 }}>Mensajes</div>
                <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>{messages.length}</div>
                <div className="muted" style={{ fontSize: 12 }}>Inbox</div>
              </div>
            </div>

            <div className="cards-grid">
              <Link to="/admin/users" className="card" style={{ padding: 18, textDecoration: 'none' }}>
                <div className="card-header">
                  <div className="card-title">Gestión de Usuarios</div>
                  <div className="card-icon" style={{ background: 'var(--primary)' }}><i className="ri-user-settings-fill" aria-hidden="true"></i></div>
                </div>
                <div className="muted" style={{ fontSize: 13 }}>Altas, roles y estado</div>
              </Link>
              <Link to="/reports" className="card" style={{ padding: 18, textDecoration: 'none' }}>
                <div className="card-header">
                  <div className="card-title">Reportes del sistema</div>
                  <div className="card-icon" style={{ background: 'var(--secondary)' }}><i className="ri-bar-chart-fill" aria-hidden="true"></i></div>
                </div>
                <div className="muted" style={{ fontSize: 13 }}>Indicadores clave</div>
              </Link>
              <Link to="/settings" className="card" style={{ padding: 18, textDecoration: 'none' }}>
                <div className="card-header">
                  <div className="card-title">Configuración</div>
                  <div className="card-icon" style={{ background: 'var(--danger)' }}><i className="ri-settings-3-line" aria-hidden="true"></i></div>
                </div>
                <div className="muted" style={{ fontSize: 13 }}>Preferencias del sistema</div>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

function MyCourses({ courses = [], loading = false }) {
  const { user } = useAuth();

  if (!user) return <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>Inicia sesión para ver tus cursos</div>;
  if (loading) return <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>Cargando cursos...</div>;
  if (!courses || courses.length === 0) return <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>No estás inscrito en cursos</div>;

  return (
    <ul style={{ marginTop: 10, display: 'grid', gap: 6 }}>
      {courses.map(c => (
        <li key={c.id}>
          <a href={`/course/${c.id}`} className="muted" style={{ fontSize: 13 }}>{c.title || 'Curso sin título'}</a>
        </li>
      ))}
    </ul>
  );
}