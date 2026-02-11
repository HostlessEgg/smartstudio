import React, { useState } from 'react';
import cohortsSeed from '../../mock-data/cohorts.json';
import Button from '../components/ui/Button';
import { useToast } from '../contexts/ToastContext';

export default function CohortManagement() {
  const [cohorts, setCohorts] = useState(cohortsSeed || []);
  const [newName, setNewName] = useState('');
  const { addToast } = useToast();

  const createCohort = () => {
    const name = String(newName || '').trim();
    if (!name) return;
    const next = [{ id: `c-${Date.now()}`, name, course_id: null, start_date: null, end_date: null }, ...cohorts];
    setCohorts(next);
    setNewName('');
    addToast('Cohorte creada', { type: 'success' });
  };

  return (
    <div className="page">
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 className="section-title">Cohortes</h2>
            <p className="section-subtitle">Agrupa estudiantes por periodo o curso.</p>
          </div>
          <Button onClick={createCohort} icon="＋">Crear cohorte</Button>
        </div>

        <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            className="input"
            placeholder="Nombre de la cohorte"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            style={{ maxWidth: 320 }}
          />
          <Button variant="secondary" onClick={createCohort}>Agregar</Button>
        </div>

        <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
          {cohorts.map(c => (
            <div key={c.id} className="card" style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 600 }}>{c.name}</div>
                <div className="muted" style={{ fontSize: 12 }}>Curso: {c.course_id || '—'}</div>
              </div>
              <div>
                <Button variant="secondary" className="text-sm">Editar</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
