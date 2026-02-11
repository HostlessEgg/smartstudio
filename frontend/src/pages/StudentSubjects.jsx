import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchSubjects } from '../api/subjects';
import Button from '../components/ui/Button';

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
    <div className="page">
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 className="section-title">Mis materias</h2>
            <p className="section-subtitle">Consulta tus materias y secciones asignadas.</p>
          </div>
          <span className="pill">Estudiante</span>
        </div>

        <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
          {loading && <div className="muted">Cargando materias...</div>}
          {!loading && subjects.length === 0 && (
            <div className="muted">No estás inscrito en materias (o tu grado no está definido).</div>
          )}
          {!loading && subjects.map(s => (
            <div key={s.id} className="card" style={{ padding: 16, border: '1px solid var(--border)', boxShadow: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{s.name} <span className="muted" style={{ fontSize: 12 }}>({s.code})</span></div>
                  <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>Secciones: {s.sections ?? '—'}</div>
                </div>
                <Button variant="secondary">Ver materia</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
