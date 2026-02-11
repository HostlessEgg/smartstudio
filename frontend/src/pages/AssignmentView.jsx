import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api';
import SubmissionBox from '../components/SubmissionBox';
import GradeBook from '../components/GradeBook';
import { useAuth } from '../contexts/AuthContext';

export default function AssignmentView() {
  const { id } = useParams();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.get('/assignments');
        const rows = res.data || [];
        const found = rows.find(r => String(r.id) === String(id));
        setAssignment(found || null);
      } catch (err) {
        console.error('Error fetching assignment', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) return <div className="page"><div className="card" style={{ padding: 24 }}>Cargando asignación...</div></div>;
  if (!assignment) return <div className="page"><div className="card" style={{ padding: 24 }}>Asignación no encontrada</div></div>;

  return (
    <div className="page">
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 className="section-title">{assignment.title}</h2>
            <p className="section-subtitle">{assignment.start_at ? new Date(assignment.start_at).toLocaleString() : ''} {assignment.end_at ? `— ${new Date(assignment.end_at).toLocaleString()}` : ''}</p>
          </div>
          <span className="badge badge-primary">Asignación</span>
        </div>

        <div style={{ marginTop: 12 }}>{assignment.description}</div>

        <div className="cards-grid" style={{ marginTop: 16 }}>
        {user && user.role === 'student' && (
          <SubmissionBox assignmentId={String(assignment.id)} />
        )}

        {user && (user.role === 'teacher' || user.role === 'admin') && (
          <GradeBook assignmentId={String(assignment.id)} />
        )}
        </div>
      </div>
    </div>
  );
}
