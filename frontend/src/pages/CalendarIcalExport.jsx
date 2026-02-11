import React from 'react';
import Button from '../components/ui/Button';
import { useToast } from '../contexts/ToastContext';

export default function CalendarIcalExport(){
  const url = window.location.origin + '/api/ical/feed?token=TOKEN_DEMO';
  const { addToast } = useToast();

  return (
    <div className="page">
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 className="section-title">Exportar calendario (iCal)</h2>
            <p className="section-subtitle">Copia la URL del feed iCal o descárgalo.</p>
          </div>
          <span className="pill">Calendario</span>
        </div>

        <div className="card" style={{ marginTop: 16, padding: 16, border: '1px solid var(--border)', boxShadow: 'none' }}>
          <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace', fontSize: 12, wordBreak: 'break-all' }}>{url}</div>
          <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(url);
                addToast('Copiado al portapapeles', { type: 'success' });
              }}
            >
              Copiar URL
            </Button>
            <a href={url} download>
              <Button variant="secondary">Descargar iCal</Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
