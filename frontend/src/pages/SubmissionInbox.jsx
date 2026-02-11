import React, { useState, useEffect } from 'react';
import Button from '../components/ui/Button';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

export default function SubmissionInbox(){
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [subs, setSubs] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [error, setError] = useState('');

  useEffect(()=>{
    let mounted = true;
    const fetchAssignments = async () => {
      if (!user) return;
      setLoadingAssignments(true);
      setError('');
      try {
        const res = await api.get('/assignments', { params: { created_by: user.id } });
        if (!mounted) return;
        const rows = res.data || [];
        setAssignments(rows);
        if (rows.length > 0) {
          setSelectedAssignment(rows[0]);
        }
      } catch (e) {
        if (mounted) setError('No se pudieron cargar las actividades');
      } finally {
        if (mounted) setLoadingAssignments(false);
      }
    };

    fetchAssignments();
    return ()=>{ mounted=false };
  },[user]);

  useEffect(() => {
    let mounted = true;
    const fetchSubmissions = async () => {
      if (!selectedAssignment) { setSubs([]); return; }
      setLoadingSubs(true);
      setError('');
      try {
        const res = await api.get(`/assignments/${selectedAssignment.id}/submissions`);
        if (!mounted) return;
        const rows = res.data || [];
        const mapped = rows.map(r => ({
          id: r.id,
          student: r.student_name || r.student_email || `#${r.student_id}`,
          title: selectedAssignment.title,
          submitted_at: r.created_at,
          status: r.score !== null && r.score !== undefined ? 'graded' : 'pending',
          score: r.score,
          feedback: r.feedback
        }));
        setSubs(mapped);
      } catch (e) {
        if (mounted) setError('No se pudieron cargar las entregas');
      } finally {
        if (mounted) setLoadingSubs(false);
      }
    };

    fetchSubmissions();
    return () => { mounted = false; };
  }, [selectedAssignment]);

  const openReview = (s) => {
    window.location.href = `/teacher/submissions/${s.id}`;
  };

  return (
    <div className="page">
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 className="section-title">Bandeja de Entregas</h2>
            <p className="section-subtitle">Revisión por actividad y estado de entregas.</p>
          </div>
          <span className="pill">Profesor</span>
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <label className="label" style={{ minWidth: 220 }}>Actividad
            <select className="input" value={selectedAssignment?.id || ''} onChange={e => {
              const next = assignments.find(a => String(a.id) === e.target.value);
              setSelectedAssignment(next || null);
            }}>
              {assignments.map(a => (
                <option key={a.id} value={a.id}>{a.title}</option>
              ))}
            </select>
          </label>
          {loadingAssignments && <Spinner size={16} message="" />}
        </div>

        {error && <div className="muted" style={{ marginTop: 8 }}>{error}</div>}

        {loadingAssignments ? (
          <div style={{ marginTop: 16 }}><Spinner message="Cargando actividades..." /></div>
        ) : assignments.length === 0 ? (
          <div style={{ marginTop: 16 }}><EmptyState title="Sin actividades" description="Aún no tienes actividades asignadas." /></div>
        ) : (
          <div className="card" style={{ marginTop: 12, padding: 12 }}>
            <div className="muted" style={{ fontSize: 12 }}>Actividad seleccionada: <strong>{selectedAssignment?.title}</strong></div>
            <div className="muted" style={{ fontSize: 12 }}>Entregas: {subs.length}</div>
          </div>
        )}

        <div className="table-container" style={{ marginTop: 16 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Título</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Puntaje</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {subs.map(s => (
                <tr key={s.id}>
                  <td>{s.student}</td>
                  <td style={{ fontWeight: 600 }}>{s.title}</td>
                  <td className="muted">{new Date(s.submitted_at).toLocaleString()}</td>
                  <td>
                    <span className={`badge ${s.status === 'graded' ? 'badge-success' : 'badge-warning'}`}>{s.status === 'graded' ? 'Calificada' : 'Pendiente'}</span>
                  </td>
                  <td>{s.score ?? '—'}</td>
                  <td>
                    <Button variant="secondary" onClick={()=>openReview(s)} ariaLabel={`Revisar entrega ${s.id}`}>Revisar</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loadingSubs && <div style={{ marginTop: 12 }}><Spinner message="Cargando entregas..." /></div>}
          {!loadingSubs && assignments.length > 0 && subs.length === 0 && (
            <div className="muted" style={{ marginTop: 12 }}>No hay entregas para esta actividad.</div>
          )}
        </div>
      </div>
    </div>
  );
}
