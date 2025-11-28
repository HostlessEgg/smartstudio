import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import Toast from '../components/Toast';

export default function RepresentativeDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [received, setReceived] = useState([]);
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
        } else {
          const res = await axios.get('/api/representatives/requests');
          setRequests(res.data.requests || []);
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
    try {
      await axios.post('/api/representatives/consent', { studentId: user.id, representativeId: repId, action: 'grant' });
      // refresh
      const res = await axios.get('/api/representatives/received');
      setReceived(res.data.requests || []);
      setToast({ message: 'Consentimiento otorgado.', type: 'success' });
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setToast({ message: err.response?.data?.error || err.message, type: 'error' });
    }
  };

  const handleRevoke = async (repId) => {
    try {
      const ok = window.confirm('¿Estás seguro de revocar el consentimiento?');
      if (!ok) return;
      await axios.post('/api/representatives/consent', { studentId: user.id, representativeId: repId, action: 'revoke' });
      const res = await axios.get('/api/representatives/received');
      setReceived(res.data.requests || []);
      setToast({ message: 'Consentimiento revocado.', type: 'success' });
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setToast({ message: err.response?.data?.error || err.message, type: 'error' });
    }
  };

  const handleCancel = async (repId) => {
    try {
      const ok = window.confirm('¿Cancelar esta solicitud? Esta acción no se puede deshacer.');
      if (!ok) return;
      await axios.delete(`/api/representatives/${repId}/cancel`);
      const res = await axios.get('/api/representatives/requests');
      setRequests(res.data.requests || []);
      setToast({ message: 'Solicitud cancelada.', type: 'success' });
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setToast({ message: err.response?.data?.error || err.message, type: 'error' });
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

      {user && user.role !== 'student' && (
        <section>
          <h3 className="font-medium">Solicitudes creadas</h3>
          {requests.length === 0 && <p>No has creado solicitudes.</p>}
          <ul>
            {requests.map((r) => (
              <li key={r.id} className="p-2 border-b flex justify-between items-center">
                <div>
                  <div>Student ID: {r.student_id}</div>
                  <div>Requested at: {new Date(r.requested_at).toLocaleString()}</div>
                  <div>Active: {r.active ? 'Sí' : 'No'}</div>
                </div>
                <div>
                  <button onClick={() => handleCancel(r.representative_id)} className="btn btn-danger">Cancelar</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

// Render toast at module root so it shows on this page
