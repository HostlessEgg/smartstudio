import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ForumThread() {
  const { threadId } = useParams();
  const [posts, setPosts] = useState([]);
  const [thread, setThread] = useState(null);
  const [content, setContent] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const fetch = async () => {
      try {
        const [tRes, pRes] = await Promise.all([
          axios.get(`/api/forums/threads?threadId=${threadId}`),
          axios.get(`/api/forums/threads/${threadId}/posts`)
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
      await axios.post(`/api/forums/threads/${threadId}/posts`, { content });
      setContent('');
      const res = await axios.get(`/api/forums/threads/${threadId}/posts`);
      setPosts(res.data || []);
    } catch (err) {
      console.error('Error adding post', err);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">{thread ? thread.title : 'Hilo del foro'}</h2>
      <div className="space-y-3">
        {posts.map(p => (
          <div key={p.id} className="border p-3">
            <div className="text-sm text-gray-600">{p.author_name} • {new Date(p.created_at).toLocaleString()}</div>
            <div className="mt-2">{p.content}</div>
          </div>
        ))}
      </div>

      {user ? (
        <div className="mt-4">
          <textarea value={content} onChange={e => setContent(e.target.value)} className="w-full border p-2" rows={4} />
          <button onClick={addPost} className="mt-2 bg-blue-600 text-white px-3 py-1 rounded">Agregar respuesta</button>
        </div>
      ) : (
        <div className="mt-4 text-sm text-gray-600">Inicia sesión para responder.</div>
      )}
    </div>
  );
}
