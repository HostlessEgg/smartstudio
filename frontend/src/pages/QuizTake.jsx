import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { useParams } from 'react-router-dom';
import Button from '../components/ui/Button';

export default function QuizTake() {
  const { lessonId } = useParams();
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [threshold, setThreshold] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/quizzes/lesson/${lessonId}`);
        setQuizzes(res.data || []);
      } catch (err) {
        console.error('Error fetching quizzes', err);
      }
    };
    fetch();
  }, [lessonId]);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const r = await api.get('/config');
        setThreshold(r.data?.quizPassThreshold ?? null);
      } catch (err) {
        console.error('Error fetching config', err);
      }
    };
    fetchConfig();
  }, []);

  const openQuiz = (quiz) => {
    setSelectedQuiz(quiz);
    setAnswers({});
    setResult(null);
  };

  const choose = (questionId, choiceId) => {
    setAnswers(prev => ({ ...prev, [questionId]: choiceId }));
  };

  const submit = async () => {
    if (!selectedQuiz) return;
    setLoading(true);
    try {
      const payload = { answers: Object.keys(answers).map(qid => ({ questionId: Number(qid), choiceId: Number(answers[qid]) })) };
      const res = await api.post(`/quizzes/${selectedQuiz.id}/submit`, payload);
      setResult(res.data);
    } catch (err) {
      console.error('Error submitting quiz', err);
      setResult({ error: err.response?.data?.error || 'Error enviando quiz' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 className="section-title">Quizzes</h2>
            <p className="section-subtitle">Lección {lessonId}. Selecciona un quiz para responder.</p>
          </div>
          <span className="pill">Estudiante</span>
        </div>

        {!selectedQuiz && (
          <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
            {quizzes.length === 0 && <div className="muted">No hay quizzes para esta lección.</div>}
            {quizzes.map(q => (
              <div key={q.id} className="card" style={{ padding: 16, border: '1px solid var(--border)', boxShadow: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ fontWeight: 600 }}>{q.title}</div>
                  <Button onClick={() => openQuiz(q)}>Tomar quiz</Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedQuiz && (
          <div style={{ marginTop: 16 }}>
            {threshold !== null && (
              <div className="muted" style={{ fontSize: 12 }}>Umbral para aprobar: {Math.round(threshold * 100)}%</div>
            )}
            <div style={{ marginTop: 8 }}>
              <Button variant="ghost" onClick={() => setSelectedQuiz(null)}>Volver</Button>
            </div>
            <h3 style={{ fontWeight: 600, marginTop: 12 }}>{selectedQuiz.title}</h3>

            <div style={{ marginTop: 12, display: 'grid', gap: 12 }}>
              {selectedQuiz.questions.map(q => (
                <div key={q.id} className="card" style={{ padding: 16, border: '1px solid var(--border)', boxShadow: 'none' }}>
                  <p style={{ fontWeight: 600 }}>{q.question_text}</p>
                  <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
                    {q.choices.map(c => (
                      <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input type="radio" name={`q_${q.id}`} checked={String(answers[q.id]) === String(c.id)} onChange={() => choose(q.id, c.id)} />
                        <span>{c.choice_text}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={submit} disabled={loading}>{loading ? 'Enviando...' : 'Enviar respuestas'}</Button>
            </div>

            {result && (
              <div className="card" style={{ marginTop: 16, padding: 16, border: '1px solid var(--border)', boxShadow: 'none' }}>
                {result.error ? (
                  <div style={{ color: 'var(--danger)', fontWeight: 600 }}>{result.error}</div>
                ) : (
                  <div>
                    <div style={{ fontWeight: 600 }}>Resultado</div>
                    <div className="muted" style={{ marginTop: 6 }}>Puntaje: {result.score} / {result.maxScore}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
