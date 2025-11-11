import { getCourseById } from '../models/courseRepository.js';
import { isEnrolled } from '../models/enrollmentRepository.js';
import {
  upsertLessonProgress,
  getStudentCourseProgress,
  listCourseProgress
} from '../models/progressRepository.js';
import { canManageCourse } from '../utils/courseUtils.js';

export async function updateLessonProgress(req, res, next) {
  try {
    const courseId = Number(req.params.courseId);
    const lessonId = Number(req.params.lessonId);
    const { status, score, student_id } = req.body;
    if (!courseId || !lessonId || !status) return res.status(400).json({ error:'courseId, lessonId y status requeridos' });

    const course = await getCourseById(courseId);
    if (!course || course.is_template) return res.status(404).json({ error:'Curso sección no encontrado' });

    const targetStudentId = student_id ?? req.user.id;
    if (req.user.role === 'student') {
      if (targetStudentId !== req.user.id) return res.status(403).json({ error:'Forbidden' });
    } else if (!canManageCourse(req.user, course)) {
      return res.status(403).json({ error:'Forbidden' });
    }

    const enrolled = await isEnrolled({ courseId, userId: targetStudentId });
    if (!enrolled) return res.status(400).json({ error:'El estudiante no está inscrito en el curso' });

    await upsertLessonProgress({ courseId, lessonId, studentId: targetStudentId, status, score });
    res.json({ message:'Progreso actualizado' });
  } catch(e){ next(e); }
}

export async function getStudentProgress(req, res, next) {
  try {
    const courseId = Number(req.params.courseId);
    const studentId = Number(req.params.studentId);
    const course = await getCourseById(courseId);
    if (!course) return res.status(404).json({ error:'Curso no encontrado' });
    if (!(canManageCourse(req.user, course) || (req.user.role==='student' && req.user.id===studentId))) {
      return res.status(403).json({ error:'Forbidden' });
    }
    const result = await getStudentCourseProgress(courseId, studentId);
    res.json(result);
  } catch(e){ next(e); }
}

export async function listCourseProgressController(req, res, next) {
  try {
    const courseId = Number(req.params.courseId);
    const { page='1', page_size='20', search='', order='percentage:desc' } = req.query;
    const course = await getCourseById(courseId);
    if (!course) return res.status(404).json({ error:'Curso no encontrado' });
    if (!canManageCourse(req.user, course)) return res.status(403).json({ error:'Forbidden' });

    const p = Math.max(1, parseInt(page));
    const ps = Math.min(200, Math.max(1, parseInt(page_size)));

    const result = await listCourseProgress({
      courseId,
      page: p,
      pageSize: ps,
      search: search || '',
      order: order || 'percentage:desc'
    });
    res.json(result);
  } catch(e){ next(e); }
}