import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import AdminTasks from './AdminTasks';

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/summary');
      setSummary(res.data);
    } catch (err) {
      console.error('Error fetching admin summary', err);
      addToast('No se pudo obtener resumen admin', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSummary(); }, []);

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Panel administrador</h2>
          <div>
            <button onClick={fetchSummary} className="px-3 py-2 bg-purple-600 text-white rounded">{loading ? 'Cargando...' : 'Actualizar'}</button>
          </div>
        </div>

        {loading ? (
          <div className="mt-6"><Spinner message="Cargando resumen..." /></div>
        ) : summary ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <Card title="Usuarios" value={summary?.db?.users ?? '—'} />
            <Card title="Cursos" value={summary?.db?.courses ?? '—'} />
            <Card title="Submissions" value={summary?.db?.submissions ?? '—'} />
            <Card title="Migrations" value={summary?.db?.migrations ?? '—'} />
          </div>
        ) : (
          <div className="mt-6"><EmptyState title="Sin datos" description="No se encontró información del sistema." /></div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card title="Foro (threads)" value={summary?.db?.forum_threads ?? '—'} />
          <Card title="Quiz submissions" value={summary?.db?.quiz_submissions ?? '—'} />
          <Card title="Assignments" value={summary?.db?.assignments ?? '—'} />
        </div>

        <div className="mt-6">
          <h3 className="font-semibold">Recent assignments</h3>
          <div className="mt-2 bg-gray-50 p-3 rounded">
            {summary?.recent_assignments && summary.recent_assignments.length > 0 ? (
              <ul>
                {summary.recent_assignments.map(a => (
                  <li key={a.id} className="py-2 border-b last:border-b-0">
                    <div className="font-medium">{a.title}</div>
                    <div className="text-sm text-gray-500">{a.start_at ? new Date(a.start_at).toLocaleString() : ''} — {a.end_at ? new Date(a.end_at).toLocaleString() : ''}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-gray-500">No recent assignments</div>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <h3 className="font-semibold">Health (raw)</h3>
          <a href="/admin/users" className="px-3 py-2 bg-blue-600 text-white rounded">Administrar Usuarios</a>
          <pre className="mt-2 bg-gray-100 p-3 rounded">{summary ? JSON.stringify(summary, null, 2) : 'No data'}</pre>
        </div>
        <div className="mt-6">
          <AdminTasks />
        </div>
      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="p-4 bg-gray-50 rounded shadow-sm">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
