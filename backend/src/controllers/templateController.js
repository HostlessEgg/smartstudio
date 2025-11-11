import { createTemplateCourse } from '../models/courseRepository.js';

export async function createTemplate(req, res, next) {
  try {
    const { title, description = '', academic_year } = req.body;
    if (!title) return res.status(400).json({ error: 'title requerido' });
    const academicYear = academic_year || process.env.DEFAULT_ACADEMIC_YEAR;
    const id = await createTemplateCourse({
      title,
      description,
      instructorId: req.user.id,
      academicYear
    });
    res.status(201).json({ message: 'Template creado', id });
  } catch (e) { next(e); }
}