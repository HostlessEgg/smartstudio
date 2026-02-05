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
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Ajustes de Representante</h2>
      <div className="p-3 border rounded">
        <label className="flex items-center gap-2 mb-3">
          <input aria-label="Notificaciones por email" type="checkbox" checked={emailNotifications} onChange={e=>setEmailNotifications(e.target.checked)} />
          <span>Notificaciones por email</span>
        </label>
        {showWeeklyDigest && (
          <label className="flex items-center gap-2 mb-3">
            <input aria-label="Resumen semanal" type="checkbox" checked={weeklyDigest} onChange={e=>setWeeklyDigest(e.target.checked)} />
            <span>Recibir resumen semanal</span>
          </label>
        )}
        <label className="flex items-center gap-2 mb-3">
          <input aria-label="Notificaciones in-app" type="checkbox" checked={inAppNotifications} onChange={e=>setInAppNotifications(e.target.checked)} />
          <span>Notificaciones en la app</span>
        </label>
        <div>
          <Button className="bg-blue-600 text-white" onClick={save} ariaLabel="Guardar preferencias">{loading ? 'Guardando...' : 'Guardar preferencias'}</Button>
        </div>
      </div>
    </div>
  );
}
