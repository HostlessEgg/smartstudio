import React, { useState, useEffect, useRef } from 'react';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../contexts/ToastContext';
import api from '../lib/api';

const initialUsers = [
  { id: 1, name: 'Admin SmartStudio', email: 'admin@smartstudio.com', role: 'admin' },
  { id: 2, name: 'Profesor Juan Pérez', email: 'profesor@smartstudio.com', role: 'teacher' },
  { id: 3, name: 'Estudiante María García', email: 'estudiante@smartstudio.com', role: 'student' }
];

export default function UserAdminPage() {
  const [users, setUsers] = useState(initialUsers);
  const [meta, setMeta] = useState({ total: 0, total_pages: 1, page: 1, per_page: 20 });
  const [statusFilter, setStatusFilter] = useState('all'); // all | active | inactive
  const [roleFilter, setRoleFilter] = useState('all'); // all | admin | teacher | student | observer
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(1);
  const perPage = 6;
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', role: 'student', active: true });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const confirmActionRef = useRef(null);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [roleInput, setRoleInput] = useState('');
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetUser, setResetUser] = useState(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  const { addToast } = useToast();

  const fetchUsers = async (pageArg = 1, qArg = '') => {
    setLoading(true);
    try {
      const activeParam = statusFilter === 'all' ? undefined : (statusFilter === 'inactive' ? 0 : 1);
      const roleParam = roleFilter === 'all' ? undefined : roleFilter;
      const res = await api.get('/users', { params: { page: pageArg, per_page: 20, q: qArg, active: activeParam, role: roleParam } });
      const data = res.data?.data || [];
      const m = res.data?.meta || { total: data.length, total_pages: 1, page: 1, per_page: 20 };
      setUsers(data);
      setMeta(m);
    } catch (e) {
      // error surfaced by api interceptor toast
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(1, ''); }, []);

  useEffect(() => {
    // refetch when q changes, reset page
    setPage(1);
    const t = setTimeout(() => fetchUsers(1, q), 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    fetchUsers(page, q);
  }, [page, statusFilter, roleFilter]);

  const totalPages = meta?.total_pages || 1;
  const pageItems = users;

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', email: '', role: 'student', active: true });
    setModalOpen(true);
  };

  const openEdit = (u) => {
    setEditing(u.id);
    setForm({ name: u.name, email: u.email, role: u.role || 'student', active: !!u.active });
    setModalOpen(true);
  };

  const saveForm = async () => {
    if (!form.name || !form.email) { addToast('Nombre y email requeridos', { type: 'error' }); return; }
    if (editing) {
      try {
        await api.put(`/users/${editing}`, { name: form.name });
        if (form.role) {
          await api.post(`/users/${editing}/role`, { role: form.role });
        }
        // refresh list
        await fetchUsers(page, q);
      } catch (e) { /* toast via interceptor */ }
    } else {
      try {
        const pwd = (form.password || '').trim();
        if (!pwd || pwd.length < 8) { addToast('Contraseña inválida (mínimo 8 caracteres)', { type: 'error' }); return; }
        await api.post('/auth/register', { name: form.name, email: form.email, password: pwd, role: form.role || 'student' });
        await fetchUsers(page, q);
      } catch (e) { /* toast via interceptor */ }
    }
    setModalOpen(false);
  };

  const removeUser = async (id) => {
    setConfirmMessage('¿Desactivar usuario?');
    confirmActionRef.current = async () => {
      try {
        await api.post('/users/bulk-deactivate', { ids: [id] });
        await fetchUsers(page, q);
        setSelected(selected.filter(sid => sid !== id));
      } catch (e) { /* toast via interceptor */ }
    };
    setConfirmOpen(true);
  };

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]);
  };

  const selectAllPage = (checked) => {
    const ids = pageItems.map(i=>i.id);
    if (checked) {
      setSelected(prev => Array.from(new Set([...prev, ...ids])));
    } else {
      setSelected(prev => prev.filter(id => !ids.includes(id)));
    }
  };

  const bulkAssignRole = async () => {
    if (!selected.length) { addToast('Selecciona usuarios', { type: 'error' }); return; }
    setRoleInput('');
    setRoleModalOpen(true);
  };

  const bulkDeactivate = async () => {
    if (!selected.length) { addToast('Selecciona usuarios', { type: 'error' }); return; }
    setConfirmMessage(`Desactivar ${selected.length} usuarios?`);
    confirmActionRef.current = async () => {
      try {
        const res = await api.post('/users/bulk-deactivate', { ids: selected });
        await fetchUsers(page, q);
        const affected = res.data?.affected || 0;
        window.dispatchEvent(new CustomEvent('app:toast', { detail: { type: 'success', message: `Usuarios desactivados (${affected})` } }));
        sessionStorage.setItem('last_bulk_action', JSON.stringify({ type: 'bulk_deactivate', ids: selected }));
      } catch (e) { /* toast via interceptor */ }
    };
    setConfirmOpen(true);
  };

  const bulkReactivate = async () => {
    if (!selected.length) { addToast('Selecciona usuarios', { type: 'error' }); return; }
    try {
      await api.post('/users/bulk-reactivate', { ids: selected });
      await fetchUsers(page, q);
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { type: 'success', message: 'Usuarios reactivados' } }));
    } catch (e) { /* toast via interceptor */ }
  };

  const submitBulkRole = async () => {
    const role = roleInput.trim();
    if (!role) { addToast('Ingresa un rol', { type: 'error' }); return; }
    setRoleModalOpen(false);
    try {
      const res = await api.post('/users/bulk-role', { ids: selected, role });
      await fetchUsers(page, q);
      const affected = res.data?.affected || 0;
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { type: 'success', message: `Roles actualizados (${affected})` } }));
      sessionStorage.setItem('last_bulk_action', JSON.stringify({ type: 'bulk_role', ids: selected, role }));
    } catch (e) { /* toast via interceptor */ }
  };

  const openReset = (u) => {
    setResetUser(u);
    setResetPassword('');
    setResetModalOpen(true);
  };

  const submitReset = async () => {
    if (!resetUser) return;
    const pwd = resetPassword.trim();
    if (!pwd || pwd.length < 8) { addToast('Contraseña inválida (mínimo 8 caracteres)', { type: 'error' }); return; }
    setResetting(true);
    try {
      await api.post(`/users/${resetUser.id}/reset-password`, { password: pwd });
      addToast('Contraseña actualizada', { type: 'success' });
      setResetModalOpen(false);
    } catch (e) { /* toast via interceptor */ }
    finally { setResetting(false); }
  };

  return (
    <div className="page">
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 className="section-title">Administración de Usuarios</h2>
            <p className="section-subtitle">Gestión, roles y estado de usuarios.</p>
          </div>
          <span className="pill">Admin</span>
        </div>

        <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <input aria-label="Buscar usuarios" className="input" placeholder="Buscar nombre o email" value={q} onChange={e=>{ setQ(e.target.value); setPage(1); }} style={{ flex: 1, minWidth: 220 }} />
          <Button variant="ghost" onClick={()=>setQ('')}>Limpiar</Button>
          <select aria-label="Filtrar estado" className="input" value={statusFilter} onChange={e=>{ setStatusFilter(e.target.value); setPage(1); }} style={{ minWidth: 160 }}>
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
          <select aria-label="Filtrar rol" className="input" value={roleFilter} onChange={e=>{ setRoleFilter(e.target.value); setPage(1); }} style={{ minWidth: 160 }}>
            <option value="all">Todos los roles</option>
            <option value="admin">Administrador</option>
            <option value="teacher">Profesor</option>
            <option value="student">Estudiante</option>
            <option value="observer">Observador</option>
          </select>
          <Button onClick={openCreate} icon="＋">Crear usuario</Button>
        </div>

        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span className="muted" style={{ fontSize: 12 }}>Acciones masivas:</span>
          <Button variant="ghost" onClick={bulkAssignRole} className="text-sm" icon="✔">Asignar rol</Button>
          <Button variant="ghost" onClick={bulkDeactivate} className="text-sm" icon="✕">Desactivar</Button>
          <Button variant="ghost" onClick={bulkReactivate} className="text-sm" icon="✔">Reactivar</Button>
          <div className="muted" style={{ marginLeft: 'auto', fontSize: 12 }}>Seleccionados: {selected.length}</div>
        </div>

        <div className="table-container" style={{ marginTop: 12 }}>
          <table className="table" role="table" aria-label="Tabla de administración de usuarios">
            <thead>
              <tr>
                <th><input aria-label="Seleccionar todo" type="checkbox" onChange={e=>selectAllPage(e.target.checked)} checked={pageItems.every(i=>selected.includes(i.id)) && pageItems.length>0} /></th>
                <th>Usuario</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Último acceso</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map(u=> (
                <tr key={u.id}>
                  <td><input aria-label={`Seleccionar usuario ${u.id}`} type="checkbox" checked={selected.includes(u.id)} onChange={()=>toggleSelect(u.id)} /></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="user-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                        {(u.name || u.email || 'U').slice(0, 1).toUpperCase()}
                      </div>
                      <span className="muted">{u.id}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`badge ${u.active === false ? 'badge-danger' : 'badge-success'}`}>{u.role}</span>
                    {u.active===false ? <span className="muted" style={{ marginLeft: 8, fontSize: 12 }}>(inactivo)</span> : null}
                  </td>
                  <td className="muted">
                    {u.updated_at ? new Date(u.updated_at).toLocaleString() : 'N/D'}
                  </td>
                  <td>
                    <Button variant="ghost" className="mr-2 text-sm" onClick={()=>openEdit(u)} ariaLabel={`Editar usuario ${u.id}`}>Editar</Button>
                    <Button variant="ghost" className="mr-2 text-sm" onClick={()=>openReset(u)} ariaLabel={`Resetear contraseña ${u.id}`} icon="↻">Reset</Button>
                    {u.active === false ? (
                      <Button variant="secondary" className="text-sm" onClick={async ()=>{ await api.post('/users/bulk-reactivate', { ids: [u.id] }); await fetchUsers(page, q); }} ariaLabel={`Reactivar usuario ${u.id}`} icon="✔">Reactivar</Button>
                    ) : (
                      <Button variant="danger" className="text-sm" onClick={()=>removeUser(u.id)} ariaLabel={`Eliminar usuario ${u.id}`} icon="✕">Desactivar</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button variant="ghost" onClick={()=>setPage(p=>Math.max(1,p-1))} className="px-2">Anterior</Button>
          <div className="muted">Página {page} / {totalPages}</div>
          <Button variant="ghost" onClick={()=>setPage(p=>Math.min(totalPages,p+1))} className="px-2">Siguiente</Button>
        </div>

        <Modal open={modalOpen} onClose={()=>setModalOpen(false)} title={editing ? 'Editar usuario' : 'Crear usuario'}>
          <div className="grid grid-cols-1 gap-2">
            <label className="label">Nombre
              <input className="input" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} />
            </label>
            <label className="label">Email
              <input className="input" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} />
            </label>
            <label className="label">Rol
              <select className="input" value={form.role} onChange={e=>setForm({...form, role: e.target.value})}>
                <option value="student">Estudiante</option>
                <option value="teacher">Profesor</option>
                <option value="admin">Administrador</option>
                <option value="observer">Observador</option>
              </select>
            </label>
            {!editing && (
              <label className="label">Contraseña
                <input type="password" className="input" value={form.password || ''} onChange={e=>setForm({...form, password: e.target.value})} />
              </label>
            )}
            <label className="muted" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input type="checkbox" checked={form.active} onChange={e=>setForm({...form, active: e.target.checked})} /> Activo</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Button onClick={saveForm} icon="✔">{editing ? 'Guardar cambios' : 'Crear usuario'}</Button>
              <Button variant="ghost" onClick={()=>setModalOpen(false)}>Cancelar</Button>
            </div>
          </div>
        </Modal>

        <Modal open={roleModalOpen} onClose={()=>setRoleModalOpen(false)} title="Asignar rol" ariaLabel="Asignar rol masivo">
          <div className="grid grid-cols-1 gap-2">
            <label className="label">Rol
              <input className="input" value={roleInput} onChange={e=>setRoleInput(e.target.value)} placeholder="student | teacher | admin" />
            </label>
            <div className="muted" style={{ fontSize: 12 }}>Se aplicará a {selected.length} usuarios.</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Button onClick={submitBulkRole} icon="✔">Aplicar</Button>
              <Button variant="ghost" onClick={()=>setRoleModalOpen(false)}>Cancelar</Button>
            </div>
          </div>
        </Modal>

        <Modal open={resetModalOpen} onClose={()=>setResetModalOpen(false)} title="Resetear contraseña" ariaLabel="Resetear contraseña">
          <div className="grid grid-cols-1 gap-2">
            <div className="muted" style={{ fontSize: 12 }}>Usuario: {resetUser?.name} ({resetUser?.email})</div>
            <label className="label">Nueva contraseña
              <input type="password" className="input" value={resetPassword} onChange={e=>setResetPassword(e.target.value)} placeholder="mínimo 8 caracteres" />
            </label>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Button onClick={submitReset} icon="✔" disabled={resetting}>{resetting ? 'Guardando...' : 'Guardar'}</Button>
              <Button variant="ghost" onClick={()=>setResetModalOpen(false)}>Cancelar</Button>
            </div>
          </div>
        </Modal>

        <ConfirmModal
          open={confirmOpen}
          message={confirmMessage}
          confirmLabel="Confirmar"
          cancelLabel="Cancelar"
          onClose={() => setConfirmOpen(false)}
          onConfirm={async () => {
            setConfirmOpen(false);
            if (confirmActionRef.current) await confirmActionRef.current();
          }}
        />
      </div>
    </div>
  );
}
