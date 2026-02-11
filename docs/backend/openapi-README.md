# OpenAPI (Fase 2) — SmartStudio LMS

Este directorio contiene el stub OpenAPI para empezar la Fase 2: completar los contratos de API críticos.

Archivos:

- `openapi.yaml` — especificación OpenAPI 3.0 mínima con endpoints iniciales.

Validación y visualización (recomendado):

- Validar usando `swagger-cli`:

```bash
npx @apidevtools/swagger-cli validate backend/openapi.yaml
```

- Servir documentación rápida con `redoc-cli`:

```bash
npx redoc-cli serve backend/openapi.yaml
```

Generación de código (opcional):

- Para generar un servidor o cliente, usar `openapi-generator` (requiere Java):

```bash
openapi-generator-cli generate -i backend/openapi.yaml -g nodejs-express-server -o backend/openapi-server
```

Siguientes pasos recomendados para Fase 2:

- Expandir `openapi.yaml` con rutas faltantes y modelos completos.
- Alinear los nombres y shape con las respuestas reales del `backend/server.js`.
- Añadir tests de contract (p.ej. `dredd` o `schemathesis`).
