import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import { useToast } from '../contexts/ToastContext';

export default function ForumThread() {
  const { threadId } = useParams();
  const [posts, setPosts] = useState([]);
  const [thread, setThread] = useState(null);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const { user } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    const fetch = async () => {
      try {
        const [tRes, pRes] = await Promise.all([
          api.get(`/forums/threads?threadId=${threadId}`),
          api.get(`/forums/threads/${threadId}/posts`)
        ]);
        setThread(tRes.data?.[0] || null);
        setPosts(pRes.data || []);
      } catch (err) {
        console.error('Error fetching thread/posts', err);
      }
    };
    fetch();
  }, [threadId]);

  const addPost = async () => {
    if (!content || !content.trim()) return;
    try {
      setSending(true);
      await api.post(`/forums/threads/${threadId}/posts`, { content });
      setContent('');
      const res = await api.get(`/forums/threads/${threadId}/posts`);
      setPosts(res.data || []);
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { type: 'success', message: 'Respuesta publicada' } }));
    } catch (err) {
      console.error('Error adding post', err);
      addToast('No se pudo publicar la respuesta', { type: 'error' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="page">
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 className="section-title">Foro</h2>
            <p className="section-subtitle">{thread ? thread.title : 'Hilo del foro'}</p>
          </div>
          <span className="pill">Hilo</span>
        </div>
        {thread?.created_at && (
          <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>Creado: {new Date(thread.created_at).toLocaleString()}</div>
        )}

        <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
          {posts.length === 0 && <div className="muted">Aún no hay respuestas en este hilo.</div>}
          {posts.map(p => (
            <div key={p.id} className="card" style={{ padding: 16, border: '1px solid var(--border)', boxShadow: 'none' }}>
              <div className="muted" style={{ fontSize: 12 }}>{p.author_name} • {new Date(p.created_at).toLocaleString()}</div>
              <div style={{ marginTop: 8 }}>{p.content}</div>
            </div>
          ))}
        </div>

        {user ? (
          <div className="card" style={{ marginTop: 20, padding: 16, border: '1px solid var(--border)', boxShadow: 'none' }}>
            <label className="label">Tu respuesta</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              className="input"
              rows={4}
              placeholder="Escribe tu respuesta..."
            />
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={addPost} disabled={sending}>{sending ? 'Publicando...' : 'Publicar respuesta'}</Button>
            </div>
          </div>
        ) : (
          <div className="muted" style={{ marginTop: 16 }}>Inicia sesión para responder.</div>
        )}
      </div>
    </div>
  );
}
