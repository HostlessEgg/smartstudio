import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { useToast } from '../contexts/ToastContext';

export default function QuizCreate() {
  const [lessonId, setLessonId] = useState('');
  const [lessons, setLessons] = useState([]);
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState([]);
  const [defaultThreshold, setDefaultThreshold] = useState(null);
  const [passPercent, setPassPercent] = useState('50');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const addQuestion = () => {
    setQuestions(prev => [...prev, { question_text: '', question_type: 'mcq', points: 1, choices: [{ text: '', is_correct: false }, { text: '', is_correct: false }] }]);
  };

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const res = await api.get('/lessons');
        const rows = res.data || [];
        const collected = rows.map(r => ({ id: r.lesson_id, title: `${r.course_title} / ${r.module_title} / ${r.lesson_title}` }));
        setLessons(collected);
      } catch (err) {
        console.error('Error fetching lessons', err);
      }
    };
    fetchLessons();
    const fetchConfig = async () => {
      try {
        const r = await api.get('/config');
        const thr = r.data?.quizPassThreshold ?? 0.5;
        setDefaultThreshold(thr);
        setPassPercent(String(Math.round(thr * 100)));
      } catch (err) {
        console.error('Error fetching config', err);
      }
    };
    fetchConfig();
  }, []);

  const removeQuestion = (index) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const updateQuestion = (index, field, value) => {
    setQuestions(prev => prev.map((q, i) => i === index ? { ...q, [field]: value } : q));
  };

  const addChoice = (qIndex) => {
    setQuestions(prev => prev.map((q, i) => i === qIndex ? { ...q, choices: [...q.choices, { text: '', is_correct: false }] } : q));
  };

  const updateChoice = (qIndex, cIndex, field, value) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIndex) return q;
      const choices = q.choices.map((c, j) => j === cIndex ? { ...c, [field]: value } : c);
      return { ...q, choices };
    }));
  };

  const removeChoice = (qIndex, cIndex) => {
    setQuestions(prev => prev.map((q, i) => i === qIndex ? { ...q, choices: q.choices.filter((_, j) => j !== cIndex) } : q));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validaciones básicas
    if (!lessonId || !title || questions.length === 0) {
      addToast('Completa la lección, título y al menos una pregunta.', { type: 'error' });
      return;
    }

    // Validate passPercent is numeric and between 0-100
    const pp = Number(passPercent);
    if (Number.isNaN(pp) || pp < 0 || pp > 100) {
      addToast('Umbral debe ser un número entre 0 y 100.', { type: 'error' });
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text || String(q.question_text).trim() === '') {
        addToast(`Pregunta ${i + 1}: texto requerido.`, { type: 'error' });
        setLoading(false);
        return;
      }
      if (q.question_type === 'mcq') {
        if (!q.choices || q.choices.length < 2) {
          addToast(`Pregunta ${i + 1}: se requieren al menos 2 opciones.`, { type: 'error' });
          setLoading(false);
          return;
        }
        const hasCorrect = q.choices.some(c => c.is_correct);
        if (!hasCorrect) {
          addToast(`Pregunta ${i + 1}: marca al menos una opción correcta.`, { type: 'error' });
          setLoading(false);
          return;
        }
        // ensure choices have non-empty text
        for (let ci = 0; ci < q.choices.length; ci++) {
          const ct = String(q.choices[ci].text || '').trim();
          if (!ct) {
            addToast(`Pregunta ${i + 1}: la opción ${ci + 1} debe tener texto.`, { type: 'error' });
            setLoading(false);
            return;
          }
        }
      }
      // ensure points numeric
      if (q.points && Number.isNaN(Number(q.points))) {
        addToast(`Pregunta ${i + 1}: puntos debe ser un número.`, { type: 'error' });
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        lessonId: Number(lessonId),
        title,
        pass_threshold: (Number(passPercent) / 100) || null,
        questions: questions.map(q => ({
          question_text: q.question_text,
          question_type: q.question_type,
          points: Number(q.points) || 1,
          choices: (q.choices || []).map(c => ({ text: c.text, is_correct: !!c.is_correct }))
        }))
      };

      await api.post('/quizzes', payload);
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { type: 'success', message: 'Quiz creado correctamente' } }));
      // navigate to lesson quiz take page
      setTimeout(() => navigate(`/quiz/take/${lessonId}`), 700);
    } catch (err) {
      addToast(err.response?.data?.error || 'Error al crear quiz', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 className="section-title">Crear quiz</h2>
            <p className="section-subtitle">Configura el cuestionario, preguntas y umbral de aprobación.</p>
          </div>
          <span className="pill">Docente</span>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: 16, display: 'grid', gap: 16 }}>
          <div>
            <label className="label">Lección</label>
            <select value={lessonId} onChange={e => setLessonId(e.target.value)} className="input">
              <option value="">Selecciona una lección...</option>
              {lessons.map(l => (
                <option key={l.id} value={l.id}>{l.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Umbral para aprobar (porcentaje)</label>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <input value={passPercent} onChange={e => setPassPercent(e.target.value)} className="input" style={{ maxWidth: 120 }} />
              {defaultThreshold !== null && (
                <div className="muted" style={{ fontSize: 12 }}>Por defecto {Math.round(defaultThreshold * 100)}%</div>
              )}
            </div>
          </div>

          <div>
            <label className="label">Título del quiz</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="input" placeholder="Título del quiz" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ fontWeight: 600, marginBottom: 6 }}>Preguntas</h3>
                <div className="muted" style={{ fontSize: 12 }}>Agrega preguntas de opción múltiple, verdadero/falso o respuesta corta.</div>
              </div>
              <Button type="button" onClick={addQuestion}>Agregar pregunta</Button>
            </div>

            <div style={{ marginTop: 12, display: 'grid', gap: 12 }}>
              {questions.length === 0 && <div className="muted">Aún no agregas preguntas.</div>}
              {questions.map((q, qi) => (
                <div key={qi} className="card" style={{ padding: 16, border: '1px solid var(--border)', boxShadow: 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <strong>Pregunta {qi + 1}</strong>
                    <Button type="button" variant="ghost" onClick={() => removeQuestion(qi)} className="text-sm">Eliminar</Button>
                  </div>
                  <input value={q.question_text} onChange={e => updateQuestion(qi, 'question_text', e.target.value)} className="input" placeholder="Texto de la pregunta" style={{ marginTop: 10 }} />
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
                    <input value={q.points} onChange={e => updateQuestion(qi, 'points', e.target.value)} className="input" style={{ maxWidth: 120 }} placeholder="Puntos" />
                    <select value={q.question_type} onChange={e => updateQuestion(qi, 'question_type', e.target.value)} className="input" style={{ maxWidth: 220 }}>
                      <option value="mcq">Opción múltiple</option>
                      <option value="truefalse">Verdadero/Falso</option>
                      <option value="short">Respuesta corta</option>
                    </select>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <h4 style={{ fontWeight: 600, marginBottom: 6 }}>Opciones</h4>
                    {q.choices.map((c, ci) => (
                      <div key={ci} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
                        <input value={c.text} onChange={e => updateChoice(qi, ci, 'text', e.target.value)} className="input" placeholder={`Opción ${ci + 1}`} style={{ flex: 1, minWidth: 220 }} />
                        <label className="label" style={{ display: 'flex', gap: 8, alignItems: 'center', margin: 0 }}>
                          <input type="checkbox" checked={!!c.is_correct} onChange={e => updateChoice(qi, ci, 'is_correct', e.target.checked)} />
                          Correcta
                        </label>
                        <Button type="button" variant="ghost" onClick={() => removeChoice(qi, ci)} className="text-sm">Eliminar</Button>
                      </div>
                    ))}

                    <div style={{ marginTop: 10 }}>
                      <Button type="button" variant="secondary" onClick={() => addChoice(qi)}>Agregar opción</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="submit" disabled={loading}>{loading ? 'Creando...' : 'Crear quiz'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
