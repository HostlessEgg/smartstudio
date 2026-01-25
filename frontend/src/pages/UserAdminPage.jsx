import React, { useState, useEffect } from 'react';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
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
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(1);
  const perPage = 6;
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', role: 'student', active: true });

  const fetchUsers = async (pageArg = 1, qArg = '') => {
    setLoading(true);
    try {
      const activeParam = statusFilter === 'all' ? undefined : (statusFilter === 'inactive' ? 0 : 1);
      const res = await api.get('/users', { params: { page: pageArg, per_page: 20, q: qArg, active: activeParam } });
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
  }, [page, statusFilter]);

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
    if (!form.name || !form.email) { alert('Nombre y email requeridos'); return; }
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
        const pwd = form.password || prompt('Ingrese password para el nuevo usuario (mínimo 8 caracteres):');
        if (!pwd || pwd.length < 8) { alert('Password inválido'); return; }
        await api.post('/auth/register', { name: form.name, email: form.email, password: pwd, role: form.role || 'student' });
        await fetchUsers(page, q);
      } catch (e) { /* toast via interceptor */ }
    }
    setModalOpen(false);
  };

  const removeUser = async (id) => {
    if (!confirm('Desactivar usuario?')) return;
    try {
      await api.post('/users/bulk-deactivate', { ids: [id] });
      await fetchUsers(page, q);
      setSelected(selected.filter(sid => sid !== id));
    } catch (e) { /* toast via interceptor */ }
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
    const role = prompt('Asignar role a seleccionados:');
    if (!role) return;
    if (!confirm(`Asignar role '${role}' a ${selected.length} usuarios?`)) return;
    try {
      const res = await api.post('/users/bulk-role', { ids: selected, role });
      await fetchUsers(page, q);
      const affected = res.data?.affected || 0;
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { type: 'success', message: `Roles actualizados (${affected})` } }));
      // offer undo via toast action (simple): store last bulk action in sessionStorage
      sessionStorage.setItem('last_bulk_action', JSON.stringify({ type: 'bulk_role', ids: selected, role }));
    } catch (e) { /* toast via interceptor */ }
  };

  const bulkDeactivate = async () => {
    if (!confirm(`Desactivar ${selected.length} usuarios?`)) return;
    try {
      const res = await api.post('/users/bulk-deactivate', { ids: selected });
      await fetchUsers(page, q);
      const affected = res.data?.affected || 0;
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { type: 'success', message: `Usuarios desactivados (${affected})` } }));
      sessionStorage.setItem('last_bulk_action', JSON.stringify({ type: 'bulk_deactivate', ids: selected }));
    } catch (e) { /* toast via interceptor */ }
  };

  const bulkReactivate = async () => {
    if (!selected.length) { alert('Selecciona usuarios'); return; }
    try {
      await api.post('/users/bulk-reactivate', { ids: selected });
      await fetchUsers(page, q);
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { type: 'success', message: 'Usuarios reactivados' } }));
    } catch (e) { /* toast via interceptor */ }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Administración de Usuarios</h2>

      <div className="mb-4 flex gap-2">
        <input aria-label="Buscar usuarios" className="border p-2 flex-1" placeholder="Buscar nombre o email" value={q} onChange={e=>{ setQ(e.target.value); setPage(1); }} />
        <Button className="bg-gray-200" onClick={()=>setQ('')}>Limpiar</Button>
        <select aria-label="Filtrar estado" className="border p-2" value={statusFilter} onChange={e=>{ setStatusFilter(e.target.value); setPage(1); }}>
          <option value="all">Todos</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>
        <Button className="bg-blue-600 text-white" onClick={openCreate}>Crear usuario</Button>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <span className="text-sm">Acciones masivas:</span>
        <Button onClick={bulkAssignRole} className="text-sm">Asignar role</Button>
        <Button onClick={bulkDeactivate} className="text-sm text-red-600">Desactivar</Button>
        <Button onClick={bulkReactivate} className="text-sm text-green-700">Reactivar</Button>
        <div className="ml-auto text-sm">Seleccionados: {selected.length}</div>
      </div>

      <table className="w-full border-collapse" role="table" aria-label="User administration table">
        <thead>
          <tr className="text-left">
            <th className="p-2"><input aria-label="Seleccionar todo" type="checkbox" onChange={e=>selectAllPage(e.target.checked)} checked={pageItems.every(i=>selected.includes(i.id)) && pageItems.length>0} /></th>
            <th className="p-2">ID</th>
            <th className="p-2">Nombre</th>
            <th className="p-2">Email</th>
            <th className="p-2">Role</th>
            <th className="p-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {pageItems.map(u=> (
            <tr key={u.id} className="border-t">
              <td className="p-2"><input aria-label={`Seleccionar usuario ${u.id}`} type="checkbox" checked={selected.includes(u.id)} onChange={()=>toggleSelect(u.id)} /></td>
              <td className="p-2">{u.id}</td>
              <td className="p-2">{u.name}</td>
              <td className="p-2">{u.email}</td>
              <td className="p-2">{u.role}{u.active===false ? ' (inactivo)' : ''}</td>
              <td className="p-2">
                <Button className="mr-2 text-sm text-blue-600" onClick={()=>openEdit(u)} ariaLabel={`Editar usuario ${u.id}`}>Editar</Button>
                {u.active === false ? (
                  <Button className="text-sm text-green-700" onClick={async ()=>{ await api.post('/users/bulk-reactivate', { ids: [u.id] }); await fetchUsers(page, q); }} ariaLabel={`Reactivar usuario ${u.id}`}>Reactivar</Button>
                ) : (
                  <Button className="text-sm text-red-600" onClick={()=>removeUser(u.id)} ariaLabel={`Eliminar usuario ${u.id}`}>Desactivar</Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3 flex items-center gap-2">
        <Button onClick={()=>setPage(p=>Math.max(1,p-1))} className="px-2">Anterior</Button>
        <div>Page {page} / {totalPages}</div>
        <Button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} className="px-2">Siguiente</Button>
      </div>

      <Modal open={modalOpen} onClose={()=>setModalOpen(false)} title={editing ? 'Editar usuario' : 'Crear usuario'}>
        <div className="grid grid-cols-1 gap-2">
          <label className="flex flex-col"><span>Nombre</span><input className="border p-2" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} /></label>
          <label className="flex flex-col"><span>Email</span><input className="border p-2" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} /></label>
          <label className="flex flex-col"><span>Role</span>
            <select className="border p-2" value={form.role} onChange={e=>setForm({...form, role: e.target.value})}>
              <option value="student">student</option>
              <option value="teacher">teacher</option>
              <option value="admin">admin</option>
              <option value="observer">observer</option>
            </select>
          </label>
          {!editing && (
            <label className="flex flex-col"><span>Password</span><input type="password" className="border p-2" value={form.password || ''} onChange={e=>setForm({...form, password: e.target.value})} /></label>
          )}
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.active} onChange={e=>setForm({...form, active: e.target.checked})} /> Activo</label>
          <div className="flex gap-2 mt-2">
            <Button className="bg-blue-600 text-white" onClick={saveForm}>{editing ? 'Guardar cambios' : 'Crear usuario'}</Button>
            <Button onClick={()=>setModalOpen(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
