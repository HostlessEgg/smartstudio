import React from 'react';

export default function CalendarIcalExport(){
  const url = window.location.origin + '/api/ical/feed?token=MOCK_TOKEN';

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Exportar Calendario (iCal)</h2>
      <p className="mb-4">Puedes copiar la URL del feed iCal para suscribirte desde tu calendario.</p>
      <div className="p-3 border rounded">
        <div className="mb-2 font-mono text-sm break-all">{url}</div>
        <div>
          <button className="btn btn-primary mr-2" onClick={() => { navigator.clipboard.writeText(url); alert('Copiado al portapapeles'); }}>Copiar URL</button>
          <a className="btn" href={url} download>Descargar iCal (mock)</a>
        </div>
      </div>
    </div>
  );
}
