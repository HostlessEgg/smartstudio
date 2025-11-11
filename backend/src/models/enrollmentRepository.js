import { pool } from '../db/mysql.js';

export async function enrollStudent({ courseId, userId }) {
  const [res] = await pool.query(
    'INSERT INTO enrollments (course_id, student_id) VALUES (?, ?)',
    [courseId, userId]
  );
  return res.insertId;
}

export async function isEnrolled({ courseId, userId }) {
  const [rows] = await pool.query(
    'SELECT id FROM enrollments WHERE course_id=? AND student_id=?',
    [courseId, userId]
  );
  return rows.length > 0;
}

export async function listEnrolled(courseId) {
  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.email, u.role, e.enrolled_at
     FROM enrollments e
     JOIN users u ON u.id = e.student_id
     WHERE e.course_id=? ORDER BY u.name ASC`,
    [courseId]
  );
  return rows;
}

export async function listEnrolledPaginated(courseId, page=1, pageSize=50, search='', order='name:asc'){
  const offset = (page-1)*pageSize;
  const [of, od] = (order||'').split(':');
  const allowed = ['name','email','enrolled_at','id'];
  const field = allowed.includes(of) ? of : 'name';
  const dir = (od && od.toLowerCase()==='desc') ? 'DESC' : 'ASC';

  const where = ['e.course_id=?', "u.role='student'"];
  const params = [courseId];
  if (search){ where.push('(u.name LIKE ? OR u.email LIKE ?)'); params.push(`%${search}%`,`%${search}%`); }

  const base = `FROM enrollments e JOIN users u ON u.id = e.student_id WHERE ${where.join(' AND ')}`;

  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.email, u.role, e.enrolled_at ${base}
     ORDER BY ${field} ${dir} LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );
  const [cnt] = await pool.query(`SELECT COUNT(*) c ${base}`, params);
  return { data: rows, total: cnt[0].c, page, pageSize };
}

export async function removeEnrollment({ courseId, userId }) {
  const [res] = await pool.query(
    'DELETE FROM enrollments WHERE course_id=? AND student_id=?',
    [courseId, userId]
  );
  return res.affectedRows > 0;
}

export async function bulkEnroll({ courseId, userIds }) {
  if (!userIds.length) return { added: 0, total: 0 };
  const values = userIds.map(id => [courseId, id]);
  const [res] = await pool.query(
    'INSERT IGNORE INTO enrollments (course_id, student_id) VALUES ?',
    [values]
  );
  const added = res.affectedRows || 0;
  const [cnt] = await pool.query(
    `SELECT COUNT(*) c
     FROM enrollments e JOIN users u ON u.id=e.student_id
     WHERE e.course_id=? AND u.role='student'`,
    [courseId]
  );
  return { added, total: cnt[0].c };
}