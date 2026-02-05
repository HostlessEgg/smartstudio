import React, { useEffect, useState } from 'react';
import { fetchSubjects, createSubject, updateSubject, deleteSubject } from '../api/subjects';
import AssignTeachersModal from '../components/AssignTeachersModal';

export default function AdminSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ code: '', name: '', grade: '', hours: '', sections: '', active: true });
  const [loading, setLoading] = useState(true);
  const [assignModal, setAssignModal] = useState({ open: false, subject: null });

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const data = await fetchSubjects();
      if (mounted) setSubjects(data.map(s => ({ ...s })));
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  const startEdit = (s) => { setEditing(s.id); setForm({ ...s }); };
  const createNew = () => { setEditing('new'); setForm({ code: '', name: '', grade: '', hours: '', sections: '', active: true }); };
  const save = async () => {
    if (editing === 'new') {
      const created = await createSubject(form);
      setSubjects([...subjects, created]);
    } else {
      const updated = await updateSubject(editing, form);
      setSubjects(subjects.map(s => s.id === editing ? { ...updated } : s));
    }
    setEditing(null);
  };

  const handleDelete = async (id) => {
    await deleteSubject(id);
    setSubjects(subjects.filter(s => s.id !== id));
  };

  const openAssign = (s) => setAssignModal({ open: true, subject: s });
  const closeAssign = () => setAssignModal({ open: false, subject: null });
  const saveAssign = async (updated) => {
    const res = await updateSubject(updated.id, updated);
    setSubjects(subjects.map(s => s.id === updated.id ? res : s));
    closeAssign();
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Administración de Materias</h2>
      <div className="mb-3">
        <button onClick={createNew} className="btn btn-primary">Crear Materia</button>
      </div>

      {loading ? (
        <div>Cargando materias...</div>
      ) : (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Código</th>
              <th className="p-2">Nombre</th>
              <th className="p-2">Grado</th>
              <th className="p-2">Horas</th>
              <th className="p-2">Secciones</th>
              <th className="p-2">Activo</th>
              <th className="p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map(s => (
              <tr key={s.id} className="border-t">
                <td className="p-2">{s.code}</td>
                <td className="p-2">{s.name}</td>
                <td className="p-2">{s.grade}</td>
                <td className="p-2">{s.hours}</td>
                <td className="p-2">{s.sections}</td>
                <td className="p-2">{s.active ? 'Sí' : 'No'}</td>
                <td className="p-2">
                  <button onClick={() => startEdit(s)} className="btn btn-secondary mr-2">Editar</button>
                  <button onClick={() => openAssign(s)} className="btn btn-secondary mr-2">Asignar Profesores</button>
                  <button onClick={() => handleDelete(s.id)} className="btn btn-danger">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editing && (
        <div className="mt-4 p-4 border rounded bg-white">
          <h3 className="font-medium mb-2">{editing === 'new' ? 'Crear Materia' : `Editar Materia ${editing}`}</h3>
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Código" value={form.code} onChange={e=>setForm({...form, code: e.target.value})} className="p-2 border" />
            <input placeholder="Nombre" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} className="p-2 border" />
            <input placeholder="Grado" value={form.grade} onChange={e=>setForm({...form, grade: e.target.value})} className="p-2 border" />
            <input placeholder="Horas" value={form.hours} onChange={e=>setForm({...form, hours: e.target.value})} className="p-2 border" />
            <input placeholder="Secciones" value={form.sections} onChange={e=>setForm({...form, sections: e.target.value})} className="p-2 border" />
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.active} onChange={e=>setForm({...form, active: e.target.checked})} /> Activo</label>
          </div>
          <div className="mt-3">
            <button onClick={save} className="btn btn-primary mr-2">Guardar</button>
            <button onClick={()=>setEditing(null)} className="btn">Cancelar</button>
          </div>
        </div>
      )}
      <AssignTeachersModal
        open={assignModal.open}
        subject={assignModal.subject}
        onClose={closeAssign}
        onSave={saveAssign}
      />
    </div>
  );
}
