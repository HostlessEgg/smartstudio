import React from 'react';

import Button from '../components/ui/Button';
import { useToast } from '../contexts/ToastContext';

export default function SubmissionReview({ submission }){
  // For demo we'll accept a prop or mock
  const s = submission || { id: 1, student: 'María García', title: 'Tarea 1', fileUrl: null, comments: 'Buen trabajo' };
  const { addToast } = useToast();

  return (
    <div className="page">
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 className="section-title">Revisión de Entrega</h2>
            <p className="section-subtitle">Evalúa y deja feedback.</p>
          </div>
          <span className="pill">Profesor</span>
        </div>

        <div className="card" style={{ padding: 16, marginTop: 16 }}>
          <div style={{ fontWeight: 600 }}>{s.title}</div>
          <div className="muted" style={{ marginTop: 6 }}>Estudiante: {s.student}</div>
          <div style={{ marginTop: 10 }}>Archivo: {s.fileUrl ? (<a href={s.fileUrl}>Descargar</a>) : 'No disponible'}</div>
          <div style={{ marginTop: 10 }}>Comentarios: {s.comments}</div>
          <div style={{ marginTop: 14 }}>
            <label className="label">Calificación (0-100)</label>
            <input aria-label="Calificación" type="number" min="0" max="100" className="input" defaultValue={90} />
            <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Button onClick={() => addToast('Calificación guardada', { type: 'success' })} icon="✔">Guardar</Button>
              <Button variant="secondary" onClick={() => addToast('Feedback enviado', { type: 'success' })} icon="✉">Enviar feedback</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
