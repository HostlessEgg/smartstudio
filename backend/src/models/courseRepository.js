import { pool } from '../db/mysql.js';
import { COURSE_STATES } from './courseStates.js';

export async function createTemplateCourse({ title, description, instructorId, academicYear }) {
  const [result] = await pool.query(
    `INSERT INTO courses (title, description, instructor_id, section, academic_year, is_template, state)
     VALUES (?, ?, ?, 'TEMPLATE', ?, 1, ?)`,
    [title, description, instructorId, academicYear, COURSE_STATES.TEMPLATE]
  );
  return result.insertId;
}

export async function getCourseById(id) {
  const [rows] = await pool.query('SELECT * FROM courses WHERE id=?', [id]);
  return rows[0] || null;
}

export async function listCourses({
  academicYear, state, isTemplate, instructorId,
  page=1, pageSize=20, search='', order='created_at:desc'
}) {
  const where = [];
  const params = [];
  if (academicYear){ where.push('academic_year = ?'); params.push(academicYear); }
  if (state){ where.push('state = ?'); params.push(state); }
  if (typeof isTemplate === 'boolean'){ where.push('is_template = ?'); params.push(isTemplate ? 1 : 0); }
  if (instructorId){ where.push('instructor_id = ?'); params.push(instructorId); }
  if (search){ where.push('(title LIKE ? OR description LIKE ?)'); params.push(`%${search}%`,`%${search}%`); }

  const [of, od] = (order || '').split(':');
  const allowed = ['created_at','updated_at','title','id'];
  const field = allowed.includes(of) ? of : 'created_at';
  const dir = (od && od.toLowerCase()==='asc') ? 'ASC' : 'DESC';

  const offset = (page-1)*pageSize;
  const base = `FROM courses ${where.length ? 'WHERE '+where.join(' AND ') : ''}`;
  const [rows] = await pool.query(`SELECT * ${base} ORDER BY ${field} ${dir} LIMIT ? OFFSET ?`, [...params, pageSize, offset]);
  const [cnt] = await pool.query(`SELECT COUNT(*) c ${base}`, params);
  return { data: rows, total: cnt[0].c, page, pageSize };
}

export async function listChildSections(parentId) {
  const [rows] = await pool.query(
    'SELECT * FROM courses WHERE parent_course_id=? ORDER BY section ASC',
    [parentId]
  );
  return rows;
}

export async function cloneSectionFromTemplate({ parentCourse, section, academicYear }) {
  const [insert] = await pool.query(
    `INSERT INTO courses (title, description, instructor_id, section, academic_year, is_template, parent_course_id, state)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
    [
      parentCourse.title,
      parentCourse.description,
      parentCourse.instructor_id,
      section,
      academicYear,
      parentCourse.id,
      'active'
    ]
  );
  return insert.insertId;
}