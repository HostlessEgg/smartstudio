# SMARTSTUDIO LMS

Sistema de Gestión de Aprendizaje desarrollado con React, Node.js y MySQL.

## 🚀ma

### Prerrequisitos
- Node.js 16+
- MySQL 8.0+
- npm o yarn

### 1. Configurar Base de Datos
```bash
mysql -u root -p < database/schema.sql
```

### 2. Configurar variables de entorno (backend)
- Copiar y completar: `backend/.env.example` → `backend/.env`
- Variables estándar: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`
- Si usas cookies httpOnly, configura `CORS_ORIGIN` (ej. `http://localhost:3000`).

Backend oficial: `backend/server.js`

Requisitos funcionales principales: `REQUIREMENTS.md`.