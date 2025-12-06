import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

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
        const res = await axios.get(`/api/quizzes/lesson/${lessonId}`);
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
        const r = await axios.get('/api/config');
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
      const res = await axios.post(`/api/quizzes/${selectedQuiz.id}/submit`, payload);
      setResult(res.data);
    } catch (err) {
      console.error('Error submitting quiz', err);
      setResult({ error: err.response?.data?.error || 'Error enviando quiz' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Quizzes para la lección {lessonId}</h2>

      {!selectedQuiz && (
        <div>
          {quizzes.length === 0 && <p>No hay quizzes para esta lección.</p>}
          <ul className="space-y-2">
            {quizzes.map(q => (
              <li key={q.id} className="border p-3 flex justify-between items-center">
                <div>
                  <strong>{q.title}</strong>
                </div>
                <div>
                  <button onClick={() => openQuiz(q)} className="bg-blue-600 text-white px-3 py-1 rounded">Tomar</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {selectedQuiz && (
        <div>
          {threshold !== null && (
            <div className="mb-2 text-sm text-gray-700">Umbral para aprobar: {Math.round(threshold * 100)}%</div>
          )}
          <button onClick={() => setSelectedQuiz(null)} className="mb-4 text-sm text-blue-600">Volver</button>
          <h3 className="text-xl font-semibold mb-2">{selectedQuiz.title}</h3>
          <div className="space-y-4">
            {selectedQuiz.questions.map(q => (
              <div key={q.id} className="border p-3">
                <p className="font-medium">{q.question_text}</p>
                <div className="mt-2 space-y-2">
                  {q.choices.map(c => (
                    <label key={c.id} className="flex items-center gap-2">
                      <input type="radio" name={`q_${q.id}`} checked={String(answers[q.id]) === String(c.id)} onChange={() => choose(q.id, c.id)} />
                      <span>{c.choice_text}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <button onClick={submit} disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded">{loading ? 'Enviando...' : 'Enviar respuestas'}</button>
          </div>

          {result && (
            <div className="mt-4 p-3 border">
              {result.error ? (
                <div className="text-red-600">{result.error}</div>
              ) : (
                <div>
                  <div>Puntaje: {result.score} / {result.maxScore}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
