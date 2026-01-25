import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import Spinner from '../components/Spinner';

export default function AdminAudits() {
  const [audits, setAudits] = useState([]);
  const [meta, setMeta] = useState({ page: 1, per_page: 50, total: 0, total_pages: 1 });
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');

  const fetch = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/admin/audits', { params: { page, per_page: meta.per_page, q } });
      setAudits(res.data.data || []);
      setMeta(res.data.meta || meta);
    } catch (e) {
      // toast via interceptor
    } finally { setLoading(false); }
  };

  useEffect(() => { fetch(1); }, []);

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Audit Log</h2>
      <div className="mb-3 flex gap-2">
        <input className="border p-2 flex-1" placeholder="Buscar acción/entidad/ip" value={q} onChange={e=>setQ(e.target.value)} />
        <button onClick={()=>fetch(1)} className="px-3 py-2 bg-blue-600 text-white rounded">Buscar</button>
      </div>

      {loading ? <Spinner message="Cargando auditoría..." /> : (
        <div className="bg-white rounded shadow">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">Id</th>
                <th className="p-2">Usuario</th>
                <th className="p-2">Acción</th>
                <th className="p-2">Entidad</th>
                <th className="p-2">Detalles</th>
                <th className="p-2">IP</th>
                <th className="p-2">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {audits.map(a => (
                <tr key={a.id} className="border-t">
                  <td className="p-2">{a.id}</td>
                  <td className="p-2">{a.user_id}</td>
                  <td className="p-2">{a.action}</td>
                  <td className="p-2">{a.entity} {a.entity_id ? `#${a.entity_id}` : ''}</td>
                  <td className="p-2"><pre className="whitespace-pre-wrap text-xs">{a.details}</pre></td>
                  <td className="p-2">{a.ip}</td>
                  <td className="p-2">{new Date(a.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <button onClick={()=>fetch(Math.max(1, meta.page-1))} className="px-2 bg-gray-200">Anterior</button>
        <div>Page {meta.page} / {meta.total_pages}</div>
        <button onClick={()=>fetch(Math.min(meta.total_pages, meta.page+1))} className="px-2 bg-gray-200">Siguiente</button>
      </div>
    </div>
  );
}
