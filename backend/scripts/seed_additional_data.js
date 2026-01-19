import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

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

    // Find a student and a teacher
    const [students] = await conn.execute("SELECT id FROM users WHERE role = 'student' LIMIT 5");
    const [teachers] = await conn.execute("SELECT id FROM users WHERE role = 'teacher' LIMIT 5");
    if (students.length === 0 || teachers.length === 0) {
      throw new Error('Necesita al menos 1 student y 1 teacher en users');
    }

    const studentId = students[0].id;
    const teacherId = teachers[0].id;

    // Create a few submissions table entries if table exists (submissions)
    const [subTables] = await conn.execute("SHOW TABLES LIKE 'submissions'");
    if (subTables.length > 0) {
      // pick an existing assignment or create a simple one
      const [assignRows] = await conn.execute('SELECT id FROM assignments LIMIT 1');
      let assignmentId;
      if (assignRows.length > 0) assignmentId = assignRows[0].id;
      else {
        const [coursesExist] = await conn.execute('SELECT id FROM courses LIMIT 1');
        const courseIdForAssign = coursesExist.length > 0 ? coursesExist[0].id : null;
        const [aRes] = await conn.execute('INSERT INTO assignments (title, description, start_at, end_at, created_by) VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), ?)', ['Assignment seed', 'Creada por seeder adicional', courseIdForAssign]);
        assignmentId = aRes.insertId;
      }

      await conn.execute('INSERT INTO submissions (assignment_id, student_id, file_url, text_submission, created_at) VALUES (?, ?, ?, ?, NOW())', [assignmentId, studentId, null, 'Entrega de ejemplo generada por seeder']);
    }

    // Create quiz submissions for existing quizzes
    const [quizzes] = await conn.execute('SELECT id FROM quizzes LIMIT 5');
    for (const q of quizzes) {
      const [qsRes] = await conn.execute('INSERT INTO quiz_submissions (quiz_id, student_id, score, submitted_at) VALUES (?, ?, ?, NOW())', [q.id, studentId, Math.floor(Math.random() * 10) + 1]);
      const quizSubId = qsRes.insertId;

      // create a sample answer linking to quiz_questions if present
      const [questions] = await conn.execute('SELECT id FROM quiz_questions WHERE quiz_id = ? LIMIT 3', [q.id]);
      for (const qn of questions) {
        await conn.execute('INSERT INTO submission_answers (submission_id, question_id, is_correct) VALUES (?, ?, ?)', [quizSubId, qn.id, Math.random() > 0.5 ? 1 : 0]);
      }
    }

    // Create forum threads and posts
    const [courses] = await conn.execute('SELECT id FROM courses LIMIT 3');
    if (courses.length > 0) {
      for (const c of courses) {
        const [tRes] = await conn.execute('INSERT INTO forum_threads (course_id, user_id, title, created_at) VALUES (?, ?, ?, NOW())', [c.id, studentId, 'Duda sobre el contenido del curso ' + c.id]);
        const threadId = tRes.insertId;
        await conn.execute('INSERT INTO forum_posts (thread_id, user_id, content, created_at) VALUES (?, ?, ?, NOW())', [threadId, studentId, 'Pregunta de ejemplo en foro sobre el curso ' + c.id]);
        await conn.execute('INSERT INTO forum_posts (thread_id, user_id, content, created_at) VALUES (?, ?, ?, NOW())', [threadId, teacherId, 'Respuesta de ejemplo para el estudiante.']);
      }
    }

    // Ensure a representative exists for a student with role 'student' named repstudent (email seed.repstudent@example.test)
    const [repUsers] = await conn.execute("SELECT id FROM users WHERE email = 'seed.repstudent@example.test' LIMIT 1");
    let repStudentId = null;
    if (repUsers.length > 0) repStudentId = repUsers[0].id;

    if (repStudentId) {
      const [repRow] = await conn.execute('SELECT id FROM representatives WHERE student_id = ? LIMIT 1', [repStudentId]);
      if (repRow.length === 0) {
        await conn.execute('INSERT INTO representatives (student_id, name, email, phone, created_at) VALUES (?, ?, ?, ?, NOW())', [repStudentId, 'Rep Parent', 'rep.parent@example.test', '123456789']);
      }
    }

    await conn.commit();

    // Summary
    const [[{ forumThreads }]] = await conn.execute('SELECT COUNT(*) as forumThreads FROM forum_threads');
    const [[{ quizSubs }]] = await conn.execute('SELECT COUNT(*) as quizSubs FROM quiz_submissions');

    console.log('Seed adicional completado: forumThreads=%d, quizSubmissions=%d', forumThreads, quizSubs);
  } catch (err) {
    await conn.rollback();
    console.error('Error en seed adicional:', err);
    process.exitCode = 1;
  } finally {
    conn.release();
    await pool.end();
  }
}

seed().catch(err => { console.error(err); process.exit(1); });
