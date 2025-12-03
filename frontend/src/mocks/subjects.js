// Simplified subjects dataset derived from provided pensum tables
// Each entry represents a subject for a specific grade/year to keep AdminSubjects table simple

const subjects = [
  // Media Ciencias (Cuarto/Quinto)
  { id: 1, code: 'CAST', name: 'Castellano', grade: 'Cuarto', hours: 4, sections: 3 },
  { id: 2, code: 'CAST', name: 'Castellano', grade: 'Quinto', hours: 4, sections: 3 },
  { id: 3, code: 'ING', name: 'Inglés y otras lenguas', grade: 'Cuarto', hours: 6, sections: 3 },
  { id: 4, code: 'ING', name: 'Inglés y otras lenguas', grade: 'Quinto', hours: 4, sections: 3 },
  { id: 5, code: 'MAT', name: 'Matemática', grade: 'Cuarto', hours: 4, sections: 3 },
  { id: 6, code: 'MAT', name: 'Matemática', grade: 'Quinto', hours: 4, sections: 3 },
  { id: 7, code: 'PE', name: 'Educación Física', grade: 'Cuarto', hours: 6, sections: 3 },
  { id: 8, code: 'PE', name: 'Educación Física', grade: 'Quinto', hours: 6, sections: 3 },
  { id: 9, code: 'FIS', name: 'Física', grade: 'Cuarto', hours: 4, sections: 3 },
  { id: 10, code: 'FIS', name: 'Física', grade: 'Quinto', hours: 4, sections: 3 },
  { id: 11, code: 'QUIM', name: 'Química', grade: 'Cuarto', hours: 4, sections: 3 },
  { id: 12, code: 'QUIM', name: 'Química', grade: 'Quinto', hours: 4, sections: 3 },
  { id: 13, code: 'BIO', name: 'Biología', grade: 'Cuarto', hours: 4, sections: 3 },
  { id: 14, code: 'BIO', name: 'Biología', grade: 'Quinto', hours: 4, sections: 3 },
  { id: 15, code: 'GHC', name: 'Geografía, Historia y Ciudadanía', grade: 'Cuarto', hours: 4, sections: 3 },
  { id: 16, code: 'GHC', name: 'Geografía, Historia y Ciudadanía', grade: 'Quinto', hours: 4, sections: 3 },
  // Media General (Primero/Tercero subset)
  { id: 30, code: 'CAST', name: 'Castellano', grade: 'Primero', hours: 4, sections: 3 },
  { id: 31, code: 'ING', name: 'Inglés y otras lenguas', grade: 'Primero', hours: 6, sections: 3 },
  { id: 32, code: 'MAT', name: 'Matemática', grade: 'Primero', hours: 4, sections: 3 },
  { id: 33, code: 'PE', name: 'Educación Física', grade: 'Primero', hours: 6, sections: 3 },
  { id: 34, code: 'ART', name: 'Arte y Patrimonio', grade: 'Primero', hours: 4, sections: 3 },
  { id: 35, code: 'CN', name: 'Ciencias Naturales', grade: 'Primero', hours: 6, sections: 3 }
];

export default subjects;
