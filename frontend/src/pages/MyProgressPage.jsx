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

  if (!progress) return <div className="container mx-auto p-4">Cargando progreso...</div>;

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Mi Progreso</h2>
      <div className="space-y-3">
        {progress.map((p, i) => (
          <div key={i} className="p-3 border rounded">
            <div className="font-medium">{p.course}</div>
            <div className="text-sm text-gray-600">{p.completed} / {p.total} lecciones completadas</div>
            <div className="w-full bg-gray-200 h-2 mt-2">
              <div style={{ width: `${Math.round((p.completed/p.total)*100)}%` }} className="bg-green-500 h-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
