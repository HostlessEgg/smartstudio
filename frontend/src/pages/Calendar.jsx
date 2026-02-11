import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import Toast from '../components/Toast';
import FullCalendarWrapper from '../components/FullCalendarWrapper';
import ConfirmModal from '../components/ConfirmModal';
import Button from '../components/ui/Button';

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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

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
      const res = await api.get(endpoint.replace('/api', ''), { params });
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
        const res = await api.get('/curriculum');
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
    setToast({ message: `${ev.title}${ev.description ? ` — ${ev.description}` : ''}`, type: 'info' });
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
        await api.put(`/assignments/${editingId}`, payload);
        setEditingId(null);
        setToast({ message: 'Asignación actualizada', type: 'success' });
      } else {
        await api.post('/assignments', payload);
        setToast({ message: 'Asignación creada', type: 'success' });
      }
      setShowForm(false);
      setForm({ title: '', description: '', start_at: '', end_at: '', grade_id: '', subject_id: '' });
      fetchEvents();
    } catch (err) {
      console.error('Error creating assignment', err);
      setToast({ message: err.response?.data?.error || 'Error creando asignación', type: 'error' });
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

  const handleDelete = (id) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/assignments/${deleteId}`);
      setToast({ message: 'Asignación eliminada', type: 'success' });
      fetchEvents();
    } catch (err) {
      console.error('Error eliminando asignación', err);
      setToast({ message: 'Error eliminando asignación', type: 'error' });
    } finally {
      setDeleteId(null);
      setConfirmOpen(false);
    }
  };

  return (
    <div className="page">
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 className="section-title">Calendario de Asignaciones</h2>
            <p className="section-subtitle">Organiza eventos y entregas.</p>
          </div>
          {user && (user.role === 'teacher' || user.role === 'admin') ? (
            <Button onClick={() => setShowForm(true)}>Crear asignación</Button>
          ) : (
            <div className="muted" style={{ fontSize: 12 }}>Si eres profesor, <a href="/login">inicia sesión</a> para crear asignaciones.</div>
          )}
        </div>

        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <select value={filters.grade} onChange={e => setFilters({ ...filters, grade: e.target.value })} className="input" style={{ minWidth: 200 }}>
            <option value="">Todos los grados</option>
            {grades.map(g => <option key={g.id} value={g.id}>{g.name || g.label || `Grado ${g.id}`}</option>)}
          </select>
          <select value={filters.subject} onChange={e => setFilters({ ...filters, subject: e.target.value })} className="input" style={{ minWidth: 200 }}>
            <option value="">Todas las materias</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name || s.label || s.title || `Materia ${s.id}`}</option>)}
          </select>
          <div style={{ flex: 1, minWidth: 220 }}>
            <input placeholder="Buscar..." value={filters.q} onChange={e => setFilters({ ...filters, q: e.target.value })} className="input" />
          </div>
          <Button variant="ghost" onClick={() => { setFilters({ grade: '', subject: '', q: '' }); }}>Limpiar</Button>
        </div>

        <div style={{ marginTop: 16 }}>
          <p className="muted" style={{ marginBottom: 8, fontSize: 12 }}>Lista de asignaciones:</p>
        {supportsFullCalendar ? (
          <div className="table-container">
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
          <ul style={{ display: 'grid', gap: 8 }}>
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
                <li key={ev.id} className="card" style={{ padding: 12, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{ev.title}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{new Date(ev.start).toLocaleString()} {ev.end ? `- ${new Date(ev.end).toLocaleString()}` : ''}</div>
                    <div style={{ marginTop: 6, fontSize: 14 }}>{ev.extendedProps?.description}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 140 }}>
                    <Button variant="ghost" onClick={() => { window.location.href = `/assignments/${ev.id}`; }}>Ver</Button>
                    {(user && (user.role === 'teacher' || user.role === 'admin')) && (
                      <>
                        <Button variant="ghost" onClick={() => handleEdit(ev)}>Editar</Button>
                        <Button variant="danger" onClick={() => handleDelete(ev.id)}>Eliminar</Button>
                      </>
                    )}
                  </div>
                </li>
              ))}
          </ul>
        )}

          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Button variant="ghost" onClick={() => setPage(p => Math.max(1, p - 1))}>Anterior</Button>
            <div className="muted" style={{ fontSize: 12 }}>Página {page}</div>
            <Button variant="ghost" onClick={() => setPage(p => p + 1)}>Siguiente</Button>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center" aria-modal="true" role="dialog">
          <div className="fixed inset-0 bg-black opacity-40" onClick={() => setShowForm(false)} />
            <div className="card modal-content" style={{ zIndex: 50, width: '100%', maxWidth: 720, margin: '0 16px', padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontWeight: 600 }}>{editingId ? 'Editar Asignación' : 'Crear Asignación'}</h3>
              <Button variant="ghost" onClick={() => setShowForm(false)} ariaLabel="Cerrar">Cerrar</Button>
            </div>
            <form onSubmit={handleCreate} style={{ display: 'grid', gap: 10 }}>
              <div>
                <input autoFocus required placeholder="Título" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input" />
              </div>
              <div>
                <textarea placeholder="Descripción" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input" />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input required type="datetime-local" value={form.start_at} onChange={e => setForm({ ...form, start_at: e.target.value })} className="input" />
                <input type="datetime-local" value={form.end_at} onChange={e => setForm({ ...form, end_at: e.target.value })} className="input" />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <select value={form.grade_id} onChange={e => setForm({ ...form, grade_id: e.target.value })} className="input">
                  <option value="">-- Seleccionar grado (opcional) --</option>
                  {grades.map(g => (
                    <option key={g.id} value={g.id}>{g.name || g.label || `Grado ${g.id}`}</option>
                  ))}
                </select>

                <select value={form.subject_id} onChange={e => setForm({ ...form, subject_id: e.target.value })} className="input">
                  <option value="">-- Seleccionar materia (opcional) --</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name || s.label || `Materia ${s.id}`}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <Button type="submit">{editingId ? 'Guardar' : 'Crear'}</Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* modal keyboard + focus trap handlers */}
      {showForm && null}
      {/* modal keyboard + focus trap handled by effect */}

      {loading && <div className="muted" style={{ marginTop: 8 }}>Cargando eventos...</div>}
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
      <ConfirmModal
        open={confirmOpen}
        message="¿Eliminar esta asignación?"
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
