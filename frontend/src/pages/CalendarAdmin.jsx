import React, { useState } from 'react';
import eventsSeed from '../../mock-data/calendar_events.json';
import Modal from '../components/ui/Modal';
import { useToast } from '../contexts/ToastContext';

export default function CalendarAdmin(){
  const [events, setEvents] = useState(eventsSeed || []);
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState({ title: '', date: '' });
  const { addToast } = useToast();

  const openAdd = () => {
    setDraft({ title: '', date: '' });
    setModalOpen(true);
  };

  const addEvent = () => {
    if (!draft.title.trim() || !draft.date.trim()) {
      addToast('Completa título y fecha', { type: 'error' });
      return;
    }
    const next = [{ id: `e-${Date.now()}`, title: draft.title.trim(), date: draft.date.trim() }, ...events];
    setEvents(next);
    setModalOpen(false);
  };

  return (
    <div className="page">
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 className="section-title">Administración de Calendario</h2>
            <p className="section-subtitle">Eventos generales y fechas clave.</p>
          </div>
          <button onClick={openAdd} className="btn-primary">Agregar Evento</button>
        </div>
        <div style={{ display: 'grid', gap: 8, marginTop: 16 }}>
          {events.map(ev => (
            <div key={ev.id} className="card" style={{ padding: 12 }}>
              <div style={{ fontWeight: 600 }}>{ev.title}</div>
              <div className="muted" style={{ fontSize: 12 }}>{ev.date}</div>
            </div>
          ))}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo evento" ariaLabel="Crear evento">
        <div style={{ display: 'grid', gap: 12 }}>
          <label className="label">Título
            <input className="input" value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} placeholder="Título del evento" />
          </label>
          <label className="label">Fecha (YYYY-MM-DD)
            <input className="input" value={draft.date} onChange={e => setDraft({ ...draft, date: e.target.value })} placeholder="2026-02-10" />
          </label>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn-primary" onClick={addEvent}>Crear</button>
            <button className="btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
