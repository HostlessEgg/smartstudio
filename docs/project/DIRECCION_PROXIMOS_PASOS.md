# Dirección y próximos pasos (LMS)

Fecha: 2026-02-06

## Reflexión breve
El producto es funcional y amplio, pero la deuda estructural y la desalineación entre documentación y código aumentan el riesgo operacional. La prioridad debe ser estabilizar la arquitectura, normalizar configuración y cerrar brechas de seguridad del cliente. Sin eso, cualquier nuevo feature incrementa costos y retrabajo.

## Dirección recomendada (3 fases)

### Fase 1 — Estabilidad (2–3 semanas)
- Unificar backend: elegir `src/` o monolito y eliminar duplicidad.
- Normalizar variables de entorno (DB, JWT, storage).
- Pool de conexiones DB en el backend único.

**Entregables**
- Backend consolidado (sin rutas duplicadas).
- Configuración estándar documentada.
- Pruebas básicas verdes.

### Fase 2 — Seguridad y calidad (2 semanas)
- Migrar auth a cookies httpOnly + CSRF.
- Validación centralizada de payloads (schema).
- Límites y validación de uploads.

**Entregables**
- Auth endurecido (sin `localStorage`).
- Validaciones comunes reutilizables.
- Uploads seguros.

### Fase 3 — Mantenibilidad y observabilidad (2 semanas)
- Separar controllers/services/repositorios.
- Logging estructurado y métricas básicas.
- Tests por rol y flujos críticos.

**Entregables**
- Arquitectura limpia y modular.
- Observabilidad mínima viable.
- Cobertura crítica de pruebas.

## Criterios de “listo para avanzar”
- Backend unificado, sin rutas duplicadas.
- Configuración documentada y validada.
- Auth segura (sin `localStorage`).
- Tests verdes para flujos críticos LMS.

## Siguientes pasos inmediatos
1) Seleccionar backend oficial (`backend/server.js` o `backend/src/app.js`).
2) Definir plan de migración de rutas y middlewares.
3) Normalizar variables de entorno y actualizar documentación.
