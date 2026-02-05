import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import Toast from '../components/Toast';
import FullCalendarWrapper from '../components/FullCalendarWrapper';

export default function CalendarPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filters, setFilters] = useState({ grade: '', subject: '', q: '' });
  const [editingId, setEditingId] = useState(null);
  // FullCalendar is optional. By default we render a simple list view.
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', start_at: '', end_at: '', grade_id: '', subject_id: '' });
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const fetchEvents = async (from, to) => {
    setLoading(true);
    try {
      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;
      // include filters when present
      if (filters.grade) params.gradeId = filters.grade;
      if (filters.subject) params.subjectId = filters.subject;
      if (filters.q) params.q = filters.q;
      const endpoint = user?.role === 'student' ? '/api/my/assignments' : '/api/assignments';
      const res = await axios.get(endpoint, { params });
      const items = (res.data || []).map(a => ({
        id: a.id,
        title: a.title + (a.grade_name ? ` - ${a.grade_name}` : ''),
        start: a.start_at,
        end: a.end_at || undefined,
        extendedProps: a
      }));
      setEvents(items);
    } catch (err) {
      console.error('Error fetching assignments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    // FullCalendar dynamic loading removed in this environment to avoid dev-server
    // pre-bundling errors. We keep a simple list view of assignments instead.
    // fetch curriculum (levels->grades->subjects) for selectors
    (async () => {
      try {
        const res = await axios.get('/api/curriculum');
        const data = res.data || {};
        // Expected normalized response: { levels: [ { id, name, grades: [ { id, name, subjects: [...] } ] } ] }
        if (Array.isArray(data.levels)) {
          // Flatten grades and subjects for simple selectors
          const gradesList = [];
          const subjectsList = [];
          data.levels.forEach(level => {
            (level.grades || []).forEach(grade => {
              gradesList.push({ id: grade.id, name: grade.name });
              (grade.subjects || []).forEach(sub => subjectsList.push({ id: sub.id, name: sub.name }));
            });
          });
          setGrades(gradesList);
          // de-duplicate subjects by id
          const uniq = {};
          subjectsList.forEach(s => { if (!uniq[s.id]) uniq[s.id] = s; });
          setSubjects(Object.values(uniq));
        } else {
          // fallback: try previous formats
          if (Array.isArray(data.grades)) setGrades(data.grades);
          if (Array.isArray(data.subjects)) setSubjects(data.subjects);
        }
      } catch (err) {
        console.error('Error fetching curriculum', err);
      }
    })();
  }, [user]);

  // Re-fetch events when filters change
  useEffect(() => {
    // reset to first page and fetch
    setPage(1);
    fetchEvents();
  }, [filters]);

  const supportsFullCalendar = typeof window !== 'undefined' && !!window.FullCalendar;

  // Persist filters to localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('calendar_filters');
      if (saved) setFilters(JSON.parse(saved));
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('calendar_filters', JSON.stringify(filters));
    } catch (e) {}
  }, [filters]);

  useEffect(() => { setPage(1); }, [filters]);

  // Modal keyboard trap and focus management
  useEffect(() => {
    if (!showForm) return undefined;
    const trap = (e) => {
      if (e.key === 'Escape') {
        setShowForm(false);
        return;
      }
      if (e.key === 'Tab') {
        const modal = document.querySelector('.modal-content');
        if (!modal) return;
        const focusable = modal.querySelectorAll('a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])');
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    document.addEventListener('keydown', trap);
    // focus first input when modal opens (only once)
    const timer = setTimeout(() => {
      const firstInput = document.querySelector('.modal-content input, .modal-content textarea, .modal-content select');
      if (firstInput) firstInput.focus();
    }, 0);
    return () => { document.removeEventListener('keydown', trap); clearTimeout(timer); };
  }, [showForm]);

  const handleDateSelect = (selectInfo) => {
    setForm({ ...form, start_at: selectInfo.startStr, end_at: selectInfo.endStr });
    setShowForm(true);
  };

  const handleEventClick = (clickInfo) => {
    const ev = clickInfo.event.extendedProps;
    alert(`Assignment:\n${ev.title}\n\n${ev.description || ''}`);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: form.title,
        description: form.description,
        start_at: form.start_at,
        end_at: form.end_at || null,
        grade_id: form.grade_id || null,
        subject_id: form.subject_id || null
      };
      if (editingId) {
        await axios.put(`/api/assignments/${editingId}`, payload);
        setEditingId(null);
        setToast({ message: 'Asignación actualizada', type: 'success' });
      } else {
        await axios.post('/api/assignments', payload);
        setToast({ message: 'Asignación creada', type: 'success' });
      }
      setShowForm(false);
      setForm({ title: '', description: '', start_at: '', end_at: '', grade_id: '', subject_id: '' });
      fetchEvents();
    } catch (err) {
      console.error('Error creating assignment', err);
      setToast({ message: err.response?.data?.error || 'Error creando assignment', type: 'error' });
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({
      title: item.extendedProps.title || item.title,
      description: item.extendedProps.description || item.extendedProps?.description || '',
      start_at: item.start,
      end_at: item.end || '',
      grade_id: item.extendedProps.grade_id || '',
      subject_id: item.extendedProps.subject_id || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta asignación?')) return;
    try {
      await axios.delete(`/api/assignments/${id}`);
      setToast({ message: 'Asignación eliminada', type: 'success' });
      fetchEvents();
    } catch (err) {
      console.error('Error eliminando asignación', err);
      setToast({ message: 'Error eliminando asignación', type: 'error' });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Calendario de Asignaciones</h2>
        {user && (user.role === 'teacher' || user.role === 'admin') ? (
          <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-3 py-1 rounded">Crear asignación</button>
        ) : (
          <div className="text-sm text-gray-600">Si eres profesor, <a href="/login" className="text-blue-600">inicia sesión</a> para crear asignaciones.</div>
        )}
      </div>

      <div className="mb-4 flex items-center gap-3">
        <div>
          <select value={filters.grade} onChange={e => setFilters({ ...filters, grade: e.target.value })} className="border p-2">
            <option value="">Todos los grados</option>
            {grades.map(g => <option key={g.id} value={g.id}>{g.name || g.label || `Grado ${g.id}`}</option>)}
          </select>
        </div>
        <div>
          <select value={filters.subject} onChange={e => setFilters({ ...filters, subject: e.target.value })} className="border p-2">
            <option value="">Todas las materias</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name || s.label || s.title || `Materia ${s.id}`}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <input placeholder="Buscar..." value={filters.q} onChange={e => setFilters({ ...filters, q: e.target.value })} className="border p-2 w-full" />
        </div>
        <div>
          <button onClick={() => { setFilters({ grade: '', subject: '', q: '' }); }} className="px-3 py-1 border rounded">Limpiar</button>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm text-gray-600">Lista de asignaciones:</p>
        {supportsFullCalendar ? (
          <div className="border rounded">
            <FullCalendarWrapper
              events={events}
              onDateSelect={(info) => {
                // map FullCalendar select info to our form
                setForm({ ...form, start_at: info.startStr || info.start?.toISOString?.(), end_at: info.endStr || '' });
                setShowForm(true);
              }}
              onEventClick={(info) => {
                // find event in our list and open edit
                const ev = events.find(e => String(e.id) === String(info.event.id));
                if (ev) handleEdit(ev);
              }}
            />
          </div>
        ) : (
          <ul className="space-y-2">
            {events
              .filter(ev => {
                if (filters.grade && String(ev.extendedProps?.grade_id) !== String(filters.grade)) return false;
                if (filters.subject && String(ev.extendedProps?.subject_id) !== String(filters.subject)) return false;
                if (filters.q) {
                  const q = filters.q.toLowerCase();
                  if (!((ev.title || '').toLowerCase().includes(q) || (ev.extendedProps?.description || '').toLowerCase().includes(q))) return false;
                }
                return true;
              })
              .slice((page - 1) * pageSize, page * pageSize)
              .map(ev => (
                <li key={ev.id} className="p-2 border rounded flex items-start justify-between">
                  <div>
                    <div className="font-semibold">{ev.title}</div>
                    <div className="text-sm text-gray-600">{new Date(ev.start).toLocaleString()} {ev.end ? `- ${new Date(ev.end).toLocaleString()}` : ''}</div>
                    <div className="mt-1 text-sm">{ev.extendedProps?.description}</div>
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <a href={`/assignments/${ev.id}`} className="px-2 py-1 bg-blue-200 rounded text-sm">Ver</a>
                    {(user && (user.role === 'teacher' || user.role === 'admin')) && (
                      <>
                        <button onClick={() => handleEdit(ev)} className="px-2 py-1 bg-yellow-300 rounded">Editar</button>
                        <button onClick={() => handleDelete(ev.id)} className="px-2 py-1 bg-red-500 text-white rounded">Eliminar</button>
                      </>
                    )}
                  </div>
                </li>
              ))}
          </ul>
        )}

        <div className="mt-3 flex items-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} className="px-2 py-1 border rounded">Anterior</button>
          <div className="text-sm text-gray-600">Página {page}</div>
          <button onClick={() => setPage(p => p + 1)} className="px-2 py-1 border rounded">Siguiente</button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center" aria-modal="true" role="dialog">
          <div className="fixed inset-0 bg-black opacity-40" onClick={() => setShowForm(false)} />
            <div className="bg-white rounded shadow-lg z-50 w-full max-w-2xl mx-4 p-4 modal-content">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">{editingId ? 'Editar Asignación' : 'Crear Asignación'}</h3>
              <button onClick={() => setShowForm(false)} aria-label="Cerrar" className="px-2 py-1 rounded bg-gray-200">Cerrar</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-2">
              <div>
                <input autoFocus required placeholder="Título" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="border p-2 w-full" />
              </div>
              <div>
                <textarea placeholder="Descripción" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="border p-2 w-full" />
              </div>
              <div className="flex gap-2">
                <input required type="datetime-local" value={form.start_at} onChange={e => setForm({ ...form, start_at: e.target.value })} className="border p-2 flex-1" />
                <input type="datetime-local" value={form.end_at} onChange={e => setForm({ ...form, end_at: e.target.value })} className="border p-2 flex-1" />
              </div>
              <div className="flex gap-2">
                <select value={form.grade_id} onChange={e => setForm({ ...form, grade_id: e.target.value })} className="border p-2 w-1/2">
                  <option value="">-- Seleccionar grado (opcional) --</option>
                  {grades.map(g => (
                    <option key={g.id} value={g.id}>{g.name || g.label || `Grado ${g.id}`}</option>
                  ))}
                </select>

                <select value={form.subject_id} onChange={e => setForm({ ...form, subject_id: e.target.value })} className="border p-2 w-1/2">
                  <option value="">-- Seleccionar materia (opcional) --</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name || s.label || `Materia ${s.id}`}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <button type="submit" className="bg-green-600 text-white px-3 py-1 rounded">{editingId ? 'Guardar' : 'Crear'}</button>
                <button type="button" onClick={() => setShowForm(false)} className="bg-gray-200 px-3 py-1 rounded">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* modal keyboard + focus trap handlers */}
      {showForm && null}
      {/* modal keyboard + focus trap handled by effect */}

      {loading && <div className="mt-2">Cargando eventos...</div>}
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
    </div>
  );
}
