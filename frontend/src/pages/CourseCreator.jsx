import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CourseCreator = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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
          alert(`El módulo ${mi + 1} requiere un título.`);
          return;
        }
        if (!m.lessons || m.lessons.length === 0) {
          setLoading(false);
          alert(`El módulo ${mi + 1} debe contener al menos una lección.`);
          return;
        }
        for (let li = 0; li < m.lessons.length; li++) {
          const lesson = m.lessons[li];
          if (!lesson.title || String(lesson.title).trim() === '') {
            setLoading(false);
            alert(`Módulo ${mi + 1}, lección ${li + 1} requiere un título.`);
            return;
          }
        }
      }
    }

    try {
      const payload = { ...courseData, modules: modules.map(m => ({ title: m.title, description: m.description, order_index: m.order_index || 0, lessons: (m.lessons || []).map(l => ({ title: l.title, lesson_type: l.lesson_type, content: l.content })) })) };
      const res = await axios.post('/api/courses', payload);
      if (res.status === 201 && res.data && res.data.course && res.data.course.id) {
        alert('Curso creado exitosamente');
        navigate(`/course/${res.data.course.id}`);
      } else {
        console.error('Unexpected response creating course', res.data);
        alert('Curso creado pero respuesta inesperada');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error creating course:', error);
      const errMsg = error.response?.data?.error || (error.response?.data?.errors ? error.response.data.errors.map(e=>e.msg).join(', ') : null) || 'Error al crear el curso';
      alert(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-blue-600 hover:text-blue-800 mr-4"
              >
                ← Volver al Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Crear Nuevo Curso</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Información del Curso</h2>
          </div>
          
          <div className="p-6">
            <form onSubmit={handleSubmit}>
              {/* Información básica del curso */}
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Título del Curso *
                </label>
                <input
                  type="text"
                  value={courseData.title}
                  onChange={(e) => setCourseData({...courseData, title: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="Ej: Introducción a la Programación con JavaScript"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Descripción *
                </label>
                <textarea
                  value={courseData.description}
                  onChange={(e) => setCourseData({...courseData, description: e.target.value})}
                  rows="4"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="Describe los objetivos, contenido y lo que aprenderán los estudiantes..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Categoría
                  </label>
                  <select
                    value={courseData.category}
                    onChange={(e) => setCourseData({...courseData, category: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
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
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Nivel
                  </label>
                  <select
                    value={courseData.level}
                    onChange={(e) => setCourseData({...courseData, level: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="beginner">Principiante</option>
                    <option value="intermediate">Intermedio</option>
                    <option value="advanced">Avanzado</option>
                  </select>
                </div>
              </div>

              {/* Módulos del curso */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-gray-700 text-sm font-bold">
                    Módulos del Curso
                  </label>
                  <button
                    type="button"
                    onClick={addModule}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    + Agregar Módulo
                  </button>
                </div>

                {modules.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <p className="text-gray-500 mb-4">No hay módulos agregados</p>
                    <button
                      type="button"
                      onClick={addModule}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                    >
                      Agregar Primer Módulo
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {modules.map((module, index) => (
                      <div key={module.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-semibold text-gray-900">
                            Módulo {index + 1}
                          </h4>
                          <button
                            type="button"
                            onClick={() => removeModule(module.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            ✕ Eliminar
                          </button>
                        </div>

                        <div className="mb-3">
                          <input
                            type="text"
                            value={module.title}
                            onChange={(e) => updateModule(module.id, 'title', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded"
                            placeholder="Título del módulo"
                          />
                        </div>

                        <div className="mb-3">
                          <textarea
                            value={module.description}
                            onChange={(e) => updateModule(module.id, 'description', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded"
                            rows="2"
                            placeholder="Descripción del módulo"
                          />
                        </div>

                        {/* Lecciones del módulo */}
                        <div className="mb-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-600">
                              Lecciones: {module.lessons.length}
                            </span>
                            <button
                              type="button"
                              onClick={() => addLesson(module.id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                            >
                              + Agregar Lección
                            </button>
                          </div>

                          <div className="space-y-2">
                            {module.lessons.map((lesson, lessonIndex) => (
                              <div key={lesson.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                                <div className="flex-1">
                                  <input
                                    type="text"
                                    value={lesson.title}
                                    onChange={(e) => updateLesson(module.id, lesson.id, 'title', e.target.value)}
                                    className="w-full p-1 border border-gray-300 rounded"
                                    placeholder={`Título de lección ${lessonIndex + 1}`}
                                  />
                                </div>
                                <select
                                  value={lesson.lesson_type}
                                  onChange={(e) => updateLesson(module.id, lesson.id, 'lesson_type', e.target.value)}
                                  className="p-1 border border-gray-300 rounded text-sm"
                                >
                                  <option value="text">Texto</option>
                                  <option value="video">Video</option>
                                  <option value="quiz">Quiz</option>
                                </select>
                                <button
                                  type="button"
                                  onClick={() => removeLesson(module.id, lesson.id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !courseData.title || !courseData.description}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg disabled:opacity-50"
                >
                  {loading ? 'Creando Curso...' : 'Crear Curso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CourseCreator;