### Resumen ejecutivo
Organizo los **requisitos funcionales** del core del LMS por **rol** (estudiante, instructor, representante, administrador, invitado). Para cada rol incluyo: **funcionalidades**, **permisos**, **notificaciones relevantes**, **endpoints API clave** y **consideraciones de privacidad/UX**. También nombro el **calendario** como componente ya implementado y cómo interactúan los roles con él.

---

### Mapa rápido de responsabilidades por rol
| **Rol** | **Acceso a contenido** | **Evaluaciones** | **Gestión / Administración** | **Notificaciones** |
|---|---:|---:|---:|---:|
| **Estudiante** | Ver cursos, lecciones, recursos | Realizar cuestionarios y tareas; ver calificaciones | — | Entrega, calificación, recordatorios |
| **Instructor** | Crear/editar cursos y recursos | Crear evaluaciones; calificar entregas | Gestionar cohortes y progreso | Entrega para calificar; inscripciones |
| **Representante** | Monitoreo limitado del representado | Ver resultados y progreso; no entregar | Solicitar reportes; comunicación con instructor | Alertas de progreso, ausencias, calificaciones |
| **Administrador** | Acceso total de lectura/escritura | Configurar políticas de evaluación | Carga masiva de inscripciones; actualizar calendario | Notificaciones masivas; webhooks |
| **Invitado** | Acceso público limitado | No | No | Opcional: invitación a eventos |

---

### Estudiante — funcionalidades y permisos
**Objetivo:** consumir contenido, completar actividades y seguir su progreso.

- **Acceso y navegación**
  - Ver lista de cursos inscritos; explorar catálogo público.
  - Acceder a módulos, lecciones y recursos (video, PDF, SCORM).
- **Evaluaciones y entregas**
  - Realizar cuestionarios autoevaluables; enviar tareas con archivos.
  - Ver retroalimentación y calificaciones; solicitar revisión.
- **Progreso y certificados**
  - Visualizar progreso por lección y módulo; recibir badge/certificado al completar.
- **Interacción**
  - Foros y comentarios por lección; mensajería con instructor.
- **Notificaciones**
  - Recordatorios de fechas límite; avisos de calificación; mensajes del instructor.
- **Permisos**
  - CRUD propio perfil; solo lectura sobre cursos no inscritos.
- **API relevantes**
  - `GET /courses/:id`, `POST /courses/:id/enroll`, `POST /assessments/:id/submit`, `GET /users/:id/progress`.
- **Privacidad / UX**
  - Consentimiento para compartir datos con representantes; historial de actividad visible solo según permisos.

---

### Instructor — funcionalidades y permisos
**Objetivo:** diseñar y entregar cursos, evaluar estudiantes y monitorear cohortes.

- **Creación y edición**
  - CRUD de cursos, módulos, lecciones y recursos; versionado y estados (borrador/publicado).
- **Evaluaciones**
  - Crear cuestionarios y tareas; definir rubricas; configurar auto-corrección.
  - Acceso a bandeja de entregas para calificación manual y feedback.
- **Gestión de estudiantes**
  - Ver lista de inscritos por cohorte; reasignar estudiantes; comunicar por curso.
- **Reportes y analíticas**
  - Panel de progreso por estudiante/cohorte; exportar CSV de calificaciones.
- **Notificaciones**
  - Recibir alertas de entregas pendientes; enviar anuncios a cohortes.
- **Permisos**
  - Editar solo cursos donde es instructor o co-instructor; ver datos de sus estudiantes.
- **API relevantes**
  - `POST /courses`, `PATCH /courses/:id`, `GET /assessments/:id/submissions`, `GET /courses/:id/progress`.
- **Consideraciones**
  - Control de versiones para evitar pérdida de contenido; logs de cambios.

---

### Representante — funcionalidades y permisos (nuevo)
**Objetivo:** monitorear el progreso y desempeño de un representado (estudiante) con permisos restringidos.

- **Acceso y alcance**
  - **Ver solo** la información del representado para la cual existe consentimiento: progreso, calificaciones, asistencia, entregas y calendario académico relevante.
  - No puede acceder a contenido privado del curso (p. ej. foros internos) salvo que el estudiante lo autorice.
- **Notificaciones y alertas**
  - Recibir notificaciones configurables: calificaciones nuevas, entregas faltantes, ausencias, eventos importantes del calendario.
  - Opciones para recibir resúmenes semanales o alertas inmediatas.
