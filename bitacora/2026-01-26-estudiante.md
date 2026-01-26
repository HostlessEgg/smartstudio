# Fecha: 2026-01-26

## Resumen
- Rol Estudiante: lista de tareas pendientes/entregadas y vista real de entregas.

## Cambios técnicos
- Backend:
  - `GET /api/my/assignments`: tareas del estudiante con estado de entrega y metadatos de materia/grado.
  - `GET /api/my/submissions`: entregas del estudiante (opcional filtro assignment_id).
- Frontend:
  - Nueva página `StudentAssignments` con filtros (all/pending/submitted), búsqueda y formulario de entrega (texto + URL opcional).
  - `MySubmissionsPage` ahora usa la API real y muestra estado/calificación.
  - Rutas y header para `/student/assignments` y enlace a `/my/submissions`.

## Pruebas
- Pendiente correr suite E2E/CI tras estos cambios (backend y frontend compilando localmente con Vite).

## Pendientes / Riesgos
- Confirmar que los usuarios estudiantes tienen `grade_id` (si no, devuelve todas las tareas).
- Agregar subida de archivos real (presign /api/uploads) y vista de feedback más rica.

## Próximos pasos
- Ejecutar Playwright/Vitest para validar regresiones.
- Añadir vista de calificaciones/resumen y progreso por curso.
