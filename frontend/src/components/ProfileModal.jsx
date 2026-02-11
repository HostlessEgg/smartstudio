import React, { useEffect, useState } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { useToast } from '../contexts/ToastContext';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileModal({ open, onClose, user }) {
  const { addToast } = useToast();
  const { refreshUser, updateUser } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', role: '', occupation: '', organization: '', avatar_url: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      name: user?.name || '',
      email: user?.email || '',
      role: user?.role || '',
      occupation: user?.occupation || '',
      organization: user?.organization || '',
      avatar_url: user?.avatar_url || ''
    });
  }, [open, user]);

  const save = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const res = await api.put(`/users/${user.id}`, {
        name: form.name,
        occupation: form.occupation,
        organization: form.organization,
        avatar_url: form.avatar_url
      });
      if (res.data?.user) {
        updateUser(res.data.user);
      } else {
        await refreshUser();
      }
      addToast('Perfil actualizado', { type: 'success' });
      onClose();
    } catch (err) {
      addToast(err.response?.data?.error || 'No se pudo actualizar el perfil', { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Perfil de usuario">
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <label className="label">Nombre</label>
          <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label">Correo</label>
          <input className="input" value={form.email} disabled />
        </div>
        <div>
          <label className="label">Rol</label>
          <input className="input" value={form.role} disabled />
        </div>
        <div>
          <label className="label">Ocupación</label>
          <input className="input" value={form.occupation} onChange={e => setForm({ ...form, occupation: e.target.value })} />
        </div>
        <div>
          <label className="label">Organización</label>
          <input className="input" value={form.organization} onChange={e => setForm({ ...form, organization: e.target.value })} />
        </div>
        <div>
          <label className="label">Avatar URL</label>
          <input className="input" value={form.avatar_url} onChange={e => setForm({ ...form, avatar_url: e.target.value })} />
        </div>
      </div>
      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button onClick={save} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
      </div>
    </Modal>
  );
}
