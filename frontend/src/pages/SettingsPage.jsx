import React, { useEffect, useState } from 'react';
import Button from '../components/ui/Button';
import api from '../lib/api';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    institution_name: '',
    school_year: '',
    period_name: '',
    period_start: '',
    period_end: '',
    notifications_enabled: true,
    allow_teacher_registration: true,
    maintenance_mode: false
  });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get('/settings');
        if (mounted) {
          setForm({
            institution_name: res.data?.institution_name || '',
            school_year: res.data?.school_year || '',
            period_name: res.data?.period_name || '',
            period_start: res.data?.period_start ? String(res.data.period_start).slice(0, 10) : '',
            period_end: res.data?.period_end ? String(res.data.period_end).slice(0, 10) : '',
            notifications_enabled: !!res.data?.notifications_enabled,
            allow_teacher_registration: !!res.data?.allow_teacher_registration,
            maintenance_mode: !!res.data?.maintenance_mode
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const update = (patch) => setForm(prev => ({ ...prev, ...patch }));

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/settings', form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 className="section-title">Configuración</h2>
            <p className="section-subtitle">Preferencias generales del sistema.</p>
          </div>
          <span className="pill">Admin</span>
        </div>

        {loading && <div className="muted" style={{ marginTop: 12 }}>Cargando configuración...</div>}

        <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
          <div className="card" style={{ padding: 16, border: '1px solid var(--border)', boxShadow: 'none' }}>
            <div style={{ fontWeight: 600, marginBottom: 10 }}>Institución</div>
            <div style={{ display: 'grid', gap: 10 }}>
              <div>
                <label className="label">Nombre de la institución</label>
                <input className="input" value={form.institution_name} onChange={(e) => update({ institution_name: e.target.value })} />
              </div>
              <div>
                <label className="label">Año escolar</label>
                <input className="input" value={form.school_year} onChange={(e) => update({ school_year: e.target.value })} placeholder="2023-2024" />
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 16, border: '1px solid var(--border)', boxShadow: 'none' }}>
            <div style={{ fontWeight: 600, marginBottom: 10 }}>Periodo académico</div>
            <div style={{ display: 'grid', gap: 10 }}>
              <div>
                <label className="label">Nombre del periodo</label>
                <input className="input" value={form.period_name} onChange={(e) => update({ period_name: e.target.value })} placeholder="1er Lapso" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="label">Inicio</label>
                  <input type="date" className="input" value={form.period_start} onChange={(e) => update({ period_start: e.target.value })} />
                </div>
                <div>
                  <label className="label">Fin</label>
                  <input type="date" className="input" value={form.period_end} onChange={(e) => update({ period_end: e.target.value })} />
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 16, border: '1px solid var(--border)', boxShadow: 'none' }}>
            <div style={{ fontWeight: 600, marginBottom: 10 }}>Preferencias del sistema</div>
            <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <input type="checkbox" checked={form.notifications_enabled} onChange={(e) => update({ notifications_enabled: e.target.checked })} />
              Habilitar notificaciones globales
            </label>
            <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <input type="checkbox" checked={form.allow_teacher_registration} onChange={(e) => update({ allow_teacher_registration: e.target.checked })} />
              Permitir registro de docentes
            </label>
            <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" checked={form.maintenance_mode} onChange={(e) => update({ maintenance_mode: e.target.checked })} />
              Activar modo mantenimiento
            </label>
          </div>
        </div>

        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={save} disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</Button>
        </div>
      </div>
    </div>
  );
}
