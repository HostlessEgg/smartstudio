import React, { useState } from 'react';
import messagesSeed from '../../mock-data/messaging.json';

export default function MessagingComponent() {
  const [messages, setMessages] = useState(messagesSeed || []);
  const [text, setText] = useState('');

  const send = () => {
    if (!text.trim()) return;
    const next = [{ id: `m-${Date.now()}`, from: 'you', text: text.trim(), timestamp: new Date().toISOString() }, ...messages];
    setMessages(next);
    setText('');
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Mensajes</h2>
      <div className="mb-4">
        <div className="flex gap-2">
          <input value={text} onChange={e=>setText(e.target.value)} className="flex-1 p-2 border rounded" placeholder="Escribe un mensaje..." />
          <button onClick={send} className="px-3 py-2 bg-blue-600 text-white rounded">Enviar</button>
        </div>
      </div>

      <div className="space-y-3">
        {messages.map(m => (
          <div key={m.id} className="p-3 border rounded bg-gray-50">
            <div className="text-sm text-gray-600">{m.from} — {new Date(m.timestamp).toLocaleString()}</div>
            <div className="mt-1">{m.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
