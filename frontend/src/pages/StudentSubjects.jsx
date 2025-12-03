import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchSubjects } from '../api/subjects';

export default function StudentSubjects(){
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const data = await fetchSubjects();
      if (!mounted) return;
      // If student has a grade, filter subjects for that grade
      const mine = user?.grade ? data.filter(s => s.grade === user.grade) : [];
      setSubjects(mine);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [user]);

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Mis Materias (Estudiante)</h2>
      {loading ? (
        <div>Cargando materias...</div>
      ) : (
        <div className="grid gap-3">
          {subjects.length === 0 ? (
            <div className="text-sm text-gray-600">No estás inscrito en materias (o tu grado no está definido).</div>
          ) : (
            subjects.map(s => (
              <div key={s.id} className="p-3 border rounded bg-white flex justify-between items-center">
                <div>
                  <div className="font-medium">{s.name} <span className="text-sm text-gray-500">({s.code})</span></div>
                  <div className="text-sm text-gray-600">Secciones: {s.sections ?? '—'}</div>
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-secondary">Ver materia</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
