import React, { useEffect, useState } from 'react';
import Button from '../components/ui/Button';
import Spinner from '../components/Spinner';
import api from '../lib/api';

export default function MySubmissionsPage(){
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/my/submissions');
      setSubs(res.data || []);
    } catch (e) {
      // toast via interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{ load(); },[]);

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Mis Entregas</h2>
      {loading ? <Spinner /> : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left"><th className="p-2">ID</th><th className="p-2">Asignación</th><th className="p-2">Estado</th><th className="p-2">Fecha</th><th className="p-2">Acciones</th></tr>
          </thead>
          <tbody>
            {subs.map(s => (
              <tr key={s.id} className="border-t">
                <td className="p-2">{s.id}</td>
                <td className="p-2">{s.assignment_title || s.assignment_id}</td>
                <td className="p-2">{s.score ? `Calificada (${s.score})` : 'Enviada'}{s.feedback ? ` — ${s.feedback}` : ''}</td>
                <td className="p-2">{s.created_at ? new Date(s.created_at).toLocaleString() : ''}</td>
                <td className="p-2">
                  <Button onClick={()=>alert(`Texto: ${s.text_submission || ''}\nArchivo: ${s.file_url || '—'}`)}>Ver entrega</Button>
                </td>
              </tr>
            ))}
            {subs.length === 0 && <tr><td className="p-2 text-sm text-gray-600" colSpan={5}>Sin entregas aún.</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );
}
