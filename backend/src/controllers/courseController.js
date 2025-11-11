import { listCourses } from '../models/courseRepository.js';
import { isValidCourseState } from '../models/courseStates.js';

export async function listCoursesController(req, res, next) {
  try {
    const {
      academic_year, state, is_template, instructor_id,
      page='1', page_size='20', include_total='true',
      search='', order='created_at:desc'
    } = req.query;
    if (state && !isValidCourseState(state)) return res.status(400).json({ error:'state inválido' });

    let isTemplateBool;
    if (is_template==='true') isTemplateBool = true;
    if (is_template==='false') isTemplateBool = false;

    const pageNum = Math.max(1, parseInt(page));
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(page_size)));

    const result = await listCourses({
      academicYear: academic_year,
      state,
      isTemplate: typeof isTemplateBool==='boolean' ? isTemplateBool : undefined,
      instructorId: instructor_id,
      page: pageNum,
      pageSize: pageSizeNum,
      search: search || '',
      order: order || 'created_at:desc'
    });

    return include_total==='true' ? res.json(result) : res.json(result.data);
  } catch(e){ next(e); }
}