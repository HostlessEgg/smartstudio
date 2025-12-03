import React, { useEffect, useState } from 'react';
import Button from '../components/ui/Button';
import mockApi from '../lib/mockApi';

export default function CourseStructureEditor(){
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{
    let mounted = true;
    setLoading(true);
    mockApi.getCourseStructure().then(r=>{
      if (mounted) setCourse(r || null);
    }).finally(()=>setLoading(false));
    return ()=> mounted = false;
  },[]);

  const moveModule = (index, dir) => {
    if (!course) return;
    const next = JSON.parse(JSON.stringify(course));
    const swap = index + dir;
    if (swap < 0 || swap >= next.modules.length) return;
    const tmp = next.modules[swap];
    next.modules[swap] = next.modules[index];
    next.modules[index] = tmp;
    setCourse(next);
  };

  const moveLesson = (mIndex, lIndex, dir) => {
    if (!course) return;
    const next = JSON.parse(JSON.stringify(course));
    const lessons = next.modules[mIndex].lessons;
    const swap = lIndex + dir;
    if (swap < 0 || swap >= lessons.length) return;
    const tmp = lessons[swap];
    lessons[swap] = lessons[lIndex];
    lessons[lIndex] = tmp;
    setCourse(next);
  };

  const addModule = () => {
    const title = prompt('Título del módulo:');
    if (!title) return;
    const next = JSON.parse(JSON.stringify(course));
    next.modules.push({ id: `m${Date.now()}`, title, lessons: [] });
    setCourse(next);
  };

  const addLesson = (mIndex) => {
    const title = prompt('Título de la lección:');
    if (!title) return;
    const next = JSON.parse(JSON.stringify(course));
    next.modules[mIndex].lessons.push({ id: `l${Date.now()}`, title });
    setCourse(next);
  };

  const save = async () => {
    if (!course) return;
    setLoading(true);
    await mockApi.updateCourseStructure(course);
    setLoading(false);
    alert('Estructura guardada (mock)');
  };

  if (loading && !course) return <div className="p-4">Cargando...</div>;
  if (!course) return <div className="p-4">No hay curso cargado</div>;

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Editor de Estructura de Curso</h2>
      <div className="mb-3">
        <strong>{course.title}</strong>
      </div>
      <div className="mb-4">
        <Button onClick={addModule}>Agregar Módulo</Button>
        <Button onClick={save} className="bg-blue-600 text-white ml-2">Guardar</Button>
      </div>

      <div className="space-y-4">
        {course.modules.map((m, mi) => (
          <div key={m.id} className="p-3 border rounded">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{m.title}</div>
              <div className="flex gap-2">
                <Button onClick={()=>moveModule(mi, -1)}>↑</Button>
                <Button onClick={()=>moveModule(mi, 1)}>↓</Button>
                <Button onClick={()=>addLesson(mi)}>Agregar Lección</Button>
              </div>
            </div>
            <div className="mt-2 space-y-2">
              {m.lessons.map((l, li) => (
                <div key={l.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <div>{l.title}</div>
                  <div className="flex gap-2">
                    <Button onClick={()=>moveLesson(mi, li, -1)}>↑</Button>
                    <Button onClick={()=>moveLesson(mi, li, 1)}>↓</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-medium">Versiones</h3>
        <ul className="list-disc ml-5">
          {(course.versions||[]).map(v=> (
            <li key={v.version}>{v.version} — {v.timestamp} — {v.note}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
