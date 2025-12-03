import React, { useState } from 'react';
import mockApi from '../lib/mockApi';

export default function BulkImportPage(){
  const [fileName, setFileName] = useState(null);
  const [preview, setPreview] = useState([]);

  const onFile = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFileName(f.name);
    // mock preview: read first few lines
    const text = await f.text();
    const lines = text.split('\n').slice(0,10);
    setPreview(lines.map((l,i)=>({ line: i+1, text: l })));
  };

  const onSubmit = () => {
    // try to POST preview lines to mock import endpoint
    const payload = preview.map(p=>p.text);
    mockApi.importData(payload).then(r=>{
      alert(`Mock import result: ${r ? r.message : 'no server'}`);
    });
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Importación Masiva (CSV) - Mock</h2>
      <p className="text-sm text-gray-600 mb-4">Sube un CSV para previsualizar las primeras líneas antes de ejecutar la importación.</p>

      <div className="mb-4">
        <input type="file" accept=".csv" onChange={onFile} />
        {fileName && <div className="mt-2 text-sm">Archivo: {fileName}</div>}
      </div>

      {preview.length > 0 && (
        <div className="mb-4">
          <h3 className="font-medium">Previsualización (primeras 10 líneas)</h3>
          <pre className="bg-gray-100 p-2 mt-2 max-h-48 overflow-auto">
            {preview.map(p=>`${p.line}: ${p.text}\n`)}
          </pre>
        </div>
      )}

      <div>
        <button className="btn btn-primary mr-2" onClick={onSubmit}>Procesar import (mock)</button>
        <button className="btn" onClick={() => { setPreview([]); setFileName(null); }}>Limpiar</button>
      </div>
    </div>
  );
}
