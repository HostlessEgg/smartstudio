import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const CourseView = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [progress, setProgress] = useState({ total_lessons: 0, completed_lessons: 0 });

  useEffect(() => {
    fetchCourse();
    fetchProgress();
  }, [id]);

  const fetchCourse = async () => {
    try {
      const response = await axios.get(`/api/courses/${id}`);
      setCourse(response.data);
      if (response.data.modules.length > 0 && response.data.modules[0].lessons.length > 0) {
        setSelectedLesson(response.data.modules[0].lessons[0]);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async () => {
    try {
      const response = await axios.get(`/api/progress/${id}`);
      setProgress(response.data);
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const markLessonCompleted = async (lessonId) => {
    try {
      await axios.post('/api/progress/complete-lesson', {
        lessonId,
        courseId: id
      });
      fetchProgress();
    } catch (error) {
      console.error('Error marking lesson completed:', error);
    }
  };

  const getProgressPercentage = () => {
    if (progress.total_lessons === 0) return 0;
    return Math.round((progress.completed_lessons / progress.total_lessons) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Cargando curso...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Curso no encontrado</div>
      </div>
    );
  }

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
              <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                {getProgressPercentage()}% completado
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Contenido del Curso</h3>
              </div>
              <div className="p-4 max-h-96 overflow-y-auto">
                {course.modules.map((module, moduleIndex) => (
                  <div key={module.id} className="mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {module.title}
                    </h4>
                    <div className="space-y-1">
                      {module.lessons.map((lesson, lessonIndex) => (
                        <button
                          key={lesson.id}
                          onClick={() => setSelectedLesson(lesson)}
                          className={`w-full text-left p-2 rounded hover:bg-gray-100 flex items-center justify-between ${
                            selectedLesson?.id === lesson.id 
                              ? 'bg-blue-50 text-blue-700' 
                              : 'text-gray-700'
                          }`}
                        >
                          <span className="flex items-center">
                            {lessonIndex + 1}. {lesson.title}
                          </span>
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                            {lesson.lesson_type}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress Stats */}
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <h4 className="font-semibold text-gray-900 mb-4">Tu Progreso</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Lecciones completadas</span>
                    <span>{progress.completed_lessons}/{progress.total_lessons}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="progress-bar bg-green-600 h-2 rounded-full"
                      style={{ width: `${getProgressPercentage()}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            <div className="bg-white rounded-lg shadow">
              <div className="p-8">
                {selectedLesson ? (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      {selectedLesson.title}
                    </h2>
                    
                    <div className="prose max-w-none mb-6">
                      {selectedLesson.lesson_type === 'video' && (
                        <div className="bg-gray-800 rounded-lg p-8 text-center mb-6">
                          <div className="text-6xl text-white mb-4">🎬</div>
                          <p className="text-white">Contenido de video: "{selectedLesson.title}"</p>
                          <p className="text-gray-400 text-sm mt-2">
                            En una implementación real, aquí estaría integrado un reproductor de video.
                          </p>
                        </div>
                      )}
                      
                      {selectedLesson.lesson_type === 'text' && (
                        <div>
                          <p>Este es un contenido educativo en formato de texto. Aquí iría todo el material de aprendizaje para esta lección.</p>
                          <p className="mt-4">Puede incluir explicaciones detalladas, ejemplos de código, imágenes educativas, y cualquier otro recurso que ayude al aprendizaje.</p>
                          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
                            <p className="text-yellow-700">
                              <strong>Nota:</strong> Este es un contenido de ejemplo. En una implementación real, aquí estaría el contenido educativo completo.
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {selectedLesson.lesson_type === 'quiz' && (
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <h3 className="text-lg font-semibold mb-4">Cuestionario de Evaluación</h3>
                          <div className="space-y-4">
                            <div>
                              <p className="font-medium mb-2">1. ¿Qué es una variable en programación?</p>
                              <div className="space-y-2">
                                <label className="flex items-center">
                                  <input type="radio" name="q1" className="mr-2" /> 
                                  Un tipo de dato
                                </label>
                                <label className="flex items-center">
                                  <input type="radio" name="q1" className="mr-2" /> 
                                  Un contenedor para almacenar datos
                                </label>
                                <label className="flex items-center">
                                  <input type="radio" name="q1" className="mr-2" /> 
                                  Una función
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                      <button
                        onClick={() => markLessonCompleted(selectedLesson.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
                      >
                        Marcar como Completado
                      </button>
                      
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
                        Siguiente Lección
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📚</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      Bienvenido al curso
                    </h2>
                    <p className="text-gray-600 mb-6">
                      Selecciona una lección del menú lateral para comenzar tu aprendizaje.
                    </p>
                    <div className="w-32 h-2 bg-gray-200 rounded-full mx-auto">
                      <div 
                        className="h-2 bg-green-600 rounded-full" 
                        style={{ width: `${getProgressPercentage()}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseView;