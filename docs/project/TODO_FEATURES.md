# TODO y Estado — smartstudio-lms

## Resumen rápido
Archivo maestro para seguir progreso de features críticos: representantes, consentimientos, auditoría y bulk admin.

---

## Política de ramas
- feat/<nombre>
- fix/<bug>
- chore/<docs>
- test/<suite>

---

## Prioridad inmediata (P0)
- [x] Crear migraciones: representatives, consents, representative_access_logs
- [x] Router backend: routes/representatives.js (endpoints mínimos)
- [x] Tests backend: backend/tests/representatives.test.js (Jest + supertest)
- [x] UI mínimo: frontend/src/pages/RepresentativeDashboard.jsx
- [x] Logging: registrar accesos de representantes en tabla audit

## Prioridad alta (P1)
- [x] Endpoints admin bulk: /admin/users/import, /admin/enrollments/bulk
- [ ] Previsualización de import CSV en UI admin
- [ ] Reglas de visibilidad para calendar endpoints

## Prioridad media (P2)
- [x] E2E: flujo solicitud → consentimiento → acceso (e2e_ui_test.sh)
- [x] Notificaciones y resúmenes configurables (email / toast)
- [x] Feature flags y rollout en staging

---

## Estado (actualizado 2026-02-06)
- Representantes: completo (migraciones + rutas + UI + tests).
- Bulk admin: endpoints listos; falta UI de previsualización.
- Notificaciones y feature flags: implementadas (backend + UI).

## DoR (Definition of Ready) — checklist mínima para historia
- Criterios de aceptación claros
- Migración SQL propuesta en /database/migrations
- Contratos API definidos (endpoints + payload)
- Tests esqueleto listos

## DoD (Definition of Done) — checklist mínima para merge
- Tests unit/integration pasan en CI
- Migraciones aplicadas y revisadas
- Documentación actualizada (este archivo)
- PR con reviewer aprobado

## Migraciones (convención)
- Archivo: /database/migrations/YYYYMMDDHHMMSS_descripción.sql
- Incluir rollback documentado si no es trivial

## Paso rápido para empezar (comandos)
1. Crear rama:
   git checkout -b feat/representatives
2. Implementar cambios y tests
3. Ejecutar migraciones local:
   chmod +x backend/scripts/run_migrations.sh
   ./backend/scripts/run_migrations.sh
4. Ejecutar tests:
   cd backend
   npm test

---

## Notas y rastreo
- Owner inicial: <tu usuario>
- Tech lead / reviewer: (asignar)
- Lugar para decisiones: actualizar este archivo con fechas y PRs