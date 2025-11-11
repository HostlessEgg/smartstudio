import {
  enrollStudent,
  isEnrolled,
  listEnrolled,
  removeEnrollment,
  bulkEnroll
} from '../models/enrollmentRepository.js';
import { getCourseById } from '../models/courseRepository.js';
import { getUserById } from '../models/userRepository.js';
import { canManageCourse } from '../utils/courseUtils.js';
import { listEnrolledPaginated } from '../models/enrollmentRepository.js';

export async function enrollSingle(req,res,next){
  try {
    const courseId = Number(req.params.courseId);
    const { user_id } = req.body;
    if (!courseId || !user_id) return res.status(400).json({ error:'courseId y user_id son requeridos' });
    const course = await getCourseById(courseId);
    if (!course || course.is_template) return res.status(404).json({ error:'Curso sección no encontrado' });
    if (!canManageCourse(req.user, course)) return res.status(403).json({ error:'Forbidden' });

    const u = await getUserById(user_id);
    if (!u || u.role!=='student') return res.status(400).json({ error:'user_id debe ser student válido' });

    if (await isEnrolled({ courseId, userId: user_id })) return res.status(409).json({ error:'Ya inscrito' });
    await enrollStudent({ courseId, userId: user_id });
    return res.status(201).json({ message:'Inscripción ok' });
  } catch(e){
    if (e && e.code==='ER_DUP_ENTRY') return res.status(409).json({ error:'Ya inscrito' });
    next(e);
  }
}

export async function listCourseStudents(req,res,next){
  try {
    const courseId = Number(req.params.courseId);
    const { page='1', page_size='50', include_total='true', search='', order='name:asc' } = req.query;
    const course = await getCourseById(courseId);
    if (!course) return res.status(404).json({ error:'Curso no encontrado' });
    if (!canManageCourse(req.user, course)) return res.status(403).json({ error:'Forbidden' });
    const p = Math.max(1, parseInt(page));
    const ps = Math.min(200, Math.max(1, parseInt(page_size)));
    const result = await listEnrolledPaginated(courseId, p, ps, search || '', order || 'name:asc');
    return include_total==='true' ? res.json(result) : res.json(result.data);
  } catch(e){ next(e); }
}

export async function unenroll(req, res, next) {
  try {
    const courseId = Number(req.params.courseId);
    const userId = Number(req.params.userId);
    if (!courseId || !userId) return res.status(400).json({ error: 'IDs inválidos' });
    const course = await getCourseById(courseId);
    if (!course) return res.status(404).json({ error: 'Curso no encontrado' });
    if (!canManageCourse(req.user, course)) return res.status(403).json({ error: 'Forbidden' });

    const ok = await removeEnrollment({ courseId, userId });
    if (!ok) return res.status(404).json({ error: 'No estaba inscrito' });
    res.json({ message: 'Removido' });
  } catch (e) { next(e); }
}

export async function bulkEnrollController(req,res,next){
  try {
    const courseId = Number(req.params.courseId);
    const { user_ids } = req.body;
    if (!Array.isArray(user_ids) || !user_ids.length) return res.status(400).json({ error:'user_ids array requerido' });
    const course = await getCourseById(courseId);
    if (!course || course.is_template) return res.status(404).json({ error:'Curso sección no encontrado' });
    if (!canManageCourse(req.user, course)) return res.status(403).json({ error:'Forbidden' });

    const filtered = [];
    for (const id of user_ids){
      if (typeof id !== 'number') continue;
      const u = await getUserById(id);
      if (u && u.role==='student') filtered.push(id);
    }
    if (!filtered.length) return res.status(400).json({ error:'Sin IDs de estudiantes válidos' });

    const { added, total } = await bulkEnroll({ courseId, userIds: filtered });
    return res.status(201).json({ message:'Bulk ok', added, total, processed: filtered.length });
  } catch(e){
    if (e && e.code==='ER_DUP_ENTRY') return res.status(409).json({ error:'Conflicto de inscripción' });
    next(e);
  }
}