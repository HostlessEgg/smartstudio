import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import Toast from '../components/Toast';
import ProgressModal from '../components/ProgressModal';
import ConsentModal from '../components/ConsentModal';
import ConfirmModal from '../components/ConfirmModal';

export default function RepresentativeDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [representativeId, setRepresentativeId] = useState(null);
  const [representativeStudents, setRepresentativeStudents] = useState([]);
  const [requestStudentId, setRequestStudentId] = useState('');
  const [received, setReceived] = useState([]);
  const [studentProgress, setStudentProgress] = useState({});
  const [progressModal, setProgressModal] = useState({ open: false, studentId: null });
  const [consentModal, setConsentModal] = useState({ open: false, repId: null });
  const [confirmModal, setConfirmModal] = useState({ open: false, message: '', onConfirm: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        if (user.role === 'student') {
          const res = await api.get('/representatives/received');
          setReceived(res.data.requests || []);
        } else {
          try {
            const res = await api.get('/representatives/requests');
            setRequests(res.data.requests || []);
            setRepresentativeId(res.data.representativeId || null);
          } catch (err) {
            if (err.response?.status === 403) {
              setRequests([]);
              setRepresentativeId(null);
            } else {
              throw err;
            }
          }

          try {
            const res = await api.get('/representatives/students');
            setRepresentativeStudents(res.data.students || []);
          } catch (err) {
            if (err.response?.status === 403) {
              setRepresentativeStudents([]);
            } else {
              throw err;
            }
          }
        }
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleGrant = async (repId) => {
    // open modal to ask for optional expiresAt
    setConsentModal({ open: true, repId });
  };

  const onConfirmConsent = async ({ studentId: sId, expiresAt }) => {
    try {
      const repId = consentModal.repId;
      await api.post('/representatives/consent', { studentId: sId || user.id, representativeId: repId, action: 'grant', expiresAt: expiresAt || null });
      const res = await api.get('/representatives/received');
      setReceived(res.data.requests || []);
      setToast({ message: 'Consentimiento otorgado.', type: 'success' });
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setToast({ message: err.response?.data?.error || err.message, type: 'error' });
    } finally {
      setConsentModal({ open: false, repId: null });
    }
  };

  const handleRevoke = async (repId) => {
    // show confirmation modal instead of blocking confirm
    setConfirmModal({
      open: true,
      message: '¿Estás seguro de revocar el consentimiento?',
      onConfirm: async () => {
        try {
          await api.post('/representatives/consent', { studentId: user.id, representativeId: repId, action: 'revoke' });
          const res = await api.get('/representatives/received');
          setReceived(res.data.requests || []);
          setToast({ message: 'Consentimiento revocado.', type: 'success' });
        } catch (err) {
          setError(err.response?.data?.error || err.message);
          setToast({ message: err.response?.data?.error || err.message, type: 'error' });
        } finally {
          setConfirmModal({ open: false, message: '', onConfirm: null });
        }
      }
    });
  };

  const handleCancel = async (repId) => {
    setConfirmModal({
      open: true,
      message: '¿Cancelar esta solicitud? Esta acción no se puede deshacer.',
      onConfirm: async () => {
        try {
          const idToCancel = repId || representativeId;
          if (!idToCancel) throw new Error('Representative id desconocido');
          await api.delete(`/representatives/${idToCancel}/cancel`);
          const res = await api.get('/representatives/requests');
          setRequests(res.data.requests || []);
          setRepresentativeId(res.data.representativeId || null);
          const studentsRes = await api.get('/representatives/students');
          setRepresentativeStudents(studentsRes.data.students || []);
          setToast({ message: 'Solicitud cancelada.', type: 'success' });
        } catch (err) {
          setError(err.response?.data?.error || err.message);
          setToast({ message: err.response?.data?.error || err.message, type: 'error' });
        } finally {
          setConfirmModal({ open: false, message: '', onConfirm: null });
        }
      }
    });
  };

  const viewProgress = async (studentId) => {
    try {
      setLoading(true);
      const res = await api.get(`/representatives/students/${studentId}/progress`);
      setStudentProgress((prev) => ({ ...prev, [studentId]: res.data.progress || res.data }));
      setProgressModal({ open: true, studentId });
      const handleCreateRequest = async (event) => {
        event.preventDefault();
        const studentId = Number(requestStudentId);
        if (!studentId) {
          setToast({ message: 'Ingresa un ID de estudiante válido.', type: 'error' });
          return;
        }
        try {
          setLoading(true);
          await api.post('/representatives', { studentId });
          const res = await api.get('/representatives/requests');
          setRequests(res.data.requests || []);
          setRepresentativeId(res.data.representativeId || null);
          const studentsRes = await api.get('/representatives/students');
          setRepresentativeStudents(studentsRes.data.students || []);
          setRequestStudentId('');
          setToast({ message: 'Solicitud enviada.', type: 'success' });
        } catch (err) {
          setToast({ message: err.response?.data?.error || err.message, type: 'error' });
        } finally {
          setLoading(false);
        }
      };
    } catch (err) {
      setToast({ message: err.response?.data?.error || err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Representantes</h2>
      {loading && <div>Cargando...</div>}
      {error && <div className="text-red-600">{error}</div>}

      {user && user.role === 'student' && (
        <section>
          <h3 className="font-medium">Solicitudes recibidas</h3>
          {received.length === 0 && <p>No hay solicitudes.</p>}
          <ul>
            {received.map((r) => (
              <li key={r.id} className="p-2 border-b flex justify-between items-center">
                <div>
                  <div>Representante: {r.representative_name || 'Sin nombre'}</div>
                  <div className="text-sm text-gray-600">Email: {r.representative_email || 'N/A'}</div>
                  <div className="text-sm text-gray-600">ID representante: {r.representative_id}</div>
                  <div>Requested at: {new Date(r.requested_at).toLocaleString()}</div>
                  <div>Active: {r.active ? 'Sí' : 'No'}</div>
                </div>
                <div className="flex gap-2">
                  {!r.active ? (
                    <button onClick={() => handleGrant(r.representative_id)} className="btn btn-primary">Conceder</button>
                  ) : (
                    <button onClick={() => handleRevoke(r.representative_id)} className="btn btn-secondary">Revocar</button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {user && user.role !== 'student' && (
        <section>
          <h3 className="font-medium">Solicitar acceso como representante</h3>
          <form onSubmit={handleCreateRequest} className="flex flex-wrap gap-2 items-end mb-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">ID de estudiante</span>
              <input
                value={requestStudentId}
                onChange={(e) => setRequestStudentId(e.target.value)}
                className="border rounded px-3 py-2"
                placeholder="Ej: 123"
              />
            </label>
            <button type="submit" className="btn btn-primary">Enviar solicitud</button>
            {representativeId && (
              <button type="button" onClick={() => handleCancel(representativeId)} className="btn btn-secondary">Cancelar pendientes</button>
            )}
          </form>

          <h4 className="font-medium">Solicitudes realizadas</h4>
          {requests.length === 0 && <p>No has realizado solicitudes.</p>}
          <ul className="mb-6">
            {requests.map((r) => (
              <li key={r.id} className="p-2 border-b flex justify-between items-center">
                <div>
                  <div><strong>{r.student_name || ('Estudiante ' + r.student_id)}</strong></div>
                  <div className="text-sm text-gray-600">Email: {r.student_email || 'N/A'}</div>
                  <div className="text-sm text-gray-600">ID: {r.student_id}</div>
                  <div className="text-sm">Estado: {r.active ? 'Activo' : 'Pendiente'}</div>
                </div>
              </li>
            ))}
          </ul>

          <h4 className="font-medium">Representados con consentimiento activo</h4>
          {representativeStudents.length === 0 && <p>No tienes consentimientos activos.</p>}
          <ul>
            {representativeStudents.map((r) => (
              <li key={r.student_id} className="p-2 border-b flex justify-between items-center">
                <div>
                  <div><strong>{r.name || ('Estudiante ' + r.student_id)}</strong></div>
                  <div className="text-sm text-gray-600">Email: {r.email || 'N/A'}</div>
                  <div className="text-sm text-gray-600">ID: {r.student_id}</div>
                </div>
                <div>
                  <button onClick={() => viewProgress(r.student_id)} className="btn btn-secondary">Ver progreso</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      <ProgressModal
        open={progressModal.open}
        onClose={() => setProgressModal({ open: false, studentId: null })}
        studentId={progressModal.studentId}
        progress={studentProgress[progressModal.studentId]}
      />
      <ConsentModal
        open={consentModal.open}
        onClose={() => setConsentModal({ open: false, repId: null })}
        onConfirm={(data)=>onConfirmConsent({ ...data, studentId: user?.id })}
        studentId={user?.id}
      />
      <ConfirmModal
        open={confirmModal.open}
        message={confirmModal.message}
        onClose={() => setConfirmModal({ open: false, message: '', onConfirm: null })}
        onConfirm={() => { confirmModal.onConfirm && confirmModal.onConfirm(); }}
        confirmLabel={'Confirmar'}
        cancelLabel={'Cancelar'}
      />
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
    </div>
  );
}

// Render toast at module root so it shows on this page
