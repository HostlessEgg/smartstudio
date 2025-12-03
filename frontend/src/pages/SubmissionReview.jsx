import React from 'react';

import Button from '../components/ui/Button';

export default function SubmissionReview({ submission }){
  // For demo we'll accept a prop or mock
  const s = submission || { id: 1, student: 'María García', title: 'Tarea 1', fileUrl: null, comments: 'Buen trabajo' };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Revisión de Entrega</h2>
      <div className="p-3 border rounded">
        <div className="font-medium">{s.title}</div>
        <div className="text-sm text-gray-600">Estudiante: {s.student}</div>
        <div className="mt-3">Archivo: {s.fileUrl ? (<a href={s.fileUrl}>Descargar</a>) : 'No disponible (mock)'}</div>
        <div className="mt-3">Comentarios: {s.comments}</div>
        <div className="mt-4">
          <label className="block mb-2">Calificación (0-100)</label>
          <input aria-label="Calificación" type="number" min="0" max="100" className="border p-2" defaultValue={90} />
          <div className="mt-2">
            <Button className="mr-2 bg-blue-600 text-white" onClick={() => alert('Mock: guardar calificación')}>Guardar</Button>
            <Button onClick={() => alert('Mock: enviar feedback')}>Enviar feedback</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
