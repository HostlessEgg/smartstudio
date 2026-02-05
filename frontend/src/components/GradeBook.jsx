import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Toast from './Toast';

export default function GradeBook({ assignmentId: initialAssignmentId = '' }) {
  const [assignmentId, setAssignmentId] = useState(initialAssignmentId);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [grading, setGrading] = useState({});
  const [toast, setToast] = useState(null);

  const fetchSubmissions = async () => {
    if (!assignmentId) return setToast({ message: 'Indique un ID de asignación', type: 'error' });
    setLoading(true); setToast(null);
    try {
      const res = await axios.get(`/api/assignments/${assignmentId}/submissions`);
      setSubmissions(res.data.submissions || res.data || []);
    } catch (err) {
      console.error(err);
      setToast({ message: err.response?.data?.error || 'Error al obtener entregas', type: 'error' });
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (initialAssignmentId) {
      setAssignmentId(initialAssignmentId);
      // fetch on mount if provided
      (async () => { await fetchSubmissions(); })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGrade = async (submissionId) => {
    const gradeVal = grading[submissionId];
    if (gradeVal === undefined || gradeVal === null || gradeVal === '') return;
    try {
      // backend expects { score, feedback }
      await axios.post(`/api/submissions/${submissionId}/grade`, { score: Number(gradeVal) });
      setToast({ message: 'Calificación guardada', type: 'success' });
      // refresh
      await fetchSubmissions();
    } catch (err) {
      console.error(err);
      setToast({ message: err.response?.data?.error || 'Error al guardar la calificación', type: 'error' });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h4 className="font-semibold mb-2">Libro de calificaciones</h4>
      <div className="mb-2 flex gap-2">
        <input value={assignmentId} onChange={e => setAssignmentId(e.target.value)} className="border p-2" placeholder="ID de la asignación" />
        <button onClick={fetchSubmissions} className="bg-blue-600 text-white px-3 py-1 rounded">Cargar entregas</button>
      </div>
      {loading ? (
        <div>Cargando entregas...</div>
      ) : (
        <div className="space-y-3">
          {submissions.length === 0 && <div className="text-gray-600">No se encontraron entregas</div>}
          {submissions.map(s => (
            <div key={s.id} className="border p-2 rounded">
              <div className="flex justify-between">
                <div>
                  <div className="font-semibold">Alumno ID: {s.student_id ?? s.user_id}</div>
                  <div className="text-sm text-gray-600">Enviado: {new Date(s.created_at || s.submitted_at).toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div>Calificación: {s.score ?? 'Sin calificar'}</div>
                </div>
              </div>
              <div className="mt-2">
                <div className="text-sm">Texto: {s.text_submission || <em className="text-gray-500">(vacío)</em>}</div>
                <div className="text-sm">Archivo: {s.file_url ? (<a href={s.file_url} target="_blank" rel="noreferrer">ver</a>) : <em className="text-gray-500">(no hay)</em>}</div>
              </div>
              <div className="mt-2 flex gap-2 items-center">
                <input type="number" step="0.1" min="0" value={grading[s.id] ?? (s.grade ?? '')} onChange={e => setGrading(g => ({ ...g, [s.id]: e.target.value }))} className="border p-1 w-24" />
                <button onClick={() => handleGrade(s.id)} className="bg-green-600 text-white px-3 py-1 rounded">Guardar calificación</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
}
