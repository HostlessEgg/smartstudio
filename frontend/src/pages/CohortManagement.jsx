import React, { useState } from 'react';
import cohortsSeed from '../../mock-data/cohorts.json';

export default function CohortManagement() {
  const [cohorts, setCohorts] = useState(cohortsSeed || []);

  const createCohort = () => {
    const name = prompt('Nombre de la cohorte:');
    if (!name) return;
    const next = [{ id: `c-${Date.now()}`, name, course_id: null, start_date: null, end_date: null }, ...cohorts];
    setCohorts(next);
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Cohortes</h2>
      <div className="mb-4">
        <button onClick={createCohort} className="px-3 py-2 bg-green-600 text-white rounded">Crear Cohorte</button>
      </div>
      <div className="space-y-3">
        {cohorts.map(c => (
          <div key={c.id} className="p-3 border rounded flex justify-between items-center">
            <div>
              <div className="font-semibold">{c.name}</div>
              <div className="text-sm text-gray-600">Curso: {c.course_id || '—'}</div>
            </div>
            <div>
              <button className="px-2 py-1 bg-blue-500 text-white rounded">Editar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
