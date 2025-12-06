# Pull Request: feat/representatives

Resumen
- Implementa soporte inicial para el rol Representante (DB, API, tests y UI mínima).

Cambios principales
- Migración: `database/migrations/20251128120000_create_representatives_tables.sql` (tables: `representatives`, `consents`, `representative_access_logs`).
- Backend: `backend/routes/representatives.js` (endpoints para solicitar, conceder/revocar consentimiento, listar requests, ver progreso como representante). Registro en `backend/server.js`.
- Tests: `backend/tests/representatives.test.js` (flujo integración).
- Frontend: `frontend/src/pages/RepresentativeDashboard.jsx` y ruta `/representative` en `frontend/src/App.jsx`.

Checklist (DoD)
- [ ] Migraciones incluidas y con rollback documentado (archivo en `/database/migrations`).
- [ ] Tests unit/integration pasan en CI (Jest).  
- [ ] UI mínima integrada y accesible desde header.  
- [ ] PR description y changelog actualizados.  
- [ ] Reviewer asignado (Tech Lead).

Comandos para probar localmente
1. Backend
```bash
cd backend
npm install
set -o allexport; source .env; set +o allexport
./scripts/run_migrations.sh
RATE_LIMITS_DISABLED=1 NODE_ENV=development node server.js
```

2. Frontend
```bash
cd frontend
npm install
npm run dev
```

Notas de seguridad y privacidad
- Todos los accesos por parte de representantes registran filas en `representative_access_logs` y en `audits`.  
- El estudiante debe conceder consentimiento explícito; la operación es revocable.

Testing adicional recomendado
- E2E UI: flujo solicitar → conceder → visualizar (Playwright/ Cypress).  
- Stress test para endpoints de consent y requests.
