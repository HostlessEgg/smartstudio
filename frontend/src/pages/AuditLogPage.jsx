import React, { useState, useEffect } from 'react';
import mockApi from '../lib/mockApi';

export default function AuditLogPage(){
  const [logs, setLogs] = useState([]);
  const [q, setQ] = useState('');

  useEffect(()=>{
    let mounted = true;
    mockApi.getAudit().then(a=>{ if (mounted && a) setLogs(a); });
    return ()=>{ mounted=false };
  },[]);

  const filtered = logs.filter(l => (l.user || '').toLowerCase().includes(q.toLowerCase()) || (l.action || '').toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Visor de Auditoría - Mock</h2>
      <div className="mb-4">
        <input aria-label="Buscar auditoría" className="border p-2 w-1/3" placeholder="Buscar usuario o acción" value={q} onChange={e=>setQ(e.target.value)} />
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="text-left">
            <th className="p-2">Fecha</th>
            <th className="p-2">Usuario</th>
            <th className="p-2">Acción</th>
            <th className="p-2">Entidad</th>
            <th className="p-2">ID</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((l, idx) => (
            <tr key={idx} className="border-t">
              <td className="p-2">{new Date(l.created_at || l.at || Date.now()).toLocaleString()}</td>
              <td className="p-2">{l.user || l.user_id || 'N/A'}</td>
              <td className="p-2">{l.action}</td>
              <td className="p-2">{l.entity}</td>
              <td className="p-2">{l.entity_id}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
