import React, { useEffect, useState } from 'react';
import { fetchSubjects, createSubject, updateSubject, deleteSubject } from '../api/subjects';
import AssignTeachersModal from '../components/AssignTeachersModal';
import Button from '../components/ui/Button';

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
    <div className="page">
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 className="section-title">Administración de Materias</h2>
            <p className="section-subtitle">Catálogo académico y asignaciones.</p>
          </div>
          <Button onClick={createNew} icon="＋">Crear Materia</Button>
        </div>

        {loading ? (
          <div className="muted" style={{ marginTop: 16 }}>Cargando materias...</div>
        ) : (
          <div className="table-container" style={{ marginTop: 16 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Grado</th>
                  <th>Horas</th>
                  <th>Secciones</th>
                  <th>Activo</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map(s => (
                  <tr key={s.id}>
                    <td>{s.code}</td>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td>{s.grade}</td>
                    <td>{s.hours}</td>
                    <td>{s.sections}</td>
                    <td>
                      <span className={`badge ${s.active ? 'badge-success' : 'badge-danger'}`}>{s.active ? 'Activo' : 'Inactivo'}</span>
                    </td>
                    <td>
                      <Button variant="ghost" className="mr-2 text-sm" onClick={() => startEdit(s)} icon="✎">Editar</Button>
                      <Button variant="secondary" className="mr-2 text-sm" onClick={() => openAssign(s)} icon="👥">Asignar</Button>
                      <Button variant="danger" className="text-sm" onClick={() => handleDelete(s.id)} icon="✕">Eliminar</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {editing && (
          <div className="card" style={{ marginTop: 16, padding: 16 }}>
            <h3 style={{ fontWeight: 600, marginBottom: 10 }}>{editing === 'new' ? 'Crear Materia' : `Editar Materia ${editing}`}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <label className="label">Código
                <input placeholder="Código" value={form.code} onChange={e=>setForm({...form, code: e.target.value})} className="input" />
              </label>
              <label className="label">Nombre
                <input placeholder="Nombre" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} className="input" />
              </label>
              <label className="label">Grado
                <input placeholder="Grado" value={form.grade} onChange={e=>setForm({...form, grade: e.target.value})} className="input" />
              </label>
              <label className="label">Horas
                <input placeholder="Horas" value={form.hours} onChange={e=>setForm({...form, hours: e.target.value})} className="input" />
              </label>
              <label className="label">Secciones
                <input placeholder="Secciones" value={form.sections} onChange={e=>setForm({...form, sections: e.target.value})} className="input" />
              </label>
              <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <input type="checkbox" checked={form.active} onChange={e=>setForm({...form, active: e.target.checked})} /> Activo
              </label>
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <Button onClick={save} icon="✔">Guardar</Button>
              <Button variant="ghost" onClick={()=>setEditing(null)}>Cancelar</Button>
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
    </div>
  );
}
