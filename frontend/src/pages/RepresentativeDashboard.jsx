import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import Toast from '../components/Toast';
import ProgressModal from '../components/ProgressModal';
import ConsentModal from '../components/ConsentModal';
import ConfirmModal from '../components/ConfirmModal';

export default function RepresentativeDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [representativeId, setRepresentativeId] = useState(null);
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
          const res = await axios.get('/api/representatives/received');
          setReceived(res.data.requests || []);
        } else if (user.role === 'representative') {
          // representatives can view their representados directly (no consent required)
          // For demo: try to fetch an endpoint, fallback to mock list
          try {
            const res = await axios.get('/api/representatives/students');
            setRequests(res.data.students || []);
          } catch (e) {
            // mock students for UI demo
            setRequests([{ id: 's1', student_id: 101, name: 'Juan Perez' }, { id: 's2', student_id: 102, name: 'María Gomez' }]);
          }
        } else {
          const res = await axios.get('/api/representatives/requests');
          setRequests(res.data.requests || []);
          setRepresentativeId(res.data.representativeId || null);
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
      await axios.post('/api/representatives/consent', { studentId: sId || user.id, representativeId: repId, action: 'grant', expiresAt: expiresAt || null });
      const res = await axios.get('/api/representatives/received');
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
          await axios.post('/api/representatives/consent', { studentId: user.id, representativeId: repId, action: 'revoke' });
          const res = await axios.get('/api/representatives/received');
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
          await axios.delete(`/api/representatives/${idToCancel}/cancel`);
          const res = await axios.get('/api/representatives/requests');
          setRequests(res.data.requests || []);
          setRepresentativeId(res.data.representativeId || null);
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
      const res = await axios.get(`/api/representatives/students/${studentId}/progress`);
      setStudentProgress((prev) => ({ ...prev, [studentId]: res.data.progress || res.data }));
      setProgressModal({ open: true, studentId });
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
                  <div>Representative ID: {r.representative_id}</div>
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

      {user && user.role === 'representative' && (
        <section>
          <h3 className="font-medium">Mis representados</h3>
          {requests.length === 0 && <p>No tienes representados asignados.</p>}
          <ul>
            {requests.map((r) => (
              <li key={r.id} className="p-2 border-b flex justify-between items-center">
                <div>
                  <div><strong>{r.name || ('Student ' + r.student_id)}</strong></div>
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
    </div>
  );
}

// Render toast at module root so it shows on this page