- **Interacción**
  - Enviar mensajes al instructor con copia al representado; solicitar reuniones o aclaraciones.
  - Descargar reportes de progreso autorizados.
- **Permisos**
  - Rol tipo invitado con **lectura limitada** sobre el representado; no puede modificar datos del estudiante ni entregar evaluaciones.
  - Gestión de consentimiento: el estudiante debe autorizar al representante; registro de consentimiento en auditoría.
- **API relevantes**
  - `GET /users/:studentId/progress?asRepresentative=true`, `GET /users/:studentId/grades?asRepresentative=true`, `POST /representatives/:id/requests`.
- **Privacidad y cumplimiento**
  - Registro de consentimiento y revocación; control de alcance temporal (ej. tutoría por semestre).
  - Logs de acceso del representante al perfil del estudiante.
- **UX**
  - Dashboard simplificado con tarjetas: progreso, próximas fechas, alertas críticas.

---

### Administrador — funcionalidades y permisos
**Objetivo:** operar y mantener la plataforma, gestionar inscripciones, calendarios y políticas institucionales.

- **Gestión de usuarios**
  - CRUD completo de usuarios; asignación de roles; restablecer contraseñas.
  - Importación masiva y exportación de usuarios.
- **Carga y gestión de inscripciones**
  - **Carga masiva** de inscripciones por CSV/plantilla; validación y reportes de errores.
  - Reglas de negocio para inscripciones (cupos, prerequisitos, listas de espera).
- **Calendario académico**
  - **Actualizar calendario** con fechas académicas y administrativas: inicio/fin de periodos, fechas de exámenes, feriados.
  - Marcar eventos como obligatorios o informativos; sincronización con calendario institucional (iCal / API).
  - Configurar reglas de desbloqueo de contenido basadas en fechas del calendario.
- **Políticas y configuración**
  - Configurar políticas de retención, límites de tamaño de upload, tipos de archivo permitidos.
  - Gestionar tenants, parámetros de localización y zonas horarias.
- **Operaciones y seguridad**
  - Acceso a auditoría y logs; gestionar backups; configurar SLAs.
  - Ejecutar acciones administrativas: suspender cuentas, forzar re-matriculación.
- **Notificaciones y comunicaciones**
  - Enviar comunicaciones masivas; configurar plantillas de email y webhooks.
- **API relevantes**
  - `POST /admin/users/import`, `POST /admin/enrollments/bulk`, `PATCH /admin/calendar/events`, `GET /admin/audit`.
- **Permisos**
  - Acceso total a datos y operaciones; acciones registradas en auditoría.
- **Consideraciones**
  - Interfaz para previsualizar cambios masivos antes de aplicar; sandbox para pruebas.

---

### Invitado — funcionalidades y permisos
**Objetivo:** acceso público o temporal a contenidos limitados.

- **Acceso**
  - Ver páginas públicas del curso o material promocional.
  - Acceso temporal a una lección de muestra si está habilitado.
- **Limitaciones**
  - No puede inscribirse sin registro; no puede ver calificaciones ni progreso.
- **API relevantes**
  - `GET /courses/public`, `GET /courses/:id/preview`.

---

### Integración con el calendario ya implementado
**Interacciones clave:**
- **Estudiante**
  - Ver fechas académicas y plazos en su dashboard; recibir recordatorios.
- **Instructor**
  - Programar entregas y sesiones sincronizadas con calendario; bloquear fechas.
- **Representante**
  - Recibir eventos relevantes del calendario del representado; suscribirse a iCal.
- **Administrador**
  - Crear/editar/eliminar eventos académicos y administrativos; marcar feriados; publicar calendario institucional.
**Requisitos técnicos**
- Endpoints para CRUD de eventos: `GET /calendar`, `POST /calendar/events`, `PATCH /calendar/events/:id`.
- Webhooks o notificaciones push cuando el calendario cambia.
- Reglas de visibilidad por rol y por consentimiento.

---

### Matriz de permisos resumida
- **Lectura completa**: Administrador.
- **Lectura restringida (propio)**: Estudiante sobre su data.
- **Lectura restringida (representado)**: Representante con consentimiento.
- **Edición de cursos**: Instructor (sobre sus cursos), Administrador (global).
- **Carga masiva**: Administrador.
- **Modificar calendario**: Administrador; Instructor puede proponer eventos para su curso.
- **Auditoría de accesos**: Administrador y registros automáticos.

