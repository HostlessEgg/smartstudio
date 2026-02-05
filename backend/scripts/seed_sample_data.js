import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

dotenv.config({ path: './.env' });

async function seed() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'smartstudio_lms',
    waitForConnections: true,
    connectionLimit: 5,
  });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Ensure we have a teacher
    let [rows] = await conn.execute("SELECT id FROM users WHERE role = 'teacher' LIMIT 1");
    let teacherId;
    if (rows.length > 0) {
      teacherId = rows[0].id;
    } else {
      const passwordHash = await bcrypt.hash('Teacher123!', 10);
      const [res] = await conn.execute(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Seed Teacher', 'seed.teacher@example.test', passwordHash, 'teacher']
      );
      teacherId = res.insertId;
    }

    // Ensure we have at least one student
    [rows] = await conn.execute("SELECT id FROM users WHERE role = 'student' LIMIT 1");
    let studentId;
    if (rows.length > 0) {
      studentId = rows[0].id;
    } else {
      const passwordHash = await bcrypt.hash('Student123!', 10);
      const [res] = await conn.execute(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Seed Student', 'seed.student@example.test', passwordHash, 'student']
      );
      studentId = res.insertId;
    }

    // Create sample courses
    const courses = [
      {
        title: 'Curso Seed: Fundamentos de JS',
        description: 'Curso de ejemplo generado por el seeder',
        category: 'programming',
        level: 'beginner',
      },
      {
        title: 'Curso Seed: Álgebra Básica',
        description: 'Curso de ejemplo de matemáticas',
        category: 'mathematics',
        level: 'beginner',
      },
    ];

    const courseIds = [];
    for (const c of courses) {
      const [res] = await conn.execute(
        'INSERT INTO courses (title, description, category, level, instructor_id, state) VALUES (?, ?, ?, ?, ?, ?)',
        [c.title, c.description, c.category, c.level, teacherId, 'published']
      );
      courseIds.push(res.insertId);
    }

    // Create modules and lessons for first course
    const [modRes] = await conn.execute(
      'INSERT INTO modules (course_id, title, description, order_index) VALUES (?, ?, ?, ?), (?, ?, ?, ?)',
      [courseIds[0], 'Módulo 1 - Introducción', 'Introducción al curso', 1, courseIds[0], 'Módulo 2 - Práctica', 'Ejercicios prácticos', 2]
    );

    // Fetch module ids
    const [modules] = await conn.execute('SELECT id FROM modules WHERE course_id = ? ORDER BY order_index', [courseIds[0]]);

    let lessonInserts = [];
    if (modules.length >= 1) {
      lessonInserts.push([modules[0].id, 'Lección 1 - ¿Qué es JS?', 'text', 1]);
      lessonInserts.push([modules[0].id, 'Lección 2 - Variables y tipos', 'text', 2]);
      lessonInserts.push([modules[0].id, 'Quiz 1 - Fundamentos', 'quiz', 3]);
    }
    if (modules.length >= 2) {
      lessonInserts.push([modules[1].id, 'Lección 3 - Práctica: Ejercicios', 'text', 1]);
    }

    for (const l of lessonInserts) {
      await conn.execute(
        'INSERT INTO lessons (module_id, title, lesson_type, order_index) VALUES (?, ?, ?, ?)',
        l
      );
    }

    // Enroll student in first course
    await conn.execute(
      'INSERT IGNORE INTO enrollments (student_id, course_id) VALUES (?, ?)',
      [studentId, courseIds[0]]
    );

    // Create a cohort for the second course and add student
    const [cohortRes] = await conn.execute(
      'INSERT INTO cohorts (name, course_id, start_date, end_date, visibility) VALUES (?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 90 DAY), ?)',
      ['Cohorte Seed - ' + courseIds[1], courseIds[1], 'private']
    );
    const cohortId = cohortRes.insertId;

    await conn.execute('INSERT IGNORE INTO cohort_members (cohort_id, user_id) VALUES (?, ?)', [cohortId, studentId]);

    // Create a quiz linked to the quiz lesson (if exists)
    const [quizLesson] = await conn.execute("SELECT l.id FROM lessons l JOIN modules m ON l.module_id = m.id WHERE m.course_id = ? AND l.lesson_type = 'quiz' LIMIT 1", [courseIds[0]]);
    if (quizLesson.length > 0) {
      const lessonId = quizLesson[0].id;
      const [qRes] = await conn.execute('INSERT INTO quizzes (lesson_id, title, total_points, pass_threshold) VALUES (?, ?, ?, ?)', [lessonId, 'Quiz Seed 1', 10, 6]);
      const quizId = qRes.insertId;
      await conn.execute('INSERT INTO quiz_questions (quiz_id, question_text, question_type, points) VALUES (?, ?, ?, ?)', [quizId, '¿Qué significa NaN?', 'short', 1]);
    }

    // Create a sample assignment
    await conn.execute('INSERT INTO assignments (title, description, start_at, end_at, created_by) VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), ?)', ['Tarea Seed: Entrega 1', 'Entrega de ejemplo generada por seeder', teacherId]);

    await conn.commit();

    // Summarize
    const [[{ usersCount }]] = await conn.execute('SELECT COUNT(*) as usersCount FROM users');
    const [[{ coursesCount }]] = await conn.execute('SELECT COUNT(*) as coursesCount FROM courses');
    const [[{ enrollCount }]] = await conn.execute('SELECT COUNT(*) as enrollCount FROM enrollments');

    console.log('Seed completado: users=%d, courses=%d, enrollments=%d', usersCount, coursesCount, enrollCount);
  } catch (err) {
    await conn.rollback();
    console.error('Error en seed:', err);
    process.exitCode = 1;
  } finally {
    conn.release();
    await pool.end();
  }
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
