import React, { useState, useEffect } from 'react';
import mockApi from '../lib/mockApi';
import Button from '../components/ui/Button';

export default function RepresentativeSettings(){
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{
    let mounted = true;
    mockApi.getSettings().then(s=>{
      if (!mounted) return;
      if (s) {
        setEmailNotifications(Boolean(s.emailNotifications));
        setWeeklyDigest(Boolean(s.weeklyDigest));
      }
    });
    return ()=>{ mounted=false };
  },[]);

  const save = async () => {
    setLoading(true);
    await mockApi.postSettings({ emailNotifications, weeklyDigest });
    setLoading(false);
    alert('Preferencias guardadas (mock)');
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Ajustes de Representante</h2>
      <div className="p-3 border rounded">
        <label className="flex items-center gap-2 mb-3">
          <input aria-label="Notificaciones por email" type="checkbox" checked={emailNotifications} onChange={e=>setEmailNotifications(e.target.checked)} />
          <span>Notificaciones por email</span>
        </label>
        <label className="flex items-center gap-2 mb-3">
          <input aria-label="Resumen semanal" type="checkbox" checked={weeklyDigest} onChange={e=>setWeeklyDigest(e.target.checked)} />
          <span>Recibir resumen semanal</span>
        </label>
        <div>
          <Button className="bg-blue-600 text-white" onClick={save} ariaLabel="Guardar preferencias">{loading ? 'Guardando...' : 'Guardar preferencias'}</Button>
        </div>
      </div>
    </div>
  );
}
