import fs from 'fs/promises';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smartstudio_lms'
};

async function upsertLevel(connection, name) {
  const [rows] = await connection.execute('SELECT id FROM curriculum_levels WHERE name = ?', [name]);
  if (rows.length > 0) return rows[0].id;
  const [res] = await connection.execute('INSERT INTO curriculum_levels (name) VALUES (?)', [name]);
  return res.insertId;
}

async function upsertGrade(connection, levelId, name, totalHours = null, totalSections = null) {
  const [rows] = await connection.execute('SELECT id FROM curriculum_grades WHERE level_id = ? AND name = ?', [levelId, name]);
  if (rows.length > 0) return rows[0].id;
  const [res] = await connection.execute('INSERT INTO curriculum_grades (level_id, name, total_hours, total_sections) VALUES (?, ?, ?, ?)', [levelId, name, totalHours, totalSections]);
  return res.insertId;
}

async function upsertSubject(connection, name) {
  const [rows] = await connection.execute('SELECT id FROM subjects WHERE name = ?', [name]);
  if (rows.length > 0) return rows[0].id;
  const [res] = await connection.execute('INSERT INTO subjects (name) VALUES (?)', [name]);
  return res.insertId;
}

async function upsertGradeSubject(connection, gradeId, subjectId, hours = null, sections = 3) {
  const [rows] = await connection.execute('SELECT id FROM grade_subjects WHERE grade_id = ? AND subject_id = ?', [gradeId, subjectId]);
  if (rows.length > 0) {
    await connection.execute('UPDATE grade_subjects SET hours = ?, sections = ? WHERE id = ?', [hours, sections, rows[0].id]);
    return rows[0].id;
  }
  const [res] = await connection.execute('INSERT INTO grade_subjects (grade_id, subject_id, hours, sections) VALUES (?, ?, ?, ?)', [gradeId, subjectId, hours, sections]);
  return res.insertId;
}

async function main() {
  const filePath = path.join(process.cwd(), 'data', 'curriculum.json');
  const raw = await fs.readFile(filePath, 'utf8');
  const data = JSON.parse(raw);

  const connection = await mysql.createConnection(dbConfig);
  try {
    for (const levelObj of data) {
      const levelName = levelObj.nivel || levelObj.level || 'Sin nivel';
      const levelId = await upsertLevel(connection, levelName);

      const grados = levelObj.grados || {};
      for (const [gradeName, gradeInfo] of Object.entries(grados)) {
        const totalHours = gradeInfo.total_horas || gradeInfo.total_hours || null;
        const totalSections = gradeInfo.total_secciones || gradeInfo.total_sections || null;
        const gradeId = await upsertGrade(connection, levelId, gradeName, totalHours, totalSections);

        const asignaturas = gradeInfo.asignaturas || {};
        for (const [subjectName, subjInfo] of Object.entries(asignaturas)) {
          const hours = subjInfo.horas || subjInfo.hours || null;
          const sections = subjInfo.secciones || subjInfo.sections || 3;
          const subjectId = await upsertSubject(connection, subjectName);
          await upsertGradeSubject(connection, gradeId, subjectId, hours, sections);
        }
      }
    }
    console.log('Importación de curriculum completada.');
  } catch (err) {
    console.error('Error importando curriculum:', err);
  } finally {
    await connection.end();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
