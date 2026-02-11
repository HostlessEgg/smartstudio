import React, { useState } from 'react';
import api from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import Spinner from '../components/Spinner';
import Button from '../components/ui/Button';

const DEFAULT_TASKS = [
  { id: 'reindex_search', title: 'Reindexar search', desc: 'Reconstruir índices de búsqueda' },
  { id: 'run_migrations', title: 'Aplicar migraciones pendientes', desc: 'Ejecutar migraciones SQL' },
  { id: 'prune_uploads', title: 'Prune uploads', desc: 'Eliminar archivos temporales no referenciados' },
  { id: 'clear_cache', title: 'Clear cache', desc: 'Borrar cachés internos' }
];

export default function AdminTasks() {
  const [tasks] = useState(DEFAULT_TASKS);
  const [selected, setSelected] = useState(new Set());
  const [running, setRunning] = useState(false);
  const { addToast } = useToast();

  const toggle = (id) => {
    const s = new Set(selected);
    if (s.has(id)) s.delete(id); else s.add(id);
    setSelected(s);
  };

  const runSelected = async () => {
    if (selected.size === 0) return addToast('Selecciona al menos una tarea', { type: 'info' });
    setRunning(true);
    try {
      const actions = Array.from(selected);
      // Call the admin action endpoint; backend may implement specific handlers.
      const res = await api.post('/admin/actions/run', { actions });
      addToast(res.data?.message || 'Acciones encoladas', { type: 'success' });
      setSelected(new Set());
    } catch (err) {
      console.error('Error running admin tasks', err);
      addToast(err.response?.data?.error || 'Error ejecutando tareas', { type: 'error' });
    } finally {
      setRunning(false);
    }
  };

  const runOne = async (id) => {
    setRunning(true);
    try {
      const res = await api.post('/admin/actions/run', { actions: [id] });
      addToast(res.data?.message || `Tarea ${id} encolada`, { type: 'success' });
    } catch (err) {
      console.error('Error running admin task', err);
      addToast(err.response?.data?.error || 'Error ejecutando tarea', { type: 'error' });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ fontWeight: 600 }}>Tareas administrativas</h3>
          <div className="muted" style={{ fontSize: 12 }}>Ejecuta acciones de mantenimiento.</div>
        </div>
        <Button onClick={runSelected} disabled={running}>
          {running ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Spinner size={16} message=""/> Ejecutando...</span> : 'Ejecutar seleccionadas'}
        </Button>
      </div>

      <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
        {tasks.map(t => (
          <div key={t.id} className="card" style={{ padding: 14, border: '1px solid var(--border)', boxShadow: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input type="checkbox" checked={selected.has(t.id)} onChange={() => toggle(t.id)} />
                <div>
                  <div style={{ fontWeight: 600 }}>{t.title}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{t.desc}</div>
                </div>
              </label>
              <Button variant="secondary" disabled={running} onClick={() => runOne(t.id)}>Ejecutar</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
