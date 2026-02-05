import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function QuizCreate() {
  const [lessonId, setLessonId] = useState('');
  const [lessons, setLessons] = useState([]);
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState([]);
  const [defaultThreshold, setDefaultThreshold] = useState(null);
  const [passPercent, setPassPercent] = useState('50');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const addQuestion = () => {
    setQuestions(prev => [...prev, { question_text: '', question_type: 'mcq', points: 1, choices: [{ text: '', is_correct: false }, { text: '', is_correct: false }] }]);
  };

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const res = await axios.get('/api/lessons');
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
        const r = await axios.get('/api/config');
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
    setMessage(null);
    // Validaciones básicas
    if (!lessonId || !title || questions.length === 0) {
      setMessage({ type: 'error', text: 'Completa la lección, título y al menos una pregunta.' });
      return;
    }

    // Validate passPercent is numeric and between 0-100
    const pp = Number(passPercent);
    if (Number.isNaN(pp) || pp < 0 || pp > 100) {
      setMessage({ type: 'error', text: 'Umbral debe ser un número entre 0 y 100.' });
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text || String(q.question_text).trim() === '') {
        setMessage({ type: 'error', text: `Pregunta ${i + 1}: texto requerido.` });
        setLoading(false);
        return;
      }
      if (q.question_type === 'mcq') {
        if (!q.choices || q.choices.length < 2) {
          setMessage({ type: 'error', text: `Pregunta ${i + 1}: se requieren al menos 2 opciones.` });
          setLoading(false);
          return;
        }
        const hasCorrect = q.choices.some(c => c.is_correct);
        if (!hasCorrect) {
          setMessage({ type: 'error', text: `Pregunta ${i + 1}: marca al menos una opción correcta.` });
          setLoading(false);
          return;
        }
        // ensure choices have non-empty text
        for (let ci = 0; ci < q.choices.length; ci++) {
          const ct = String(q.choices[ci].text || '').trim();
          if (!ct) {
            setMessage({ type: 'error', text: `Pregunta ${i + 1}: la opción ${ci + 1} debe tener texto.` });
            setLoading(false);
            return;
          }
        }
      }
      // ensure points numeric
      if (q.points && Number.isNaN(Number(q.points))) {
        setMessage({ type: 'error', text: `Pregunta ${i + 1}: puntos debe ser un número.` });
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

      const res = await axios.post('/api/quizzes', payload);
      setMessage({ type: 'success', text: 'Quiz creado correctamente' });
      // navigate to lesson quiz take page
      setTimeout(() => navigate(`/quiz/take/${lessonId}`), 700);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Error al crear quiz' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Crear Quiz</h2>
      {message && (
        <div className={`p-2 mb-4 ${message.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Lesson ID</label>
          <select value={lessonId} onChange={e => setLessonId(e.target.value)} className="border p-2 w-full">
            <option value="">Selecciona una lección...</option>
            {lessons.map(l => (
              <option key={l.id} value={l.id}>{l.title}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Umbral para aprobar (porcentaje)</label>
          <div className="flex gap-2 items-center">
            <input value={passPercent} onChange={e => setPassPercent(e.target.value)} className="border p-2 w-24" />
            <div className="text-sm text-gray-600">{defaultThreshold !== null ? `por defecto ${Math.round(defaultThreshold*100)}%` : ''}</div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Título del Quiz</label>
          <input value={title} onChange={e => setTitle(e.target.value)} className="border p-2 w-full" placeholder="Título del quiz" />
        </div>

        <div>
          <h3 className="font-semibold">Preguntas</h3>
          <button type="button" onClick={addQuestion} className="mt-2 mb-4 bg-blue-600 text-white px-3 py-1 rounded">Agregar pregunta</button>

          {questions.map((q, qi) => (
            <div key={qi} className="border p-3 mb-3">
              <div className="flex justify-between items-center">
                <strong>Pregunta {qi + 1}</strong>
                <button type="button" onClick={() => removeQuestion(qi)} className="text-sm text-red-600">Eliminar</button>
              </div>
              <input value={q.question_text} onChange={e => updateQuestion(qi, 'question_text', e.target.value)} className="border p-2 w-full my-2" placeholder="Texto de la pregunta" />
              <div className="flex gap-2 mb-2">
                <input value={q.points} onChange={e => updateQuestion(qi, 'points', e.target.value)} className="border p-2 w-24" placeholder="Puntos" />
                <select value={q.question_type} onChange={e => updateQuestion(qi, 'question_type', e.target.value)} className="border p-2">
                  <option value="mcq">Opción múltiple</option>
                  <option value="truefalse">Verdadero/Falso</option>
                  <option value="short">Respuesta corta</option>
                </select>
              </div>

              <div>
                <h4 className="font-medium">Opciones</h4>
                {q.choices.map((c, ci) => (
                  <div key={ci} className="flex gap-2 items-center mt-2">
                    <input value={c.text} onChange={e => updateChoice(qi, ci, 'text', e.target.value)} className="border p-2 flex-1" placeholder={`Opción ${ci + 1}`} />
                    <label className="flex items-center gap-1">
                      <input type="checkbox" checked={!!c.is_correct} onChange={e => updateChoice(qi, ci, 'is_correct', e.target.checked)} /> Correcta
                    </label>
                    <button type="button" onClick={() => removeChoice(qi, ci)} className="text-sm text-red-600">Eliminar</button>
                  </div>
                ))}

                <button type="button" onClick={() => addChoice(qi)} className="mt-2 bg-gray-200 px-2 py-1 rounded">Agregar opción</button>
              </div>
            </div>
          ))}
        </div>

        <div>
          <button type="submit" disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded">{loading ? 'Creando...' : 'Crear Quiz'}</button>
        </div>
      </form>
    </div>
  );
}
