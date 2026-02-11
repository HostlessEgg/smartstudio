import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import Toast from '../components/Toast';
import ProgressModal from '../components/ProgressModal';
import ConsentModal from '../components/ConsentModal';
import ConfirmModal from '../components/ConfirmModal';
import Button from '../components/ui/Button';

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

  const viewProgress = async (studentId) => {
    try {
      setLoading(true);
      const res = await api.get(`/representatives/students/${studentId}/progress`);
      setStudentProgress((prev) => ({ ...prev, [studentId]: res.data.progress || res.data }));
      setProgressModal({ open: true, studentId });
    } catch (err) {
      setToast({ message: err.response?.data?.error || err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 className="section-title">Representantes</h2>
            <p className="section-subtitle">Solicitudes, consentimientos y progreso.</p>
          </div>
          <span className="pill">{user?.role === 'student' ? 'Estudiante' : 'Representante'}</span>
        </div>

        {loading && <div className="muted" style={{ marginTop: 12 }}>Cargando...</div>}
        {error && <div className="badge badge-danger" style={{ marginTop: 12 }}>{error}</div>}

        {user && user.role === 'student' && (
          <section style={{ marginTop: 16 }}>
            <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Solicitudes recibidas</h3>
            {received.length === 0 && <div className="muted">No hay solicitudes.</div>}
            {received.length > 0 && (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Representante</th>
                      <th>Email</th>
                      <th>Solicitado</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {received.map((r) => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 600 }}>{r.representative_name || 'Sin nombre'}</td>
                        <td>{r.representative_email || 'N/A'}</td>
                        <td className="muted">{new Date(r.requested_at).toLocaleString()}</td>
                        <td>
                          <span className={`badge ${r.active ? 'badge-success' : 'badge-warning'}`}>{r.active ? 'Activo' : 'Pendiente'}</span>
                        </td>
                        <td>
                          {!r.active ? (
                            <Button onClick={() => handleGrant(r.representative_id)} icon="✔">Conceder</Button>
                          ) : (
                            <Button variant="danger" onClick={() => handleRevoke(r.representative_id)} icon="✕">Revocar</Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {user && user.role !== 'student' && (
          <section style={{ marginTop: 16 }}>
            <div className="card" style={{ padding: 16, marginBottom: 16 }}>
              <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Solicitar acceso como representante</h3>
              <form onSubmit={handleCreateRequest} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
                <label className="label" style={{ minWidth: 220 }}>ID de estudiante
                  <input
                    value={requestStudentId}
                    onChange={(e) => setRequestStudentId(e.target.value)}
                    className="input"
                    placeholder="Ej: 123"
                  />
                </label>
                <Button type="submit" icon="＋">Enviar solicitud</Button>
                {representativeId && (
                  <Button type="button" variant="ghost" onClick={() => handleCancel(representativeId)} icon="✕">Cancelar pendientes</Button>
                )}
              </form>
            </div>

            <h4 style={{ fontWeight: 600, marginBottom: 8 }}>Solicitudes realizadas</h4>
            {requests.length === 0 && <div className="muted" style={{ marginBottom: 12 }}>No has realizado solicitudes.</div>}
            {requests.length > 0 && (
              <div className="table-container" style={{ marginBottom: 16 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Estudiante</th>
                      <th>Email</th>
                      <th>ID</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((r) => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 600 }}>{r.student_name || ('Estudiante ' + r.student_id)}</td>
                        <td>{r.student_email || 'N/A'}</td>
                        <td>{r.student_id}</td>
                        <td><span className={`badge ${r.active ? 'badge-success' : 'badge-warning'}`}>{r.active ? 'Activo' : 'Pendiente'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <h4 style={{ fontWeight: 600, marginBottom: 8 }}>Representados con consentimiento activo</h4>
            {representativeStudents.length === 0 && <div className="muted">No tienes consentimientos activos.</div>}
            {representativeStudents.length > 0 && (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Estudiante</th>
                      <th>Email</th>
                      <th>ID</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {representativeStudents.map((r) => (
                      <tr key={r.student_id}>
                        <td style={{ fontWeight: 600 }}>{r.name || ('Estudiante ' + r.student_id)}</td>
                        <td>{r.email || 'N/A'}</td>
                        <td>{r.student_id}</td>
                        <td>
                          <Button variant="secondary" onClick={() => viewProgress(r.student_id)} icon="📈">Ver progreso</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
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
