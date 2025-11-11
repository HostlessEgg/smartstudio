import { pool } from '../db/mysql.js';
import { getCourseById, listChildSections } from '../models/courseRepository.js';

export async function instantiateSection(req, res, next) {
  const parentId = req.params.id;
  const { section = 'A', academic_year } = req.body;
  const academicYear = academic_year || process.env.DEFAULT_ACADEMIC_YEAR;
  let conn;
  try {
    const parent = await getCourseById(parentId);
    if (!parent) return res.status(404).json({ error: 'Template no encontrado' });
    if (!parent.is_template) return res.status(400).json({ error: 'Curso base no es template' });

    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [insert] = await conn.query(
      `INSERT INTO courses (title, description, instructor_id, section, academic_year, is_template, parent_course_id, state)
       VALUES (?,?,?,?,?,0,?, 'active')`,
      [parent.title, parent.description, parent.instructor_id, section, academicYear, parent.id]
    );
    const newCourseId = insert.insertId;

    const [modules] = await conn.query(
      'SELECT * FROM modules WHERE course_id=? ORDER BY order_index ASC',
      [parent.id]
    );

    for (const m of modules) {
      const [modIns] = await conn.query(
        'INSERT INTO modules (course_id, title, description, order_index) VALUES (?,?,?,?)',
        [newCourseId, m.title, m.description, m.order_index]
      );
      const newModuleId = modIns.insertId;
      const [lessons] = await conn.query(
        'SELECT * FROM lessons WHERE module_id=? ORDER BY order_index ASC',
        [m.id]
      );
      for (const l of lessons) {
        await conn.query(
          'INSERT INTO lessons (module_id, title, content, order_index) VALUES (?,?,?,?)',
          [newModuleId, l.title, l.content, l.order_index]
        );
      }
    }

    await conn.commit();
    return res.status(201).json({ message: 'Sección creada', courseId: newCourseId });
  } catch (e) {
    if (conn) await conn.rollback();
    if (e && e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Sección ya existe para ese template y año' });
    }
    next(e);
  } finally {
    if (conn) conn.release();
  }
}

export async function listChildren(req, res, next) {
  try {
    const parentId = req.params.parentId;
    const rows = await listChildSections(parentId);
    res.json(rows);
  } catch (e) { next(e); }
}