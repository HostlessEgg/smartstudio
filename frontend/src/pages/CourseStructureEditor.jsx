import React, { useEffect, useState } from 'react';
import Button from '../components/ui/Button';
import mockApi from '../lib/mockApi';
import { useToast } from '../contexts/ToastContext';

export default function CourseStructureEditor(){
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [lessonDrafts, setLessonDrafts] = useState({});
  const { addToast } = useToast();

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
    const title = String(newModuleTitle || '').trim();
    if (!title) {
      addToast('Ingresa un título para el módulo', { type: 'error' });
      return;
    }
    const next = JSON.parse(JSON.stringify(course));
    next.modules.push({ id: `m${Date.now()}`, title, lessons: [] });
    setCourse(next);
    setNewModuleTitle('');
  };

  const addLesson = (mIndex, moduleId) => {
    const title = String(lessonDrafts[moduleId] || '').trim();
    if (!title) {
      addToast('Ingresa un título para la lección', { type: 'error' });
      return;
    }
    const next = JSON.parse(JSON.stringify(course));
    next.modules[mIndex].lessons.push({ id: `l${Date.now()}`, title });
    setCourse(next);
    setLessonDrafts(prev => ({ ...prev, [moduleId]: '' }));
  };

  const save = async () => {
    if (!course) return;
    setLoading(true);
    await mockApi.updateCourseStructure(course);
    setLoading(false);
    addToast('Estructura guardada', { type: 'success' });
  };

  if (loading && !course) return <div className="page"><div className="card" style={{ padding: 24 }}><div className="muted">Cargando...</div></div></div>;
  if (!course) return <div className="page"><div className="card" style={{ padding: 24 }}><div className="muted">No hay curso cargado</div></div></div>;

  return (
    <div className="page">
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 className="section-title">Estructura del curso</h2>
            <p className="section-subtitle">Edita módulos y lecciones con orden personalizado.</p>
          </div>
          <span className="pill">Admin</span>
        </div>

        <div style={{ marginTop: 12, fontWeight: 600 }}>{course.title}</div>

        <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <input className="input" placeholder="Título del módulo" value={newModuleTitle} onChange={e => setNewModuleTitle(e.target.value)} style={{ maxWidth: 320 }} />
          <Button onClick={addModule}>Agregar módulo</Button>
          <Button variant="secondary" onClick={save} disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</Button>
        </div>

        <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
          {course.modules.map((m, mi) => (
            <div key={m.id} className="card" style={{ padding: 16, border: '1px solid var(--border)', boxShadow: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 600 }}>{m.title}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Button variant="ghost" onClick={()=>moveModule(mi, -1)}>↑</Button>
                  <Button variant="ghost" onClick={()=>moveModule(mi, 1)}>↓</Button>
                </div>
              </div>

              <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <input
                  className="input"
                  placeholder="Título de la lección"
                  value={lessonDrafts[m.id] || ''}
                  onChange={e => setLessonDrafts(prev => ({ ...prev, [m.id]: e.target.value }))}
                  style={{ flex: 1, minWidth: 220 }}
                />
                <Button variant="secondary" onClick={() => addLesson(mi, m.id)}>Agregar lección</Button>
              </div>

              <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
                {m.lessons.map((l, li) => (
                  <div key={l.id} className="card" style={{ padding: 12, border: '1px solid var(--border)', boxShadow: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                      <div>{l.title}</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button variant="ghost" onClick={()=>moveLesson(mi, li, -1)}>↑</Button>
                        <Button variant="ghost" onClick={()=>moveLesson(mi, li, 1)}>↓</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20 }}>
          <h3 style={{ fontWeight: 600 }}>Versiones</h3>
          <ul style={{ marginTop: 8, paddingLeft: 20 }}>
            {(course.versions||[]).map(v=> (
              <li key={v.version}>{v.version} — {v.timestamp} — {v.note}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
