import React, { useEffect, useRef, useState } from 'react';
import Button from './ui/Button';

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
            <label className="label">Añadir profesor</label>
            <div className="flex gap-2 mt-1">
              <input ref={inputRef} placeholder="Nombre del profesor" className="input" />
              <Button variant="secondary" onClick={() => addTeacher(inputRef.current?.value)}>Añadir</Button>
            </div>
          </div>
          <ul className="mt-3">
            {teachers.map((t, i) => (
              <li key={i} className="flex justify-between items-center p-1 border-b">
                <span>{t}</span>
                <Button variant="danger" onClick={() => removeTeacher(i)}>Eliminar</Button>
              </li>
            ))}
            {teachers.length === 0 && <li className="muted" style={{ fontSize: 12 }}>No hay profesores asignados.</li>}
          </ul>
          <div className="mt-4 flex gap-2">
            <Button onClick={save}>Guardar</Button>
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
