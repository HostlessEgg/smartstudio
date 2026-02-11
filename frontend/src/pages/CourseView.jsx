import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import SubmissionBox from '../components/SubmissionBox';
import GradeBook from '../components/GradeBook';
import Button from '../components/ui/Button';
import { useToast } from '../contexts/ToastContext';

const CourseView = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [progress, setProgress] = useState({ total_lessons: 0, completed_lessons: 0 });
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    fetchCourse();
    fetchProgress();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const fetchEnroll = async () => {
      try {
          const r = await api.get(`/courses/${id}/enrolled`);
        setIsEnrolled(!!r.data?.enrolled);
      } catch (err) {
        console.error('Error fetching enrollment status:', err);
      }
    };
    fetchEnroll();
  }, [id]);

  const fetchCourse = async () => {
    try {
      const response = await api.get(`/courses/${id}`);
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
      const response = await api.get(`/progress/${id}`);
      setProgress(response.data);
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const markLessonCompleted = async (lessonId) => {
    try {
      await api.post('/progress/complete-lesson', {
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
      <div className="page">
        <div className="card" style={{ padding: 24 }}>
          <div className="muted">Cargando curso...</div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="page">
        <div className="card" style={{ padding: 24 }}>
          <div className="muted">Curso no encontrado</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 className="section-title">{course.title}</h1>
            <p className="section-subtitle">Contenido del curso y progreso.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span className="badge badge-success">{getProgressPercentage()}% completado</span>
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>Volver al dashboard</Button>
            {!isEnrolled && user && user.role === 'student' && (
              <Button
                onClick={async () => {
                  if (enrollLoading) return;
                  setEnrollLoading(true);
                  try {
                    const res = await api.post(`/courses/${id}/enroll`);
                    if (res.data && res.data.enrolled) {
                      addToast('Inscripción exitosa', { type: 'success' });
                      setIsEnrolled(true);
                    } else {
                      addToast(res.data?.message || 'Inscripción completada', { type: 'success' });
                      setIsEnrolled(true);
                    }
                  } catch (err) {
                    console.error('Error enrolling:', err);
                    addToast(err.response?.data?.error || 'Error inscribiéndose', { type: 'error' });
                  } finally {
                    setEnrollLoading(false);
                  }
                }}
                disabled={enrollLoading}
              >
                {enrollLoading ? 'Inscribiendo...' : 'Inscribirse'}
              </Button>
            )}
          </div>
        </div>

        <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'minmax(240px, 280px) 1fr', gap: 16 }}>
          <div style={{ display: 'grid', gap: 16 }}>
            <div className="card" style={{ padding: 16, border: '1px solid var(--border)', boxShadow: 'none' }}>
              <div style={{ fontWeight: 600, marginBottom: 10 }}>Contenido del curso</div>
              <div style={{ maxHeight: 360, overflowY: 'auto', display: 'grid', gap: 10 }}>
                {course.modules.map((module) => (
                  <div key={module.id}>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>{module.title}</div>
                    <div style={{ display: 'grid', gap: 6 }}>
                      {module.lessons.map((lesson, lessonIndex) => (
                        <button
                          key={lesson.id}
                          onClick={() => setSelectedLesson(lesson)}
                          className="input"
                          style={{ textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderColor: selectedLesson?.id === lesson.id ? 'var(--primary)' : 'var(--border)' }}
                        >
                          <span>{lessonIndex + 1}. {lesson.title}</span>
                          <span className="badge badge-secondary" style={{ fontSize: 10 }}>{lesson.lesson_type}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{ padding: 16, border: '1px solid var(--border)', boxShadow: 'none' }}>
              <div style={{ fontWeight: 600, marginBottom: 10 }}>Tu progreso</div>
              <div className="progress-info">
                <span className="muted">Lecciones completadas</span>
                <span className="muted">{progress.completed_lessons}/{progress.total_lessons}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${getProgressPercentage()}%` }} />
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 16, border: '1px solid var(--border)', boxShadow: 'none' }}>
            {selectedLesson ? (
              <div>
                <h2 style={{ fontWeight: 700, marginBottom: 12 }}>{selectedLesson.title}</h2>

                <div style={{ display: 'grid', gap: 12 }}>
                  {selectedLesson.lesson_type === 'video' && (
                    <div className="card" style={{ padding: 16, background: '#111', color: '#fff' }}>
                      <div style={{ fontSize: 32 }}>🎬</div>
                      <div style={{ marginTop: 8 }}>Contenido de video: “{selectedLesson.title}”</div>
                      <div className="muted" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 6 }}>
                        En una implementación real, aquí estaría integrado un reproductor de video.
                      </div>
                    </div>
                  )}

                  {selectedLesson.lesson_type === 'text' && (
                    <div className="card" style={{ padding: 16 }}>
                      <p>Este es un contenido educativo en formato de texto. Aquí iría todo el material de aprendizaje para esta lección.</p>
                      <p style={{ marginTop: 8 }}>Puede incluir explicaciones detalladas, ejemplos de código e imágenes educativas.</p>
                      <div className="card" style={{ marginTop: 10, padding: 12, border: '1px solid var(--border)', boxShadow: 'none', background: 'rgba(255, 204, 0, 0.08)' }}>
                        <strong>Nota:</strong> Este es un contenido de ejemplo.
                      </div>
                    </div>
                  )}

                  {selectedLesson.lesson_type === 'quiz' && (
                    <div className="card" style={{ padding: 16, border: '1px solid var(--border)', boxShadow: 'none' }}>
                      <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Cuestionario de evaluación</h3>
                      <div>
                        <p style={{ fontWeight: 600, marginBottom: 6 }}>1. ¿Qué es una variable en programación?</p>
                        <div style={{ display: 'grid', gap: 8 }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input type="radio" name="q1" />
                            Un tipo de dato
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input type="radio" name="q1" />
                            Un contenedor para almacenar datos
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input type="radio" name="q1" />
                            Una función
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <Button variant="secondary" onClick={() => markLessonCompleted(selectedLesson.id)}>Marcar como completado</Button>
                  <Button>Siguiente lección</Button>
                </div>

                <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                  {user && user.role === 'student' && (
                    <SubmissionBox />
                  )}

                  {user && (user.role === 'teacher' || user.role === 'admin') && (
                    <GradeBook />
                  )}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <div style={{ fontSize: 40 }}>📚</div>
                <h2 style={{ fontWeight: 700, marginTop: 8 }}>Bienvenido al curso</h2>
                <p className="muted" style={{ marginTop: 6 }}>Selecciona una lección del menú lateral para comenzar.</p>
                <div className="progress-bar" style={{ maxWidth: 180, margin: '16px auto 0' }}>
                  <div className="progress-fill" style={{ width: `${getProgressPercentage()}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseView;