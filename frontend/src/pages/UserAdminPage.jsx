import React, { useState, useEffect } from 'react';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import mockApi from '../lib/mockApi';

const initialUsers = [
  { id: 1, name: 'Admin SmartStudio', email: 'admin@smartstudio.com', role: 'admin' },
  { id: 2, name: 'Profesor Juan Pérez', email: 'profesor@smartstudio.com', role: 'teacher' },
  { id: 3, name: 'Estudiante María García', email: 'estudiante@smartstudio.com', role: 'student' }
];

export default function UserAdminPage() {
  const [users, setUsers] = useState(initialUsers);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(1);
  const perPage = 6;
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', role: 'student', active: true });

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    mockApi.getUsers().then(res => {
      if (mounted && res) setUsers(res);
    }).finally(()=>setLoading(false));
    return () => { mounted = false };
  }, []);

  const filtered = users.filter(u => u.name.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageItems = filtered.slice((page-1)*perPage, page*perPage);

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
      const res = await mockApi.updateUser(editing, form);
      if (res) setUsers(users.map(u => u.id === editing ? res : u));
    } else {
      const res = await mockApi.createUser(form);
      if (res) setUsers([...(users||[]), res]);
    }
    setModalOpen(false);
  };

  const removeUser = async (id) => {
    if (!confirm('Eliminar usuario?')) return;
    const res = await mockApi.deleteUser(id);
    if (res) setUsers(users.filter(u => u.id !== id));
    setSelected(selected.filter(sid => sid !== id));
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
    for (const id of selected) {
      const updated = await mockApi.updateUser(id, { role });
      if (updated) setUsers(u => u.map(x => x.id === id ? updated : x));
    }
    alert('Roles actualizados (mock)');
  };

  const bulkDeactivate = async () => {
    if (!confirm('Desactivar usuarios seleccionados?')) return;
    for (const id of selected) {
      const updated = await mockApi.updateUser(id, { active: false });
      if (updated) setUsers(u => u.map(x => x.id === id ? updated : x));
    }
    alert('Usuarios desactivados (mock)');
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Administración de Usuarios</h2>

      <div className="mb-4 flex gap-2">
        <input aria-label="Buscar usuarios" className="border p-2 flex-1" placeholder="Buscar nombre o email" value={q} onChange={e=>{ setQ(e.target.value); setPage(1); }} />
        <Button className="bg-gray-200" onClick={()=>setQ('')}>Limpiar</Button>
        <Button className="bg-blue-600 text-white" onClick={openCreate}>Crear usuario</Button>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <span className="text-sm">Acciones masivas:</span>
        <Button onClick={bulkAssignRole} className="text-sm">Asignar role</Button>
        <Button onClick={bulkDeactivate} className="text-sm text-red-600">Desactivar</Button>
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
                <Button className="text-sm text-red-600" onClick={()=>removeUser(u.id)} ariaLabel={`Eliminar usuario ${u.id}`}>Eliminar</Button>
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
