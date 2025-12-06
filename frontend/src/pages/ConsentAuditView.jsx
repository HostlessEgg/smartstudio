import React, { useEffect, useState } from 'react';
import mockApi from '../lib/mockApi';
import Button from '../components/ui/Button';

export default function ConsentAuditView(){
  const [logs, setLogs] = useState([]);
  const [q, setQ] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(()=>{
    let mounted = true;
    mockApi.getConsentsAudit().then(r=>{
      if (!mounted) return;
      if (!r) return;
      // r may be { consents: [...] } or an array
      setLogs(Array.isArray(r.consents) ? r.consents : (Array.isArray(r) ? r : r.consents || []));
    });
    return ()=> mounted = false;
  },[]);

  const filtered = logs.filter(c => {
    const matchQ = q ? (c.representative?.toLowerCase().includes(q.toLowerCase()) || c.student?.toLowerCase().includes(q.toLowerCase()) || c.representative_email?.toLowerCase().includes(q.toLowerCase())) : true;
    const ts = new Date(c.timestamp || c.at).getTime();
    const okFrom = from ? ts >= new Date(from).getTime() : true;
    const okTo = to ? ts <= new Date(to).getTime() : true;
    return matchQ && okFrom && okTo;
  });

  const exportCsv = () => {
    const rows = [['id','representative','representative_email','student','student_email','action','timestamp','duration_days','note']];
    for (const c of filtered) rows.push([c.id,c.representative,c.representative_email,c.student,c.student_email,c.action,c.timestamp || c.at,c.duration_days,c.note]);
    const csv = rows.map(r=>r.map(v=>`"${String(v||'') .replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'consents_audit.csv'; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Historial de Consentimientos / Accesos</h2>
      <p className="mb-4 text-sm text-gray-600">Esta vista muestra accesos y cambios de consentimientos (mock data).</p>
      <div className="mb-3 flex gap-2">
        <input className="border p-2" placeholder="Buscar representante o estudiante" value={q} onChange={e=>setQ(e.target.value)} />
        <input type="date" className="border p-2" value={from} onChange={e=>setFrom(e.target.value)} />
        <input type="date" className="border p-2" value={to} onChange={e=>setTo(e.target.value)} />
        <Button onClick={exportCsv} className="ml-auto">Exportar CSV</Button>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="text-left"><th className="p-2">ID</th><th className="p-2">Rep</th><th className="p-2">Estudiante</th><th className="p-2">Acción</th><th className="p-2">Fecha</th><th className="p-2">Nota</th></tr>
        </thead>
        <tbody>
          {filtered.map(c => (
            <tr key={c.id} className="border-t">
              <td className="p-2">{c.id}</td>
              <td className="p-2">{c.representative} <div className="text-sm text-gray-600">{c.representative_email}</div></td>
              <td className="p-2">{c.student} <div className="text-sm text-gray-600">{c.student_email}</div></td>
              <td className="p-2">{c.action}</td>
              <td className="p-2">{new Date(c.timestamp || c.at).toLocaleString()}</td>
              <td className="p-2">{c.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
