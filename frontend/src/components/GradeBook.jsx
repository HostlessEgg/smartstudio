import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import Toast from './Toast';
import Button from './ui/Button';

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
      const res = await api.get(`/assignments/${assignmentId}/submissions`);
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
      await api.post(`/submissions/${submissionId}/grade`, { score: Number(gradeVal) });
      setToast({ message: 'Calificación guardada', type: 'success' });
      // refresh
      await fetchSubmissions();
    } catch (err) {
      console.error(err);
      setToast({ message: err.response?.data?.error || 'Error al guardar la calificación', type: 'error' });
    }
  };

  return (
    <div className="card" style={{ padding: 16 }}>
      <h4 style={{ fontWeight: 600, marginBottom: 8 }}>Libro de calificaciones</h4>
      <div style={{ marginBottom: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input value={assignmentId} onChange={e => setAssignmentId(e.target.value)} className="input" placeholder="ID de la asignación" style={{ maxWidth: 220 }} />
        <Button onClick={fetchSubmissions}>Cargar entregas</Button>
      </div>
      {loading ? (
        <div className="muted">Cargando entregas...</div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {submissions.length === 0 && <div className="muted">No se encontraron entregas</div>}
          {submissions.map(s => (
            <div key={s.id} className="card" style={{ padding: 12, border: '1px solid var(--border)', boxShadow: 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>Alumno ID: {s.student_id ?? s.user_id}</div>
                  <div className="muted" style={{ fontSize: 12 }}>Enviado: {new Date(s.created_at || s.submitted_at).toLocaleString()}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div>Calificación: {s.score ?? 'Sin calificar'}</div>
                </div>
              </div>
              <div style={{ marginTop: 8, display: 'grid', gap: 4 }}>
                <div className="muted" style={{ fontSize: 12 }}>Texto: {s.text_submission || <em className="muted">(vacío)</em>}</div>
                <div className="muted" style={{ fontSize: 12 }}>Archivo: {s.file_url ? (<a href={s.file_url} target="_blank" rel="noreferrer">ver</a>) : <em className="muted">(no hay)</em>}</div>
              </div>
              <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <input type="number" step="0.1" min="0" value={grading[s.id] ?? (s.grade ?? '')} onChange={e => setGrading(g => ({ ...g, [s.id]: e.target.value }))} className="input" style={{ maxWidth: 120 }} />
                <Button variant="secondary" onClick={() => handleGrade(s.id)}>Guardar calificación</Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
}
