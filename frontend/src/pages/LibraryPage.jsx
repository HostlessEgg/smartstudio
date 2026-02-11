import React, { useEffect, useState } from 'react';
import Button from '../components/ui/Button';
import api from '../lib/api';

export default function LibraryPage() {
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [books, setBooks] = useState([]);

  const load = async (query = '') => {
    setLoading(true);
    try {
      const res = await api.get('/library', { params: { q: query } });
      setBooks(res.data?.books || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load('');
  }, []);
  return (
    <div className="page">
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 className="section-title">Biblioteca digital</h2>
            <p className="section-subtitle">Libros y referencias académicas.</p>
          </div>
          <span className="pill">Biblioteca</span>
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input className="input" placeholder="Buscar libro o autor" style={{ flex: 1, minWidth: 220 }} value={q} onChange={(e) => setQ(e.target.value)} />
          <Button variant="secondary" onClick={() => load(q)}>Buscar</Button>
        </div>

        <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
          {loading && <div className="muted">Cargando biblioteca...</div>}
          {!loading && books.length === 0 && <div className="muted">Sin resultados.</div>}
          {books.map(book => (
            <div key={book.id} className="card" style={{ padding: 16, border: '1px solid var(--border)', boxShadow: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{book.title}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{book.author || 'Autor desconocido'}</div>
                </div>
                <span className={`badge ${book.status === 'Disponible' ? 'badge-success' : book.status === 'Reservado' ? 'badge-warning' : 'badge-danger'}`}>{book.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
