import React, { useEffect, useMemo, useState } from 'react';
import api from '../lib/api';

export default function AttendancePage() {
  const [month, setMonth] = useState('');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ totalAssignments: 0, submittedCount: 0, pendingCount: 0, attendancePercent: 0 });
  const [days, setDays] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const monthOptions = useMemo(() => {
    const now = new Date();
    const options = [];
    for (let i = 0; i < 3; i += 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('es-VE', { month: 'long', year: 'numeric' });
      options.push({ value, label });
    }
    return options;
  }, []);

  useEffect(() => {
    if (!month && monthOptions.length) setMonth(monthOptions[0].value);
  }, [monthOptions, month]);

  useEffect(() => {
    if (!month) return;
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get('/attendance', { params: { month } });
        if (mounted) {
          setSummary(res.data?.summary || { totalAssignments: 0, submittedCount: 0, pendingCount: 0, attendancePercent: 0 });
          setDays(res.data?.days || []);
          setSubjects(res.data?.subjects || []);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [month]);

  const calendarCells = useMemo(() => {
    if (!month) return [];
    const [year, monthNum] = month.split('-').map(Number);
    const firstDay = new Date(year, monthNum - 1, 1);
    const startWeekday = (firstDay.getDay() + 6) % 7; // Monday=0
    const totalDays = new Date(year, monthNum, 0).getDate();
    const map = new Map(days.map(d => [d.day, d.status]));
    const cells = [];
    for (let i = 0; i < startWeekday; i += 1) cells.push({ empty: true, key: `e-${i}` });
    for (let d = 1; d <= totalDays; d += 1) {
      cells.push({
        day: d,
        status: map.get(d) || 'none',
        key: `d-${d}`
      });
    }
    return cells;
  }, [month, days]);

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getDate()}`;
  return (
    <div className="page">
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 className="section-title">Asistencia</h2>
            <p className="section-subtitle">Resumen y detalle de asistencia por materia.</p>
          </div>
          <span className="pill">Control</span>
        </div>

        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <select className="input" value={month} onChange={(e) => setMonth(e.target.value)} style={{ minWidth: 220 }}>
            {monthOptions.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <span className="pill">{summary.attendancePercent}% asistencia</span>
        </div>

        <div className="cards-grid" style={{ marginTop: 16 }}>
          <div className="card" style={{ padding: 16, border: '1px solid var(--border)', boxShadow: 'none' }}>
            <div style={{ fontWeight: 600 }}>Asistencia general</div>
            <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>{summary.attendancePercent}%</div>
            <div className="muted" style={{ fontSize: 12 }}>Entregas vs tareas</div>
          </div>
          <div className="card" style={{ padding: 16, border: '1px solid var(--border)', boxShadow: 'none' }}>
            <div style={{ fontWeight: 600 }}>Entregas</div>
            <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>{summary.submittedCount}</div>
            <div className="muted" style={{ fontSize: 12 }}>Periodo actual</div>
          </div>
          <div className="card" style={{ padding: 16, border: '1px solid var(--border)', boxShadow: 'none' }}>
            <div style={{ fontWeight: 600 }}>Pendientes</div>
            <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>{summary.pendingCount}</div>
            <div className="muted" style={{ fontSize: 12 }}>Periodo actual</div>
          </div>
        </div>

        <div className="card" style={{ padding: 16, marginTop: 16 }}>
          <div className="card-header">
            <div className="card-title">Control mensual</div>
            <div className="muted" style={{ fontSize: 12 }}>Basado en entregas de tareas</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginTop: 12 }}>
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
              <div key={d} className="muted" style={{ fontSize: 12, textAlign: 'center' }}>{d}</div>
            ))}
            {calendarCells.map(cell => {
              if (cell.empty) return <div key={cell.key} />;
              const status = cell.status;
              const isToday = `${month}-${cell.day}` === todayKey;
              const background = status === 'present'
                ? 'rgba(52, 199, 89, 0.2)'
                : status === 'event'
                  ? 'rgba(255, 149, 0, 0.2)'
                  : 'transparent';
              const border = isToday ? '2px solid var(--primary)' : '1px solid var(--border)';
              return (
                <div
                  key={cell.key}
                  style={{
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                    background,
                    border
                  }}
                >
                  {cell.day}
                </div>
              );
            })}
          </div>
        </div>

        <div className="cards-grid" style={{ marginTop: 16 }}>
          <div className="card" style={{ padding: 16, border: '1px solid var(--border)', boxShadow: 'none' }}>
            <div className="card-header">
              <div className="card-title">Por materia</div>
              <i className="ri-book-2-line" style={{ color: 'var(--primary)' }}></i>
            </div>
            {loading && <div className="muted">Cargando materias...</div>}
            {!loading && subjects.length === 0 && <div className="muted">Sin datos por materia.</div>}
            <div style={{ display: 'grid', gap: 10 }}>
              {subjects.map(s => (
                <div key={s.subject} className="progress-item">
                  <div className="progress-info">
                    <span>{s.subject}</span>
                    <span>{s.percent}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${s.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
