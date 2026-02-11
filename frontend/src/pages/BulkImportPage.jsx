import React, { useState } from 'react';
import api from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import Button from '../components/ui/Button';

export default function BulkImportPage(){
  const [fileName, setFileName] = useState(null);
  const [fileText, setFileText] = useState('');
  const [preview, setPreview] = useState([]);
  const [report, setReport] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [importType, setImportType] = useState('users');
  const { addToast } = useToast();

  const onFile = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFileName(f.name);
    // preview: read first few lines
    const text = await f.text();
    setFileText(text);
    const lines = text.split('\n').slice(0,10);
    setPreview(lines.map((l,i)=>({ line: i+1, text: l })));
    setReport(null);
  };

  const onSubmit = async () => {
    if (!fileName || !fileText) {
      addToast('Selecciona un CSV primero', { type: 'error' });
      return;
    }
    setUploading(true);
    try {
      const csv = fileText;
      const endpoint = importType === 'users' ? '/admin/import/users' : '/admin/enrollments/bulk';
      const res = await api.post(endpoint, { csv });
      const rep = res.data?.report;
      setReport(rep || null);
      addToast(res.data?.message || 'Importación completada', { type: 'success' });
    } catch (e) {
      // toast via interceptor
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="page">
      <div className="card" style={{ padding: 24 }}>
        <div>
          <h2 className="section-title">Importación Masiva (CSV)</h2>
          <p className="section-subtitle">Previsualiza las primeras líneas antes de importar.</p>
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button
            type="button"
            variant={importType === 'users' ? 'primary' : 'ghost'}
            onClick={() => { setImportType('users'); setReport(null); }}
          >
            Usuarios
          </Button>
          <Button
            type="button"
            variant={importType === 'enrollments' ? 'primary' : 'ghost'}
            onClick={() => { setImportType('enrollments'); setReport(null); }}
          >
            Inscripciones
          </Button>
        </div>

        <div className="card-muted" style={{ marginTop: 12, padding: 12, border: '1px solid var(--border)' }}>
          {importType === 'users' ? (
            <div className="text-sm">
              CSV esperado: <strong>name,email,role,password</strong>. Role permitido: student, teacher, admin, guest.
            </div>
          ) : (
            <div className="text-sm">
              CSV esperado: <strong>student_id,course_id,student_email</strong>. Puedes usar student_id o student_email.
            </div>
          )}
        </div>

        <div style={{ marginTop: 16 }}>
          <input type="file" accept=".csv" onChange={onFile} className="input" />
          {fileName && <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>Archivo: {fileName}</div>}
        </div>

        {preview.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <h3 style={{ fontWeight: 600 }}>Previsualización (primeras 10 líneas)</h3>
            <pre className="card-muted" style={{ padding: 12, marginTop: 8, maxHeight: 200, overflow: 'auto', border: '1px solid var(--border)' }}>
              {preview.map(p=>`${p.line}: ${p.text}\n`)}
            </pre>
          </div>
        )}

        <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button onClick={onSubmit} disabled={uploading}>{uploading ? 'Procesando...' : 'Procesar importación'}</Button>
          <Button variant="ghost" onClick={() => { setPreview([]); setFileName(null); setFileText(''); }}>Limpiar</Button>
        </div>

        {report && (
          <div style={{ marginTop: 16 }}>
            <h3 style={{ fontWeight: 600 }}>Resultado</h3>
            <div className="card-muted" style={{ marginTop: 8, padding: 12, border: '1px solid var(--border)' }}>
              <div>Importados: {report.imported || 0}</div>
              <div>Saltados: {report.skipped || 0}</div>
              {report.errors && report.errors.length > 0 && (
                <pre style={{ marginTop: 8, whiteSpace: 'pre-wrap', fontSize: 12 }}>{JSON.stringify(report.errors, null, 2)}</pre>
              )}
              {report.temp_passwords && report.temp_passwords.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontWeight: 600 }}>Contraseñas temporales</div>
                  <pre style={{ marginTop: 6, whiteSpace: 'pre-wrap', fontSize: 12 }}>{JSON.stringify(report.temp_passwords, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
