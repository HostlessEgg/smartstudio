import React, { useEffect, useState } from 'react';
import Button from '../components/ui/Button';
import Spinner from '../components/Spinner';
import api from '../lib/api';
import { useToast } from '../contexts/ToastContext';

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ text_submission: '', file_url: '' });
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

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
    if (!selected) { addToast('Selecciona una tarea', { type: 'error' }); return; }
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
    <div className="page">
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 className="section-title">Mis tareas</h2>
            <p className="section-subtitle">Filtra y entrega tus actividades.</p>
          </div>
          <span className="pill">Estudiante</span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginTop: 16 }}>
          <input className="input" placeholder="Buscar por título o materia" value={q} onChange={e=>setQ(e.target.value)} style={{ flex: 1, minWidth: 220 }} />
          <select className="input" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{ minWidth: 180 }}>
            <option value="all">Todas</option>
            <option value="pending">Pendientes</option>
            <option value="submitted">Entregadas</option>
          </select>
          <Button onClick={loadAssignments}>Refrescar</Button>
        </div>

        {loading ? <div style={{ marginTop: 16 }}><Spinner /></div> : (
          <div className="cards-grid" style={{ marginTop: 16 }}>
            {assignments.map(a => (
              <div key={a.id} className="card" style={{ padding: 16, border: selected?.id === a.id ? '1px solid var(--primary)' : '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ fontWeight: 600 }}>{a.title}</span>
                  <span className={`badge ${a.status === 'submitted' ? 'badge-success' : 'badge-warning'}`}>{a.status === 'submitted' ? 'Entregada' : 'Pendiente'}</span>
                </div>
                <div className="muted" style={{ marginTop: 8 }}>{a.description || 'Sin descripción'}</div>
                <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>Materia: {a.subject_name || 'N/D'} · Grado: {a.grade_name || 'N/D'}</div>
                <div className="muted" style={{ fontSize: 12 }}>Inicio: {a.start_at ? new Date(a.start_at).toLocaleString() : '—'}</div>
                <div className="muted" style={{ fontSize: 12 }}>Entrega: {a.end_at ? new Date(a.end_at).toLocaleString() : '—'}</div>
                {a.submission_id && (
                  <div style={{ marginTop: 6, fontSize: 12, color: 'var(--success)' }}>Enviada el {a.submitted_at ? new Date(a.submitted_at).toLocaleString() : ''}{a.score ? ` · Nota: ${a.score}` : ''}</div>
                )}
                <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="secondary" onClick={()=>setSelected(a)} className="text-sm">Seleccionar</Button>
                </div>
              </div>
            ))}
            {assignments.length === 0 && <div className="muted">No hay tareas con este filtro.</div>}
          </div>
        )}

        {selected && (
          <div className="card" style={{ marginTop: 20, padding: 16 }}>
            <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Entregar: {selected.title}</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              <label className="label">Texto / notas
                <textarea className="input" value={form.text_submission} onChange={e=>setForm({...form, text_submission: e.target.value})} />
              </label>
              <label className="label">URL de archivo (opcional)
                <input className="input" placeholder="https://..." value={form.file_url} onChange={e=>setForm({...form, file_url: e.target.value})} />
              </label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Button onClick={submit} disabled={submitting} icon="✔">{submitting ? 'Enviando...' : 'Enviar entrega'}</Button>
                {selected.submission_id && <span className="muted" style={{ fontSize: 12 }}>Ya enviaste una entrega. Puedes reenviar para actualizar.</span>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
