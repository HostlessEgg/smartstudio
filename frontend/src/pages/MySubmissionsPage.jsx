import React, { useEffect, useState } from 'react';
import mockApi from '../lib/mockApi';
import Button from '../components/ui/Button';

export default function MySubmissionsPage(){
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{
    setLoading(true);
    mockApi.getSubmissions().then(r => { if (r) setSubs(r); }).finally(()=>setLoading(false));
  },[]);

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Mis Entregas</h2>
      {loading && <div>Cargando...</div>}
      <table className="w-full border-collapse">
        <thead>
          <tr className="text-left"><th className="p-2">ID</th><th className="p-2">Asignación</th><th className="p-2">Estado</th><th className="p-2">Fecha</th><th className="p-2">Acciones</th></tr>
        </thead>
        <tbody>
          {subs.map(s => (
            <tr key={s.id} className="border-t">
              <td className="p-2">{s.id}</td>
              <td className="p-2">{s.assignmentId}</td>
              <td className="p-2">{s.status}{s.grade ? ` — ${s.grade}` : ''}</td>
              <td className="p-2">{new Date(s.submittedAt).toLocaleString()}</td>
              <td className="p-2">
                <Button onClick={()=>alert('Preview mock: ' + (s.files || []).join(', '))}>Ver archivos</Button>
                <Button className="ml-2" onClick={()=>alert('Solicitar revisión (mock)')}>Solicitar revisión</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
