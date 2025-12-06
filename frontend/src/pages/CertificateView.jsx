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
    <div className="container mx-auto p-6 max-w-2xl border rounded bg-white">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">Certificado de Finalización</h1>
        <p className="text-sm text-gray-600">SmartStudio</p>
      </div>

      <div className="mb-6 text-center">
        <p>Otorgado a</p>
        <div className="text-xl font-semibold">{student}</div>
        <p className="mt-3">Por completar el curso</p>
        <div className="font-medium">{course ? course.title : 'Curso Demo'}</div>
      </div>

      <div className="flex justify-between items-center mt-8">
        <div className="text-sm text-gray-600">Fecha: {new Date().toLocaleDateString()}</div>
        <div>
          <Button className="bg-blue-600 text-white" onClick={print}>Imprimir / Descargar</Button>
        </div>
      </div>
    </div>
  );
}
