import React, { useEffect, useState } from 'react';
import Button from '../components/ui/Button';
import Spinner from '../components/Spinner';
import api from '../lib/api';
import { useToast } from '../contexts/ToastContext';

export default function TeacherCourses() {
  const [courses, setCourses] = useState([]);
  const [meta, setMeta] = useState({ total: 0, total_pages: 1, page: 1, per_page: 20 });
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activities, setActivities] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', due_at: '' });
  const { addToast } = useToast();

  const fetchCourses = async (page = 1, query = '') => {
    setLoading(true);
    try {
      const res = await api.get('/teacher/courses', { params: { page, per_page: 20, q: query || undefined } });
      setCourses(res.data?.data || []);
      setMeta(res.data?.meta || { total: 0, total_pages: 1, page: 1, per_page: 20 });
    } catch (e) {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async (courseId) => {
    if (!courseId) return;
    try {
      const res = await api.get('/teacher/activities', { params: { course_id: courseId } });
      setActivities(res.data || []);
    } catch (e) {
      // handled by interceptor
    }
  };

  useEffect(() => { fetchCourses(1, ''); }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchCourses(1, q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const handleSelectCourse = (c) => {
    setSelectedCourse(c);
    fetchActivities(c.id);
  };

  const submitActivity = async () => {
    if (!selectedCourse) { addToast('Selecciona un curso', { type: 'error' }); return; }
    if (!form.title) { addToast('Título requerido', { type: 'error' }); return; }
    setSaving(true);
    try {
      await api.post('/teacher/activities', {
        course_id: selectedCourse.id,
        title: form.title,
        description: form.description,
        due_at: form.due_at || null,
      });
      setForm({ title: '', description: '', due_at: '' });
      await fetchActivities(selectedCourse.id);
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { type: 'success', message: 'Actividad creada' } }));
    } catch (e) {
      // interceptor toast
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 className="section-title">Mis cursos</h2>
            <p className="section-subtitle">Gestiona cursos y crea actividades rápidamente.</p>
          </div>
          <span className="pill">Profesor</span>
        </div>

        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <input aria-label="Buscar cursos" className="input" placeholder="Buscar título o descripción" value={q} onChange={e=>setQ(e.target.value)} style={{ flex: 1, minWidth: 220 }} />
          <Button onClick={()=>fetchCourses(meta.page || 1, q)}>Refrescar</Button>
        </div>

        {loading ? <div style={{ marginTop: 16 }}><Spinner /></div> : (
          <div className="cards-grid" style={{ marginTop: 16 }}>
            {courses.map(c => (
              <div key={c.id} className="card" style={{ padding: 16, border: selectedCourse?.id === c.id ? '1px solid var(--primary)' : '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{c.title}</div>
                    <div className="muted" style={{ marginTop: 6 }}>{c.description || 'Sin descripción'}</div>
                    <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>Instructor: {c.instructor_name || 'Yo'}</div>
                  </div>
                  <Button variant="secondary" onClick={()=>handleSelectCourse(c)} className="text-sm">Ver</Button>
                </div>
              </div>
            ))}
            {courses.length === 0 && <div className="muted">Sin cursos asignados.</div>}
          </div>
        )}

        {selectedCourse && (
          <div style={{ marginTop: 28 }}>
            <h3 className="section-title" style={{ fontSize: 18 }}>Actividades para {selectedCourse.title}</h3>
            <div className="cards-grid" style={{ marginTop: 16 }}>
              <div className="card" style={{ padding: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 12 }}>Crear actividad rápida</div>
                <label className="label">Título
                  <input className="input" value={form.title} onChange={e=>setForm({...form, title: e.target.value})} />
                </label>
                <label className="label" style={{ marginTop: 10 }}>Descripción
                  <textarea className="input" value={form.description} onChange={e=>setForm({...form, description: e.target.value})} />
                </label>
                <label className="label" style={{ marginTop: 10 }}>Fecha límite
                  <input type="datetime-local" className="input" value={form.due_at} onChange={e=>setForm({...form, due_at: e.target.value})} />
                </label>
                <div style={{ marginTop: 12 }}>
                  <Button onClick={submitActivity} disabled={saving} icon="✔">{saving ? 'Guardando...' : 'Crear actividad'}</Button>
                </div>
              </div>
              <div className="card" style={{ padding: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 12 }}>Actividades</div>
                {activities.length === 0 && <div className="muted">Sin actividades aún.</div>}
                <ul style={{ display: 'grid', gap: 8 }}>
                  {activities.map(a => (
                    <li key={a.id} className="card" style={{ padding: 12, border: '1px solid var(--border)' }}>
                      <div style={{ fontWeight: 600 }}>{a.title}</div>
                      <div className="muted" style={{ marginTop: 4 }}>{a.description || 'Sin descripción'}</div>
                      <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>Vence: {a.due_at ? new Date(a.due_at).toLocaleString() : 'No definida'}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
