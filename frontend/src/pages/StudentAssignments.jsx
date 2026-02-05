import React, { useEffect, useState } from 'react';
import Button from '../components/ui/Button';
import Spinner from '../components/Spinner';
import api from '../lib/api';

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ text_submission: '', file_url: '' });
  const [submitting, setSubmitting] = useState(false);

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/my/assignments');
      const rows = res.data || [];
      const filtered = rows.filter(a => {
        if (statusFilter === 'pending') return a.status !== 'submitted';
        if (statusFilter === 'submitted') return a.status === 'submitted';
        return true;
      }).filter(a => {
        if (!q) return true;
        const haystack = `${a.title || ''} ${a.subject_name || ''}`.toLowerCase();
        return haystack.includes(q.toLowerCase());
      });
      setAssignments(filtered);
      // keep selection if exists
      if (selected) {
        const next = filtered.find(a => a.id === selected.id);
        setSelected(next || null);
      }
    } catch (e) {
      // toast via interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAssignments(); }, []);
  useEffect(() => { const t = setTimeout(loadAssignments, 250); return () => clearTimeout(t); }, [statusFilter, q]);

  const submit = async () => {
    if (!selected) { alert('Selecciona una tarea'); return; }
    setSubmitting(true);
    try {
      await api.post(`/assignments/${selected.id}/submissions`, {
        text_submission: form.text_submission || null,
        file_url: form.file_url || null,
      });
      setForm({ text_submission: '', file_url: '' });
      await loadAssignments();
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { type: 'success', message: 'Entrega enviada' } }));
    } catch (e) {
      // toast via interceptor
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Mis tareas</h2>
      <div className="flex flex-wrap gap-2 mb-3 items-center">
        <input className="border p-2 flex-1" placeholder="Buscar por título o materia" value={q} onChange={e=>setQ(e.target.value)} />
        <select className="border p-2" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
          <option value="all">Todas</option>
          <option value="pending">Pendientes</option>
          <option value="submitted">Entregadas</option>
        </select>
        <Button onClick={loadAssignments}>Refrescar</Button>
      </div>
      {loading ? <Spinner /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {assignments.map(a => (
            <div key={a.id} className={`border rounded p-3 ${selected?.id === a.id ? 'border-blue-600' : ''}`}>
              <div className="font-semibold flex justify-between items-start">
                <span>{a.title}</span>
                <span className="text-xs px-2 py-1 rounded bg-gray-100">{a.status === 'submitted' ? 'Entregada' : 'Pendiente'}</span>
              </div>
              <div className="text-sm text-gray-700">{a.description || 'Sin descripción'}</div>
              <div className="text-xs text-gray-500 mt-1">Materia: {a.subject_name || 'N/D'} · Grado: {a.grade_name || 'N/D'}</div>
              <div className="text-xs text-gray-500">Inicio: {a.start_at ? new Date(a.start_at).toLocaleString() : '—'}</div>
              <div className="text-xs text-gray-500">Entrega: {a.end_at ? new Date(a.end_at).toLocaleString() : '—'}</div>
              {a.submission_id && (
                <div className="text-xs text-green-700 mt-1">Enviada el {a.submitted_at ? new Date(a.submitted_at).toLocaleString() : ''}{a.score ? ` · Nota: ${a.score}` : ''}</div>
              )}
              <div className="mt-2 flex justify-end">
                <Button className="text-sm" onClick={()=>setSelected(a)}>Seleccionar</Button>
              </div>
            </div>
          ))}
          {assignments.length === 0 && <div className="text-sm text-gray-600">No hay tareas con este filtro.</div>}
        </div>
      )}

      {selected && (
        <div className="mt-6 border rounded p-4">
          <h3 className="text-lg font-semibold mb-2">Entregar: {selected.title}</h3>
          <div className="grid gap-3">
            <label className="flex flex-col text-sm">Texto / notas
              <textarea className="border p-2" value={form.text_submission} onChange={e=>setForm({...form, text_submission: e.target.value})} />
            </label>
            <label className="flex flex-col text-sm">URL de archivo (opcional)
              <input className="border p-2" placeholder="https://..." value={form.file_url} onChange={e=>setForm({...form, file_url: e.target.value})} />
            </label>
            <div className="flex gap-2 items-center">
              <Button className="bg-blue-600 text-white" onClick={submit} disabled={submitting}>{submitting ? 'Enviando...' : 'Enviar entrega'}</Button>
              {selected.submission_id && <span className="text-xs text-gray-600">Ya enviaste una entrega. Puedes reenviar para actualizar.</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
