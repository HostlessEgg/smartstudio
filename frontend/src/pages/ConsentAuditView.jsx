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
    <div className="page">
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 className="section-title">Historial de consentimientos</h2>
            <p className="section-subtitle">Accesos y cambios de consentimientos registrados.</p>
          </div>
          <span className="pill">Admin</span>
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <input className="input" placeholder="Buscar representante o estudiante" value={q} onChange={e=>setQ(e.target.value)} style={{ maxWidth: 320 }} />
          <input type="date" className="input" value={from} onChange={e=>setFrom(e.target.value)} style={{ maxWidth: 180 }} />
          <input type="date" className="input" value={to} onChange={e=>setTo(e.target.value)} style={{ maxWidth: 180 }} />
          <Button onClick={exportCsv}>Exportar CSV</Button>
        </div>

        <div className="table-container" style={{ marginTop: 16 }}>
          <table className="table">
            <thead>
              <tr><th>ID</th><th>Representante</th><th>Estudiante</th><th>Acción</th><th>Fecha</th><th>Nota</th></tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>{c.representative} <div className="muted" style={{ fontSize: 12 }}>{c.representative_email}</div></td>
                  <td>{c.student} <div className="muted" style={{ fontSize: 12 }}>{c.student_email}</div></td>
                  <td>{c.action}</td>
                  <td>{new Date(c.timestamp || c.at).toLocaleString()}</td>
                  <td>{c.note}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="muted">No hay registros para mostrar.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
