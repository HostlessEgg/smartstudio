import React, { useState } from 'react';
import eventsSeed from '../../mock-data/calendar_events.json';

export default function CalendarAdmin(){
  const [events, setEvents] = useState(eventsSeed || []);

  const addEvent = () => {
    const title = prompt('Título del evento:');
    if (!title) return;
    const date = prompt('Fecha (YYYY-MM-DD):');
    const next = [{ id: `e-${Date.now()}`, title, date }, ...events];
    setEvents(next);
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Administración de Calendario</h2>
      <div className="mb-4">
        <button onClick={addEvent} className="px-3 py-2 bg-indigo-600 text-white rounded">Agregar Evento</button>
      </div>
      <div className="space-y-2">
        {events.map(ev => (
          <div key={ev.id} className="p-3 border rounded">
            <div className="font-semibold">{ev.title}</div>
            <div className="text-sm text-gray-600">{ev.date}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
