import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import Button from '../components/ui/Button';
import { useToast } from '../contexts/ToastContext';

const CourseCreator = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    category: 'programming',
    level: 'beginner'
  });
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);

  const addModule = () => {
    const newModule = {
      id: Date.now(),
      title: '',
      description: '',
      lessons: []
    };
    setModules([...modules, newModule]);
  };

  const updateModule = (moduleId, field, value) => {
    setModules(modules.map(module => 
      module.id === moduleId ? { ...module, [field]: value } : module
    ));
  };

  const removeModule = (moduleId) => {
    setModules(modules.filter(module => module.id !== moduleId));
  };

  const addLesson = (moduleId) => {
    const newLesson = {
      id: Date.now(),
      title: '',
      lesson_type: 'text',
      content: ''
    };
    
    setModules(modules.map(module =>
      module.id === moduleId 
        ? { ...module, lessons: [...module.lessons, newLesson] }
        : module
    ));
  };

  const updateLesson = (moduleId, lessonId, field, value) => {
    setModules(modules.map(module =>
      module.id === moduleId
        ? {
            ...module,
            lessons: module.lessons.map(lesson =>
              lesson.id === lessonId ? { ...lesson, [field]: value } : lesson
            )
          }
        : module
    ));
  };

  const removeLesson = (moduleId, lessonId) => {
    setModules(modules.map(module =>
      module.id === moduleId
        ? { ...module, lessons: module.lessons.filter(lesson => lesson.id !== lessonId) }
        : module
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Client-side validations for modules/lessons
    if (modules.length > 0) {
      for (let mi = 0; mi < modules.length; mi++) {
        const m = modules[mi];
        if (!m.title || String(m.title).trim() === '') {
          setLoading(false);
          addToast(`El módulo ${mi + 1} requiere un título.`, { type: 'error' });
          return;
        }
        if (!m.lessons || m.lessons.length === 0) {
          setLoading(false);
          addToast(`El módulo ${mi + 1} debe contener al menos una lección.`, { type: 'error' });
          return;
        }
        for (let li = 0; li < m.lessons.length; li++) {
          const lesson = m.lessons[li];
          if (!lesson.title || String(lesson.title).trim() === '') {
            setLoading(false);
            addToast(`Módulo ${mi + 1}, lección ${li + 1} requiere un título.`, { type: 'error' });
            return;
          }
        }
      }
    }

    try {
      const payload = { ...courseData, modules: modules.map(m => ({ title: m.title, description: m.description, order_index: m.order_index || 0, lessons: (m.lessons || []).map(l => ({ title: l.title, lesson_type: l.lesson_type, content: l.content })) })) };
      const res = await api.post('/courses', payload);
      if (res.status === 201 && res.data && res.data.course && res.data.course.id) {
        window.dispatchEvent(new CustomEvent('app:toast', { detail: { type: 'success', message: 'Curso creado exitosamente' } }));
        navigate(`/course/${res.data.course.id}`);
      } else {
        console.error('Unexpected response creating course', res.data);
        addToast('Curso creado pero respuesta inesperada', { type: 'warning' });
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error creating course:', error);
      const errMsg = error.response?.data?.error || (error.response?.data?.errors ? error.response.data.errors.map(e=>e.msg).join(', ') : null) || 'Error al crear el curso';
      addToast(errMsg, { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 className="section-title">Crear curso</h1>
            <p className="section-subtitle">Define información general, módulos y lecciones.</p>
          </div>
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>Volver al dashboard</Button>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: 16, display: 'grid', gap: 16 }}>
          <div>
            <label className="label">Título del curso</label>
            <input
              type="text"
              value={courseData.title}
              onChange={(e) => setCourseData({...courseData, title: e.target.value})}
              className="input"
              placeholder="Ej: Introducción a la Programación con JavaScript"
              required
            />
          </div>

          <div>
            <label className="label">Descripción</label>
            <textarea
              value={courseData.description}
              onChange={(e) => setCourseData({...courseData, description: e.target.value})}
              rows="4"
              className="input"
              placeholder="Describe objetivos, contenido y aprendizaje esperado."
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <div>
              <label className="label">Categoría</label>
              <select
                value={courseData.category}
                onChange={(e) => setCourseData({...courseData, category: e.target.value})}
                className="input"
              >
                <option value="programming">Programación</option>
                <option value="mathematics">Matemáticas</option>
                <option value="science">Ciencias</option>
                <option value="languages">Idiomas</option>
                <option value="arts">Artes</option>
                <option value="business">Negocios</option>
              </select>
            </div>
            <div>
              <label className="label">Nivel</label>
              <select
                value={courseData.level}
                onChange={(e) => setCourseData({...courseData, level: e.target.value})}
                className="input"
              >
                <option value="beginner">Principiante</option>
                <option value="intermediate">Intermedio</option>
                <option value="advanced">Avanzado</option>
              </select>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ fontWeight: 600, marginBottom: 6 }}>Módulos del curso</h3>
                <div className="muted" style={{ fontSize: 12 }}>Organiza el contenido en módulos y lecciones.</div>
              </div>
              <Button type="button" onClick={addModule}>Agregar módulo</Button>
            </div>

            {modules.length === 0 ? (
              <div className="card" style={{ marginTop: 12, padding: 16, border: '1px dashed var(--border)', boxShadow: 'none', textAlign: 'center' }}>
                <div className="muted" style={{ marginBottom: 12 }}>No hay módulos agregados</div>
                <Button type="button" onClick={addModule}>Agregar primer módulo</Button>
              </div>
            ) : (
              <div style={{ marginTop: 12, display: 'grid', gap: 12 }}>
                {modules.map((module, index) => (
                  <div key={module.id} className="card" style={{ padding: 16, border: '1px solid var(--border)', boxShadow: 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <h4 style={{ fontWeight: 600 }}>Módulo {index + 1}</h4>
                      <Button type="button" variant="ghost" onClick={() => removeModule(module.id)}>Eliminar</Button>
                    </div>

                    <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
                      <input
                        type="text"
                        value={module.title}
                        onChange={(e) => updateModule(module.id, 'title', e.target.value)}
                        className="input"
                        placeholder="Título del módulo"
                      />
                      <textarea
                        value={module.description}
                        onChange={(e) => updateModule(module.id, 'description', e.target.value)}
                        className="input"
                        rows="2"
                        placeholder="Descripción del módulo"
                      />
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span className="muted" style={{ fontSize: 12 }}>Lecciones: {module.lessons.length}</span>
                        <Button type="button" variant="secondary" onClick={() => addLesson(module.id)}>Agregar lección</Button>
                      </div>

                      <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                        {module.lessons.map((lesson, lessonIndex) => (
                          <div key={lesson.id} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                            <input
                              type="text"
                              value={lesson.title}
                              onChange={(e) => updateLesson(module.id, lesson.id, 'title', e.target.value)}
                              className="input"
                              placeholder={`Título de lección ${lessonIndex + 1}`}
                              style={{ flex: 1, minWidth: 220 }}
                            />
                            <select
                              value={lesson.lesson_type}
                              onChange={(e) => updateLesson(module.id, lesson.id, 'lesson_type', e.target.value)}
                              className="input"
                              style={{ maxWidth: 160 }}
                            >
                              <option value="text">Texto</option>
                              <option value="video">Video</option>
                              <option value="quiz">Quiz</option>
                            </select>
                            <Button type="button" variant="ghost" onClick={() => removeLesson(module.id, lesson.id)}>Eliminar</Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button type="button" variant="ghost" onClick={() => navigate('/dashboard')}>Cancelar</Button>
            <Button type="submit" disabled={loading || !courseData.title || !courseData.description}>
              {loading ? 'Creando curso...' : 'Crear curso'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseCreator;