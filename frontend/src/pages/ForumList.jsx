import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';

export default function ForumList() {
  const { courseId } = useParams();
  const [threads, setThreads] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const q = courseId ? `?courseId=${courseId}` : '';
        const res = await axios.get(`/api/forums/threads${q}`);
        setThreads(res.data || []);
      } catch (err) {
        console.error('Error fetching threads', err);
      }
    };
    fetch();
  }, [courseId]);

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Foro {courseId ? `- Curso ${courseId}` : ''}</h2>
      <ul className="space-y-2">
        {threads.map(t => (
          <li key={t.id} className="border p-3">
            <Link to={`/forums/thread/${t.id}`} className="text-blue-600 font-medium">{t.title}</Link>
            <div className="text-sm text-gray-600">Creado: {new Date(t.created_at).toLocaleString()}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
