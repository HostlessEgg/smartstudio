# Requisitos funcionales prioritarios

Este documento recoge los requisitos funcionales prioritarios del proyecto LMS, pulidos para desarrollo.

## 1. Gestión de usuarios y roles
- Roles: `Admin`, `Instructor`, `Estudiante`, `Invitado`.
- Perfiles con metadatos: nombre, email (único), ocupación, tags, foto opcional, organización.
- Funcionalidades: crear, editar, desactivar, buscar usuarios; asignar/remover roles; gestión de permisos por rol.

**Criterios de aceptación**
- Crear un usuario con email único.
- Asignar y remover roles a un usuario.
- Filtrar usuarios por rol y tags.
- Ver historial ligero (quién creó/modificó usuario y cuándo).

## 2. Gestión de cursos
- CRUD de cursos con metadatos: título, descripción, instructor(es), categoría, etiquetas, duración estimada, imagen.
- Estados: `borrador`, `publicado`, `archivado`.
- Versionado: permitir mantener una versión publicada mientras se edita otra en borrador.

**Criterios de aceptación**
- Crear y editar un curso.
- Publicar una versión del curso (la versión publicada permanece inmutable para estudiantes).
- Volver a `borrador` para editar sin afectar la versión publicada.
- Archivar curso para ocultarlo de listados activos.

## 3. Estructura de contenidos
- Jerarquía: Curso → Módulos → Lecciones → Recursos.
- Recursos soportados: PDF, vídeo (URL o upload), paquetes SCORM, enlaces externos.
- Metadatos por recurso: título, tipo, duración, orden, descripción.
- Reordenado (drag & drop o API) y versionado de la estructura por curso.

**Criterios de aceptación**
- Crear módulos y lecciones y adjuntar recursos.
- Reordenar módulos/lecciones.
- Servir recursos con control de acceso según inscripción.

## 4. Inscripción y cohortes
- Inscripción individual y por importación masiva (CSV) con validación y reporte de errores.
- Cohortes con fechas de inicio/fin, reglas de acceso (invitación, cupo, visibilidad) y asignación a cursos.
- Inscripciones por cohort o individuales.

**Criterios de aceptación**
- Inscribir un usuario a un curso.
- Crear cohortes con reglas y fechas.
- Procesar CSV de inscripciones y generar reporte de errores.

## 5. Evaluaciones
- Tipos: cuestionarios (opción múltiple, verdadero/falso, respuesta corta) y tareas (subida de archivo).
- Rúbricas configurables para calificación manual; autocalificación para preguntas objetivas.
- Parámetros: intentos máximos, límite de tiempo, feedback visible para estudiantes.

**Criterios de aceptación**
- Crear cuestionario con los tipos de pregunta indicados.
- Ejecutar intento y guardar respuestas.
- Autocalificación de preguntas objetivas.
- Instructor puede revisar entregas, aplicar rúbrica y calificar manualmente.
- Registrar calificaciones en el perfil del estudiante.

## Siguientes pasos sugeridos
- Convertir cada requisito en historias de usuario con criterios técnicos y tareas de implementación.
- Priorizar el backlog (MVP mínimo viable: gestión usuarios, cursos básicos, estructura de contenidos, inscripción simple, evaluaciones básicas).
- Definir APIs públicas mínimas (endpoints REST/GraphQL) y contratos para integración frontend.

Si prefieres, genero automáticamente un conjunto de historias de usuario en `docs/` o creo `REQUIREMENTS.md` en otro formato (por ejemplo, `requirements.md` en inglés). Dime qué formato prefieres.
