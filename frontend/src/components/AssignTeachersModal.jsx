import React, { useEffect, useRef, useState } from 'react';

export default function AssignTeachersModal({ open, subject, onClose, onSave }) {
  const [teachers, setTeachers] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTeachers(subject?.teachers ? [...subject.teachers] : []);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open, subject]);

  if (!open) return null;

  const addTeacher = (name) => {
    if (!name) return;
    setTeachers(prev => [...prev, name]);
    inputRef.current.value = '';
  };

  const removeTeacher = (idx) => setTeachers(prev => prev.filter((_, i) => i !== idx));

  const save = () => {
    onSave({ ...subject, teachers });
  };

  return (
    <div className="progress-modal-backdrop" onMouseDown={onClose}>
      <div className="progress-modal" role="dialog" aria-modal="true" onMouseDown={(e)=>e.stopPropagation()}>
        <div className="progress-modal-header">
          <h3 className="progress-modal-title">Asignar Profesores</h3>
          <button onClick={onClose} className="progress-modal-close" aria-label="Cerrar modal">✕</button>
        </div>
        <div className="progress-modal-body">
          <p>Materia: <strong>{subject?.name}</strong></p>
          <div className="mt-2">
            <label className="text-sm">Añadir profesor</label>
            <div className="flex gap-2 mt-1">
              <input ref={inputRef} placeholder="Nombre del profesor" className="p-2 border flex-1" />
              <button onClick={() => addTeacher(inputRef.current?.value)} className="btn btn-secondary">Añadir</button>
            </div>
          </div>
          <ul className="mt-3">
            {teachers.map((t, i) => (
              <li key={i} className="flex justify-between items-center p-1 border-b">
                <span>{t}</span>
                <button onClick={() => removeTeacher(i)} className="btn btn-danger">Eliminar</button>
              </li>
            ))}
            {teachers.length === 0 && <li className="text-sm text-gray-600">No hay profesores asignados.</li>}
          </ul>
          <div className="mt-4 flex gap-2">
            <button onClick={save} className="btn btn-primary">Guardar</button>
            <button onClick={onClose} className="btn">Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
