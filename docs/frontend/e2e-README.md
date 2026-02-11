# E2E local — Instrucciones rápidas

Propósito: arrancar el Mock Server y el Dev Server (Vite) localmente para ejecutar las pruebas E2E con Playwright y para ejecutar los tests unitarios (Vitest).

## Requisitos
- Node.js (recomiendo v18 LTS) y `npm`.
- (Primera vez) instalar dependencias en `frontend` con `npm ci`.
- (Solo si usas Playwright) instalar navegadores: `npx playwright install --with-deps`.

## Puertos por defecto
- Mock server: `4000` (puedes cambiarlo con `MOCK_PORT`).
- Vite dev server: `3000` (puedes pasar `--port 3000` al arrancar).

## Comandos rápidos

### 1) Instalar deps (una vez)
```bash
cd frontend
npm ci
npx playwright install --with-deps   # solo si ejecutarás Playwright
```

### 2) Arrancar el Mock Server (en background; logs en `/tmp/mock-server.log`)
```bash
cd frontend
# arranca en puerto 4000 por defecto
nohup node mock-server.cjs > /tmp/mock-server.log 2>&1 & echo $! > /tmp/mock-server.pid
# ver logs
tail -f /tmp/mock-server.log
```
Si prefieres no usar `nohup` (por ejemplo en Windows), ejecuta `node mock-server.cjs` en una terminal separada.

### 3) Arrancar Vite (dev server)
```bash
cd frontend
# modo por defecto (puerto 3000) o especificar puerto
npm run dev
# o especificando puerto
npm run dev -- --port 3000
```

### 4) Ejecutar tests unitarios (Vitest)
```bash
cd frontend
npm test
# o para ejecución solo una vez:
npx vitest run
```

### 5) Ejecutar Playwright E2E
Asegúrate de que Vite y el Mock Server estén corriendo. Por defecto las pruebas usan `BASE_URL=http://localhost:3000`.

```bash
cd frontend
# Ejecución normal (headless)
BASE_URL=http://localhost:3000 npm run test:e2e

# Ejecución en modo headed (visible)
BASE_URL=http://localhost:3000 npm run test:e2e:headed
```

Ver reporte HTML generado por Playwright:
```bash
npx playwright show-report e2e/playwright-report
```

## Variables útiles
- `BASE_URL` — URL donde corre la app (ej. `http://localhost:3000`).
- `MOCK_PORT` — puerto para el mock server (ej. `MOCK_PORT=4001 node mock-server.cjs`).

## Sugerencias
- Si vas a ejecutar en CI, asegúrate de instalar navegadores (`npx playwright install --with-deps`) y de exponer los puertos correctamente.
- Si Vite no arranca en el puerto esperado, verifica `vite.config.js` o pasa `--port` explícito.

## Script automatizado: `frontend/scripts/run-e2e.sh`

Hay un script que automatiza el arranque del Mock Server y Vite, espera que estén disponibles y ejecuta Playwright E2E.

Uso rápido:

```bash
# ejecuta y detiene los servidores que arranque el script al terminar
./frontend/scripts/run-e2e.sh

# no parar los servidores al terminar (útil para depuración)
./frontend/scripts/run-e2e.sh --keep
```

El script guarda PIDs temporales en `/tmp/run-e2e-*.pid` y logs en `/tmp/mock-server.log` y `/tmp/vite-dev.log`.
Playwright E2E smoke tests

Quick start:

1. From `frontend` install the Playwright test runner:

```bash
# from frontend/
npm install -D @playwright/test
# then install browsers (Chromium recommended for CI):
npx playwright install chromium
```

2. Run the dev server and mock server locally:

```bash
# in frontend/
npm run dev
# in another terminal (ensure mock server is running at :4000):
node mock-server.cjs
```

3. Run the smoke tests:

```bash
# from frontend/
npm run test:e2e
```

Notes:
- The tests assume the frontend is available at `http://localhost:3000` (Playwright `baseURL`).
- If you prefer to run the tests headed (visible browser), use `npm run test:e2e:headed`.
- The tests produce an HTML report in `frontend/playwright-report`.
