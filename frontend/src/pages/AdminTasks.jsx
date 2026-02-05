import React, { useState } from 'react';
import api from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import Spinner from '../components/Spinner';

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
    <div className="mt-6 bg-white rounded p-4 shadow">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Admin Tasks</h3>
        <div>
          <button onClick={runSelected} disabled={running} className="px-3 py-1 bg-blue-600 text-white rounded">
            {running ? <span className="flex items-center"><Spinner size={16} message=""/> Ejecutando...</span> : 'Ejecutar seleccionadas'}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {tasks.map(t => (
          <div key={t.id} className="flex items-center justify-between p-3 border rounded">
            <label style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input type="checkbox" checked={selected.has(t.id)} onChange={() => toggle(t.id)} />
              <div>
                <div className="font-medium">{t.title}</div>
                <div className="text-sm text-gray-600">{t.desc}</div>
              </div>
            </label>
            <div>
              <button disabled={running} onClick={() => runOne(t.id)} className="px-2 py-1 bg-gray-100 rounded text-sm">Run</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
