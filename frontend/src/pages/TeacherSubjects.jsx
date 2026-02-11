import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchSubjects } from '../api/subjects';
import Button from '../components/ui/Button';

export default function TeacherSubjects(){
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const data = await fetchSubjects();
      if (!mounted) return;
      // filter subjects where this teacher is assigned (match by name or teacher:id)
      const me = user?.name ? data.filter(s => (s.teachers || []).some(t => t === user.name || t === `teacher:${user.id}`)) : [];
      setSubjects(me);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [user]);

  return (
    <div className="page">
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 className="section-title">Mis Materias</h2>
            <p className="section-subtitle">Materias asignadas y accesos rápidos.</p>
          </div>
          <span className="pill">Profesor</span>
        </div>

        {loading ? (
          <div className="muted" style={{ marginTop: 16 }}>Cargando materias...</div>
        ) : (
          <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
            {subjects.length === 0 ? (
              <div className="muted">No tienes materias asignadas.</div>
            ) : (
              subjects.map(s => (
                <div key={s.id} className="card" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{s.name} <span className="pill" style={{ marginLeft: 8 }}>{s.code}</span></div>
                    <div className="muted" style={{ marginTop: 6 }}>Secciones: {s.sections ?? '—'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Button variant="ghost">Ver detalle</Button>
                    <Button icon="＋">Crear tarea</Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
