import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
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
        const res = await axios.get('/api/assignments');
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

  if (loading) return <div className="p-4">Cargando asignación...</div>;
  if (!assignment) return <div className="p-4">Asignación no encontrada</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-2">{assignment.title}</h2>
      <div className="text-sm text-gray-600 mb-4">{assignment.start_at} {assignment.end_at ? `- ${assignment.end_at}` : ''}</div>
      <div className="mb-6">{assignment.description}</div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {user && user.role === 'student' && (
          <SubmissionBox assignmentId={String(assignment.id)} />
        )}

        {user && (user.role === 'teacher' || user.role === 'admin') && (
          <GradeBook assignmentId={String(assignment.id)} />
        )}
      </div>
    </div>
  );
}
