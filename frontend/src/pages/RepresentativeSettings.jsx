import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { getFeatureFlags, isFlagEnabled } from '../lib/featureFlags';
import { useToast } from '../contexts/ToastContext';
import Button from '../components/ui/Button';

export default function RepresentativeSettings(){
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [inAppNotifications, setInAppNotifications] = useState(true);
  const [flags, setFlags] = useState({});
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(()=>{
    let mounted = true;
    getFeatureFlags().then(setFlags).catch(()=>setFlags({}));
    api.get('/notifications/settings').then(res=>{
      if (!mounted) return;
      const s = res.data || {};
      setEmailNotifications(Boolean(s.email_notifications));
      setWeeklyDigest(Boolean(s.weekly_digest));
      setInAppNotifications(Boolean(s.in_app_notifications));
    }).catch(()=>{
      if (!mounted) return;
    });
    return ()=>{ mounted=false };
  },[]);

  const save = async () => {
    setLoading(true);
    try {
      await api.put('/notifications/settings', {
        email_notifications: emailNotifications,
        weekly_digest: weeklyDigest,
        in_app_notifications: inAppNotifications
      });
      addToast('Preferencias guardadas', { type: 'success' });
    } catch (e) {
      addToast('No se pudieron guardar las preferencias', { type: 'error' });
    }
    setLoading(false);
  };

  const showWeeklyDigest = isFlagEnabled(flags, 'weekly_digest');

  return (
    <div className="page">
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 className="section-title">Ajustes de representante</h2>
            <p className="section-subtitle">Configura cómo quieres recibir notificaciones.</p>
          </div>
          <span className="pill">Representante</span>
        </div>

        <div className="card" style={{ marginTop: 16, padding: 16, border: '1px solid var(--border)', boxShadow: 'none' }}>
          <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <input aria-label="Notificaciones por email" type="checkbox" checked={emailNotifications} onChange={e=>setEmailNotifications(e.target.checked)} />
            Notificaciones por email
          </label>
          {showWeeklyDigest && (
            <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <input aria-label="Resumen semanal" type="checkbox" checked={weeklyDigest} onChange={e=>setWeeklyDigest(e.target.checked)} />
              Recibir resumen semanal
            </label>
          )}
          <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <input aria-label="Notificaciones in-app" type="checkbox" checked={inAppNotifications} onChange={e=>setInAppNotifications(e.target.checked)} />
            Notificaciones en la app
          </label>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <Button onClick={save} ariaLabel="Guardar preferencias" disabled={loading}>{loading ? 'Guardando...' : 'Guardar preferencias'}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
