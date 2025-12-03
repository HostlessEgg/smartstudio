import React, { useState, useEffect } from 'react';
import Button from '../components/ui/Button';
import mockApi from '../lib/mockApi';

const initial = [
  { id: 1, student: 'María García', title: 'Tarea 1', submitted_at: '2025-11-28T10:00:00Z', status: 'pending' },
  { id: 2, student: 'Juan Perez', title: 'Tarea 1', submitted_at: '2025-11-28T11:30:00Z', status: 'graded' }
];

export default function SubmissionInbox(){
  const [subs, setSubs] = useState(initial);

  useEffect(()=>{
    let mounted = true;
    mockApi.getSubmissions().then(r=>{ if (mounted && r) setSubs(r); });
    return ()=>{ mounted=false };
  },[]);

  const openReview = (s) => {
    window.location.href = `/teacher/submissions/${s.id}`;
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Bandeja de Entregas - Mock</h2>
      <table className="w-full border-collapse">
        <thead>
          <tr className="text-left">
            <th className="p-2">Estudiante</th>
            <th className="p-2">Título</th>
            <th className="p-2">Fecha</th>
            <th className="p-2">Estado</th>
            <th className="p-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {subs.map(s => (
            <tr key={s.id} className="border-t">
              <td className="p-2">{s.student}</td>
              <td className="p-2">{s.title}</td>
              <td className="p-2">{new Date(s.submitted_at).toLocaleString()}</td>
              <td className="p-2">{s.status}</td>
              <td className="p-2"><Button className="text-sm text-blue-600" onClick={()=>openReview(s)} ariaLabel={`Revisar entrega ${s.id}`}>Revisar</Button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
