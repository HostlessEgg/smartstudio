import React, { useEffect, useState } from 'react';
import mockApi from '../lib/mockApi';

export default function MyProgressPage(){
  const [progress, setProgress] = useState(null);

  useEffect(()=>{
    let mounted = true;
    // attempt to get progress via mock API (not implemented server-side) — fallback to local mock
    mockApi.getSettings().then(r => {
      if (!mounted) return;
      if (!r) {
        setProgress([
          { course: 'Introducción a la Programación', completed: 6, total: 10 },
          { course: 'Matemáticas Avanzadas', completed: 2, total: 12 }
        ]);
      } else {
        // example: settings might contain progress in demo
        setProgress(r.progress || []);
      }
    });
    return ()=>{ mounted=false };
  },[]);

  if (!progress) return <div className="page"><div className="card" style={{ padding: 24 }}><div className="muted">Cargando progreso...</div></div></div>;

  return (
    <div className="page">
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 className="section-title">Mi progreso</h2>
            <p className="section-subtitle">Consulta el avance por curso.</p>
          </div>
          <span className="pill">Estudiante</span>
        </div>

        <div style={{ marginTop: 16 }}>
          {progress.map((p, i) => {
            const percent = p.total ? Math.round((p.completed / p.total) * 100) : 0;
            return (
              <div key={i} className="progress-item">
                <div className="progress-info">
                  <span style={{ fontWeight: 600 }}>{p.course}</span>
                  <span className="muted">{p.completed} / {p.total} lecciones</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
