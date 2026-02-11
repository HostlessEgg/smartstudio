# Plan de acción y matriz de trazabilidad (SMARTSTUDIO LMS)

Fecha: 2026-02-04

## Objetivo
Cerrar brechas entre requisitos funcionales y la implementación actual, asegurando cobertura end-to-end: API, BD, UI y pruebas.

---

## 1) Matriz de trazabilidad (actualizada)

| Requisito | Estado actual | Backend (API) | BD | UI | Pruebas | Prioridad |
|---|---|---|---|---|---|---|
| Usuarios y roles | Casi completo | CRUD + roles + bulk + CSV | OK | Parcial | Parcial | Alta |
| Cursos | Parcial | CRUD + estados | OK (versionado sin uso) | Parcial | Parcial | Alta |
| Contenidos | Parcial | Crear/leer dentro de cursos | OK | Parcial | Parcial | Alta |
| Inscripciones/cohortes | Parcial/Bueno | Enroll + CSV + cohortes | OK | Parcial | Parcial | Media |
| Evaluaciones | Parcial/Bueno | Quizzes + submissions | OK | Parcial | Parcial | Alta |

---

## 2) Roadmap por fases

### Fase 0 — Consolidación técnica (1–2 semanas)
- Elegir backend oficial: `backend/server.js` vs `backend/src/app.js`.
- Unificar configuración, middlewares y rutas.
- Documentar OpenAPI real (solo endpoints existentes).
 - Normalizar variables de entorno DB (DB_PASS vs DB_PASSWORD).
 - Backend oficial elegido: `backend/server.js` (2026-02-06).

### Fase 1 — MVP completo (3–4 semanas)
**Objetivo:** flujo funcional completo (usuarios + cursos + contenidos + inscripción + evaluación básica).
- Usuarios: desactivación individual, historial de creación/modificación.
- Cursos: estado publicado/archivado + validaciones de permisos.
- Contenidos: endpoints para reordenar módulos/lecciones.
- Inscripción: validaciones y reportes CSV.
- Evaluaciones: intentos máximos y feedback visible.
 - Seguridad: migrar sesión a cookies httpOnly + CSRF.

### Fase 2 — Beta (3–4 semanas)
**Objetivo:** completar cohortes y evaluación avanzada.
- Cohortes: listado/edición, reglas y cupos reales.
- Evaluaciones: rúbricas y tiempos límite.
- Recursos: carga de PDF/video y enlaces externos con control de acceso.

### Fase 3 — Completo (3–5 semanas)
**Objetivo:** robustez y extras.
- Versionado real de cursos con borrador/producción.
- SCORM y tracking avanzado.
- Reportes y métricas.

---

## 3) Backlog por épicas (actualizado)

### Épica A — Usuarios y roles
- Desactivar/reactivar individual.
- Historial de cambios en auditoría (creación/modificación).
- Alinear roles con requisitos (`Instructor/Estudiante`).

### Épica B — Cursos
- Versionado real (tabla `course_versions`).
- Reglas de publicación y visibilidad.

### Épica C — Contenidos
- Reordenado vía API.
- Recursos (PDF/URL/SCORM) y control de acceso.

### Épica D — Inscripciones y cohortes
- CRUD de cohortes completo.
- Importación CSV con reporte persistente.

### Épica E — Evaluaciones
- Intentos máximos.
- Límite de tiempo.
- Rúbricas para tareas.

### Épica F — Calidad
- Tests de API por módulo.
- Smoke tests UI.
 - Observabilidad básica (logs estructurados + métricas mínimas).

---

## 4) Criterios de cierre por módulo

- **Usuarios:** CRUD + roles + auditoría + desactivación individual.
- **Cursos:** CRUD + estados + versionado real.
- **Contenidos:** creación + orden real + acceso restringido.
- **Inscripciones:** individual + cohortes + CSV validado.
- **Evaluaciones:** quizzes completos + tareas con rúbrica.

---

## 5) Notas operativas
- Mantener matriz al cierre de cada sprint.
- Asegurar que cada endpoint tenga UI vinculada y pruebas mínimas.
