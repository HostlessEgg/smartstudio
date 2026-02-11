# Integración de modales con datos reales

## Objetivo
Convertir los modales que eran solo UI en flujos completos (UI + API + backend + permisos), con persistencia real.

## Alcance de modales
- Perfil de usuario
- Nuevo mensaje
- Consentimiento (representantes)
- Asignar docentes a materias
- Previsualización de importación masiva

## Plan de implementación
1) **Contrato de API**
   - Perfil: `PUT /api/users/:id` (propio o admin)
   - Mensajes: `POST /api/messages`, `GET /api/messages/inbox`, `GET /api/messages/sent`, `POST /api/messages/:id/read`
   - Materias: `GET /api/subjects`, `POST /api/subjects`, `PUT /api/subjects/:id`, `DELETE /api/subjects/:id`
2) **Base de datos**
   - `subjects` (con `teachers` en JSON)
   - `messages` (sender/recipient/subject/body/read_at)
3) **Backend**
   - Crear endpoints y validaciones en server.js
   - Registrar auditoría con `logAudit`
4) **Frontend**
   - Conectar `ProfileModal` a `PUT /api/users/:id`
   - Conectar `NewMessageModal` a `POST /api/messages`
   - Conectar mensajería a `GET /api/messages/inbox`
   - Conectar asignación de docentes a `PUT /api/subjects/:id`
5) **Permisos**
   - Materias: solo admin
   - Perfil: usuario propio o admin
   - Mensajes: usuario autenticado

## Checklist de validación (flujo completo)
- [x] Perfil: editar nombre/ocupación/organización/avatar y persistir en BD
- [x] Perfil: refresca sesión con datos actualizados
- [x] Nuevo mensaje: envía a destinatario por email o ID
- [x] Mensajería: inbox muestra mensajes reales
- [x] Mensajes: errores de destinatario se reportan correctamente
- [x] Materias: admin crea/edita/borra materia
- [x] Materias: asignación de docentes guarda en BD
- [x] Importación: aplicar CSV desde modal de previsualización
- [x] Auditoría: acciones principales quedan registradas
- [x] Permisos: endpoints rechazan accesos no autorizados

## Última validación
- QA smoke API: 2026-02-10

## Nota
Este documento debe actualizarse si se agregan nuevos modales o flujos.
