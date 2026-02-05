import React, { useEffect, useState } from 'react';
import Button from '../components/ui/Button';
import Spinner from '../components/Spinner';
import api from '../lib/api';

export default function TeacherCourses() {
  const [courses, setCourses] = useState([]);
  const [meta, setMeta] = useState({ total: 0, total_pages: 1, page: 1, per_page: 20 });
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activities, setActivities] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', due_at: '' });

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
    if (!selectedCourse) { alert('Selecciona un curso'); return; }
    if (!form.title) { alert('Título requerido'); return; }
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
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Mis cursos</h2>
      <div className="mb-3 flex items-center gap-2">
        <input aria-label="Buscar cursos" className="border p-2 flex-1" placeholder="Buscar título o descripción" value={q} onChange={e=>setQ(e.target.value)} />
        <Button onClick={()=>fetchCourses(meta.page || 1, q)}>Refrescar</Button>
      </div>
      {loading ? <Spinner /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {courses.map(c => (
            <div key={c.id} className={`border rounded p-3 ${selectedCourse?.id === c.id ? 'border-blue-500' : ''}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold">{c.title}</div>
                  <div className="text-sm text-gray-600">{c.description || 'Sin descripción'}</div>
                  <div className="text-xs text-gray-500">Instructor: {c.instructor_name || 'Yo'}</div>
                </div>
                <Button onClick={()=>handleSelectCourse(c)} className="text-sm">Ver</Button>
              </div>
            </div>
          ))}
          {courses.length === 0 && <div className="text-sm text-gray-600">Sin cursos asignados.</div>}
        </div>
      )}

      {selectedCourse && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Actividades para {selectedCourse.title}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded p-3">
              <div className="font-semibold mb-2">Crear actividad rápida</div>
              <label className="flex flex-col mb-2 text-sm">Título
                <input className="border p-2" value={form.title} onChange={e=>setForm({...form, title: e.target.value})} />
              </label>
              <label className="flex flex-col mb-2 text-sm">Descripción
                <textarea className="border p-2" value={form.description} onChange={e=>setForm({...form, description: e.target.value})} />
              </label>
              <label className="flex flex-col mb-3 text-sm">Fecha límite
                <input type="datetime-local" className="border p-2" value={form.due_at} onChange={e=>setForm({...form, due_at: e.target.value})} />
              </label>
              <Button onClick={submitActivity} className="bg-blue-600 text-white" disabled={saving}>{saving ? 'Guardando...' : 'Crear actividad'}</Button>
            </div>
            <div className="border rounded p-3">
              <div className="font-semibold mb-2">Actividades</div>
              {activities.length === 0 && <div className="text-sm text-gray-600">Sin actividades aún.</div>}
              <ul className="space-y-2">
                {activities.map(a => (
                  <li key={a.id} className="border rounded p-2">
                    <div className="font-semibold">{a.title}</div>
                    <div className="text-sm text-gray-700">{a.description || 'Sin descripción'}</div>
                    <div className="text-xs text-gray-500">Vence: {a.due_at ? new Date(a.due_at).toLocaleString() : 'No definida'}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
