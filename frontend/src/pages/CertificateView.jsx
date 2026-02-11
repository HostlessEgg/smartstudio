import React, { useEffect, useState } from 'react';
import mockApi from '../lib/mockApi';
import Button from '../components/ui/Button';

export default function CertificateView({ search }){
  // expects query params like ?student=Student%20Alpha&course=course-101
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams(search);
  const student = params.get('student') || 'Alumno Demo';
  const courseId = params.get('course') || 'course-101';
  const [course, setCourse] = useState(null);

  useEffect(()=>{
    mockApi.getCourseStructure().then(c => {
      if (!c) return;
      if (c.courseId === courseId) setCourse(c);
      else setCourse(c); // fallback
    });
  },[courseId]);

  const print = () => window.print();

  return (
    <div className="page">
      <div className="card" style={{ padding: 32, maxWidth: 720, margin: '0 auto' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 className="section-title">Certificado de finalización</h1>
          <p className="section-subtitle">SmartStudio</p>
        </div>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <div className="muted">Otorgado a</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>{student}</div>
          <div className="muted" style={{ marginTop: 12 }}>Por completar el curso</div>
          <div style={{ fontWeight: 600, marginTop: 6 }}>{course ? course.title : 'Curso Demo'}</div>
        </div>

        <div style={{ marginTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div className="muted">Fecha: {new Date().toLocaleDateString()}</div>
          <Button onClick={print}>Imprimir / Descargar</Button>
        </div>
      </div>
    </div>
  );
}
