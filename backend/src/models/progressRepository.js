import { pool } from '../db/mysql.js';

export async function countCourseLessons(courseId) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) c
     FROM lessons l
     JOIN modules m ON m.id = l.module_id
     WHERE m.course_id = ?`,
    [courseId]
  );
  return Number(rows[0]?.c || 0);
}

export async function upsertLessonProgress({ courseId, lessonId, studentId, status, score }) {
  const completedAt = status === 'completed' ? new Date() : null;
  await pool.query(
    `INSERT INTO lesson_progress (course_id, lesson_id, student_id, status, score, completed_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       status=VALUES(status),
       score=VALUES(score),
       completed_at=VALUES(completed_at)`,
    [courseId, lessonId, studentId, status, score ?? null, completedAt]
  );
}

export async function getStudentCourseProgress(courseId, studentId) {
  const totalLessons = await countCourseLessons(courseId);
  const [rows] = await pool.query(
    `SELECT
       SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) AS completed,
       AVG(score) AS avg_score,
       MAX(completed_at) AS last_completed_at
     FROM lesson_progress
     WHERE course_id=? AND student_id=?`,
    [courseId, studentId]
  );
  const completed = Number(rows[0]?.completed || 0);
  const avgScore = rows[0]?.avg_score != null ? Number(rows[0].avg_score) : null;
  const percentage = totalLessons ? Math.round((completed / totalLessons) * 100) : 0;
  return {
    courseId,
    studentId,
    totalLessons,
    completedLessons: completed,
    percentage,
    avgScore,
    lastCompletedAt: rows[0]?.last_completed_at || null
  };
}

export async function listCourseProgress({ courseId, page=1, pageSize=20, search='', order='percentage:desc' }) {
  const totalLessons = await countCourseLessons(courseId);
  const [of, od] = (order || '').split(':');
  const allowed = ['percentage','avg_score','name','email','completed','id'];
  const dir = (od && od.toLowerCase()==='asc') ? 'ASC' : 'DESC';
  let fieldSql;
  switch (of) {
    case 'avg_score': fieldSql = 'avg_score'; break;
    case 'name': fieldSql = 'u.name'; break;
    case 'email': fieldSql = 'u.email'; break;
    case 'completed': fieldSql = 'completed'; break;
    case 'id': fieldSql = 'u.id'; break;
    default: fieldSql = 'completed'; // percentage uses completed
  }
  const offset = (page-1)*pageSize;

  const where = ['e.course_id=?', "u.role='student'"];
  const params = [courseId];
  if (search) {
    where.push('(u.name LIKE ? OR u.email LIKE ?)');
    params.push(`%${search}%`,`%${search}%`);
  }

  const sql =
  `SELECT
     u.id,
     u.name,
     u.email,
     COALESCE(SUM(CASE WHEN lp.status='completed' THEN 1 ELSE 0 END),0) AS completed,
     AVG(lp.score) AS avg_score
   FROM enrollments e
   JOIN users u ON u.id = e.student_id
   LEFT JOIN lesson_progress lp
     ON lp.course_id = e.course_id AND lp.student_id = e.student_id
   WHERE ${where.join(' AND ')}
   GROUP BY u.id, u.name, u.email
   ORDER BY ${fieldSql} ${dir}
   LIMIT ? OFFSET ?`;

  const [rows] = await pool.query(sql, [...params, pageSize, offset]);

  const data = rows.map(r => {
    const completed = Number(r.completed || 0);
    return {
      id: r.id,
      name: r.name,
      email: r.email,
      completedLessons: completed,
      totalLessons,
      percentage: totalLessons ? Math.round((completed / totalLessons) * 100) : 0,
      avgScore: r.avg_score != null ? Number(r.avg_score) : null
    };
  });

  const [cnt] = await pool.query(
    `SELECT COUNT(*) c
     FROM enrollments e JOIN users u ON u.id=e.student_id
     WHERE e.course_id=? AND u.role='student'`,
    [courseId]
  );

  return { data, total: Number(cnt[0].c || 0), page, pageSize, totalLessons };
}