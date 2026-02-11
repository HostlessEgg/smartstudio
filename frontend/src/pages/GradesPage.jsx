import React, { useEffect, useMemo, useState } from 'react';
import api from '../lib/api';

const PERIODS = [
  { id: 'lapso1', label: '1er Lapso', startMonth: 1, endMonth: 4 },
  { id: 'lapso2', label: '2do Lapso', startMonth: 5, endMonth: 8 },
  { id: 'lapso3', label: '3er Lapso', startMonth: 9, endMonth: 12 }
];

export default function GradesPage() {
  const [period, setPeriod] = useState('lapso1');
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get('/my/assignments');
        if (mounted) setAssignments(res.data || []);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const gradesBySubject = useMemo(() => {
    const subjects = new Map();
    const getPeriodId = (dateStr) => {
      if (!dateStr) return null;
      const dt = new Date(dateStr);
      if (Number.isNaN(dt.getTime())) return null;
      const month = dt.getMonth() + 1;
      return PERIODS.find(p => month >= p.startMonth && month <= p.endMonth)?.id || null;
    };

    assignments.forEach(a => {
      const subject = a.subject_name || 'Sin materia';
      const periodId = getPeriodId(a.start_at) || 'lapso1';
      const score = a.score !== null && typeof a.score !== 'undefined' ? Number(a.score) : null;
      if (!subjects.has(subject)) {
        subjects.set(subject, { subject, lapso1: [], lapso2: [], lapso3: [] });
      }
      if (score !== null && Number.isFinite(score)) {
        subjects.get(subject)[periodId].push(score);
      }
    });

    return Array.from(subjects.values()).map(s => {
      const avg = (arr) => arr.length ? arr.reduce((acc, n) => acc + n, 0) / arr.length : null;
      const l1 = avg(s.lapso1);
      const l2 = avg(s.lapso2);
      const l3 = avg(s.lapso3);
      const all = [l1, l2, l3].filter(v => v !== null);
      const definitive = all.length ? all.reduce((acc, n) => acc + n, 0) / all.length : null;
      return {
        subject: s.subject,
        lapso1: l1,
        lapso2: l2,
        lapso3: l3,
        definitive
      };
    });
  }, [assignments]);

  const filteredSubjects = useMemo(() => {
    if (period === 'all') return gradesBySubject;
    return gradesBySubject.filter(s => {
      const val = s[period];
      return val !== null && typeof val !== 'undefined';
    });
  }, [gradesBySubject, period]);

  const summary = useMemo(() => {
    const definitives = gradesBySubject.map(s => s.definitive).filter(v => v !== null);
    const average = definitives.length ? definitives.reduce((acc, n) => acc + n, 0) / definitives.length : 0;
    const approved = definitives.filter(v => v >= 10).length;
    return {
      average: Number.isFinite(average) ? Number(average.toFixed(1)) : 0,
      subjects: gradesBySubject.length,
      approved
    };
  }, [gradesBySubject]);

  const exportCsv = () => {
    const rows = [
      ['Asignatura', '1er Lapso', '2do Lapso', '3er Lapso', 'Definitiva']
    ];
    gradesBySubject.forEach(s => {
      rows.push([
        s.subject,
        s.lapso1?.toFixed(1) ?? '-',
        s.lapso2?.toFixed(1) ?? '-',
        s.lapso3?.toFixed(1) ?? '-',
        s.definitive?.toFixed(1) ?? '-'
      ]);
    });
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'calificaciones.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  return (
    <div className="page">
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 className="section-title">Calificaciones</h2>
            <p className="section-subtitle">Resumen académico por materia y periodo.</p>
          </div>
          <span className="pill">Estudiante</span>
        </div>

        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <select className="input" value={period} onChange={(e) => setPeriod(e.target.value)} style={{ minWidth: 180 }}>
            <option value="lapso1">1er Lapso</option>
            <option value="lapso2">2do Lapso</option>
            <option value="lapso3">3er Lapso</option>
            <option value="all">Todos</option>
          </select>
          <button className="btn btn-outline" type="button" onClick={exportCsv}>
            <i className="ri-download-line"></i>
            Exportar
          </button>
        </div>

        <div className="cards-grid" style={{ marginTop: 16 }}>
          <div className="card" style={{ padding: 16, border: '1px solid var(--border)', boxShadow: 'none' }}>
            <div style={{ fontWeight: 600 }}>Promedio general</div>
            <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>{summary.average}</div>
            <div className="muted" style={{ fontSize: 12 }}>Escala 1-20</div>
          </div>
          <div className="card" style={{ padding: 16, border: '1px solid var(--border)', boxShadow: 'none' }}>
            <div style={{ fontWeight: 600 }}>Materias aprobadas</div>
            <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>{summary.approved} / {summary.subjects}</div>
            <div className="muted" style={{ fontSize: 12 }}>Periodo actual</div>
          </div>
          <div className="card" style={{ padding: 16, border: '1px solid var(--border)', boxShadow: 'none' }}>
            <div style={{ fontWeight: 600 }}>Mejor nota</div>
            <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>
              {gradesBySubject.reduce((acc, cur) => (cur.definitive !== null && cur.definitive > acc ? cur.definitive : acc), 0) || 0}
            </div>
            <div className="muted" style={{ fontSize: 12 }}>Definitiva</div>
          </div>
        </div>

        <div className="table-container" style={{ marginTop: 16 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Materia</th>
                <th>Periodo</th>
                <th>Nota</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={5} className="muted">Cargando calificaciones...</td></tr>
              )}
              {!loading && filteredSubjects.length === 0 && (
                <tr><td colSpan={5} className="muted">Sin calificaciones registradas.</td></tr>
              )}
              {filteredSubjects.map((g, i) => (
                <tr key={`${g.subject}-${i}`}>
                  <td style={{ fontWeight: 600 }}>{g.subject}</td>
                  <td className="muted">{g.lapso1 !== null ? g.lapso1.toFixed(1) : '-'}</td>
                  <td className="muted">{g.lapso2 !== null ? g.lapso2.toFixed(1) : '-'}</td>
                  <td className="muted">{g.lapso3 !== null ? g.lapso3.toFixed(1) : '-'}</td>
                  <td>
                    <span className={`badge ${g.definitive !== null && g.definitive >= 10 ? 'badge-success' : 'badge-warning'}`}>
                      {g.definitive !== null ? g.definitive.toFixed(1) : 'N/D'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
