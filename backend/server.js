import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { check, validationResult } from 'express-validator';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Security headers
app.use(helmet());

// Rate limiting (global)
const GLOBAL_RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const GLOBAL_RATE_LIMIT_MAX = process.env.GLOBAL_RATE_LIMIT_MAX ? Number(process.env.GLOBAL_RATE_LIMIT_MAX) : 100; // default prod-ish
const apiLimiter = rateLimit({
    windowMs: GLOBAL_RATE_LIMIT_WINDOW,
    max: GLOBAL_RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(apiLimiter);

// Stricter limiter for auth-related endpoints
const authLimiter = rateLimit({
    windowMs: GLOBAL_RATE_LIMIT_WINDOW,
    max: process.env.AUTH_RATE_LIMIT_MAX ? Number(process.env.AUTH_RATE_LIMIT_MAX) : 10,
    standardHeaders: true,
    legacyHeaders: false,
});

// Limiter for quiz submissions to prevent spam
const quizSubmitLimiter = rateLimit({
    windowMs: GLOBAL_RATE_LIMIT_WINDOW,
    max: process.env.QUIZ_SUBMIT_RATE_LIMIT_MAX ? Number(process.env.QUIZ_SUBMIT_RATE_LIMIT_MAX) : 30,
    standardHeaders: true,
    legacyHeaders: false,
});

// Limiter for forum posts to avoid spam
const forumPostLimiter = rateLimit({
    windowMs: GLOBAL_RATE_LIMIT_WINDOW,
    max: process.env.FORUM_POST_RATE_LIMIT_MAX ? Number(process.env.FORUM_POST_RATE_LIMIT_MAX) : 30,
    standardHeaders: true,
    legacyHeaders: false,
});

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root', 
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'smartstudio_lms'
};

// Crear conexión a la base de datos
async function createDatabase() {
    try {
        const connection = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password
        });
        
        await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
        console.log('Base de datos verificada/creada');
        await connection.end();
    } catch (error) {
        console.log('Error creando base de datos:', error.message);
    }
}

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token de acceso requerido' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido' });
        }
        req.user = user;
        next();
    });
};

// Middleware para autorizar roles
const authorizeRoles = (allowedRoles = []) => (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Permisos insuficientes' });
    }
    next();
};

// RUTAS DE AUTENTICACIÓN

app.post('/api/auth/register',
    [
        check('name').isString().notEmpty().withMessage('name requerido'),
        check('email').isEmail().withMessage('email inválido'),
        check('password')
          .isLength({ min: 8 }).withMessage('password mínimo 8 caracteres')
          .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])/)
          .withMessage('password debe contener minúscula, mayúscula, número y símbolo'),
        check('role').optional().isIn(['student','teacher','admin'])
    ],
    authLimiter,
    async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
        const { name, email, password, role = 'student' } = req.body;
        const connection = await mysql.createConnection(dbConfig);

        // Verificar si el usuario existe
        const [existing] = await connection.execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            await connection.end();
            return res.status(400).json({ error: 'El usuario ya existe' });
        }

        // Reject very common weak passwords
        const common = ['12345678','password','qwerty123','qwerty','123456789','admin123'];
        if (common.includes(password)) {
            await connection.end();
            return res.status(400).json({ error: 'password demasiado común' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear usuario
        const [result] = await connection.execute(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, role]
        );

        const token = jwt.sign(
            { userId: result.insertId, email, role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'Usuario creado exitosamente',
            token,
            user: { id: result.insertId, name, email, role }
        });

        await connection.end();
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.post('/api/auth/login', [
    check('email').isEmail().withMessage('email inválido'),
    check('password').isString().notEmpty().withMessage('password requerido')
], authLimiter, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
        const { email, password } = req.body;
        const connection = await mysql.createConnection(dbConfig);

        const [users] = await connection.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            await connection.end();
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            await connection.end();
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login exitoso',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

        await connection.end();
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// RUTAS DE CURSOS
app.get('/api/courses', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        
        const [courses] = await connection.execute(`
            SELECT c.*, u.name as instructor_name 
            FROM courses c 
            LEFT JOIN users u ON c.instructor_id = u.id 
            WHERE c.is_published = true
            ORDER BY c.created_at DESC
        `);

        res.json(courses);
        await connection.end();
    } catch (error) {
        console.error('Error obteniendo cursos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.get('/api/courses/:id', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        
        const [courses] = await connection.execute(`
            SELECT c.*, u.name as instructor_name 
            FROM courses c 
            LEFT JOIN users u ON c.instructor_id = u.id 
            WHERE c.id = ?
        `, [req.params.id]);

        if (courses.length === 0) {
            await connection.end();
            return res.status(404).json({ error: 'Curso no encontrado' });
        }

        const course = courses[0];

        // Obtener módulos con lecciones
        const [modules] = await connection.execute(`
            SELECT m.* 
            FROM modules m 
            WHERE m.course_id = ? 
            ORDER BY m.order_index
        `, [req.params.id]);

        for (let module of modules) {
            const [lessons] = await connection.execute(`
                SELECT * FROM lessons 
                WHERE module_id = ? 
                ORDER BY order_index
            `, [module.id]);
            module.lessons = lessons;
        }

        course.modules = modules;
        res.json(course);
        await connection.end();
    } catch (error) {
        console.error('Error obteniendo curso:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint optimizado para devolver todas las lecciones con contexto (curso/módulo)
app.get('/api/lessons', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(`
            SELECT l.id as lesson_id, l.title as lesson_title, l.order_index as lesson_order,
                   m.id as module_id, m.title as module_title, m.order_index as module_order,
                   c.id as course_id, c.title as course_title
            FROM lessons l
            JOIN modules m ON l.module_id = m.id
            JOIN courses c ON m.course_id = c.id
            ORDER BY c.title, m.order_index, l.order_index
        `);
        await connection.end();
        res.json(rows);
    } catch (err) {
        console.error('Error obteniendo lecciones:', err);
        res.status(500).json({ error: 'Error interno' });
    }
});

// Endpoint para obtener el curriculum estructurado (niveles -> grados -> asignaturas)
app.get('/api/curriculum', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const [rows] = await connection.execute(`
            SELECT lv.id as level_id, lv.name as level_name,
                   g.id as grade_id, g.name as grade_name, g.total_hours, g.total_sections,
                   s.id as subject_id, s.name as subject_name,
                   gs.hours as subject_hours, gs.sections as subject_sections
            FROM curriculum_levels lv
            JOIN curriculum_grades g ON g.level_id = lv.id
            JOIN grade_subjects gs ON gs.grade_id = g.id
            JOIN subjects s ON s.id = gs.subject_id
            ORDER BY lv.name, g.name
        `);

        const result = [];
        const levelsMap = new Map();

        for (const r of rows) {
            if (!levelsMap.has(r.level_id)) {
                const levelObj = { nivel: r.level_name, grados: {} };
                levelsMap.set(r.level_id, levelObj);
                result.push(levelObj);
            }
            const levelObj = levelsMap.get(r.level_id);

            if (!levelObj.grados[r.grade_name]) {
                levelObj.grados[r.grade_name] = {
                    total_horas: r.total_hours,
                    total_secciones: r.total_sections,
                    asignaturas: {}
                };
            }

            levelObj.grados[r.grade_name].asignaturas[r.subject_name] = {
                horas: r.subject_hours,
                secciones: r.subject_sections
            };
        }

        await connection.end();
        res.json(result);
    } catch (err) {
        await connection.end();
        console.error('Error obteniendo curriculum:', err);
        res.status(500).json({ error: 'Error interno' });
    }
});

// ---------- ENDPOINTS PARA ASSIGNMENTS (CALENDARIO) ----------

// Listar assignments, opcionalmente filtrar por gradeId, subjectId, rango de fechas
app.get('/api/assignments', authenticateToken, async (req, res) => {
    const { gradeId, subjectId, from, to } = req.query;
    const connection = await mysql.createConnection(dbConfig);
    try {
        let sql = 'SELECT a.*, g.name as grade_name, s.name as subject_name, u.name as author_name FROM assignments a LEFT JOIN curriculum_grades g ON a.grade_id = g.id LEFT JOIN subjects s ON a.subject_id = s.id LEFT JOIN users u ON a.created_by = u.id WHERE 1=1';
        const params = [];
        if (gradeId) { sql += ' AND a.grade_id = ?'; params.push(gradeId); }
        if (subjectId) { sql += ' AND a.subject_id = ?'; params.push(subjectId); }
        if (from) { sql += ' AND a.start_at >= ?'; params.push(from); }
        if (to) { sql += ' AND a.start_at <= ?'; params.push(to); }
        sql += ' ORDER BY a.start_at ASC';

        const [rows] = await connection.execute(sql, params);
        await connection.end();
        res.json(rows);
    } catch (err) {
        await connection.end();
        console.error('Error obteniendo assignments:', err);
        res.status(500).json({ error: 'Error interno' });
    }
});

// Crear assignment (teacher/admin)
app.post('/api/assignments', authenticateToken, authorizeRoles(['teacher','admin']), [
    check('title').isString().notEmpty(),
    check('start_at').isISO8601().withMessage('start_at debe ser fecha ISO')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { title, description, start_at, end_at, grade_id, subject_id } = req.body;
    const connection = await mysql.createConnection(dbConfig);
    try {
        const [result] = await connection.execute('INSERT INTO assignments (title, description, start_at, end_at, grade_id, subject_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)', [title, description || null, start_at, end_at || null, grade_id || null, subject_id || null, req.user.userId]);
        await connection.end();
        res.status(201).json({ message: 'Assignment creado', id: result.insertId });
    } catch (err) {
        await connection.end();
        console.error('Error creando assignment:', err);
        res.status(500).json({ error: 'Error interno' });
    }
});

// Editar assignment
app.put('/api/assignments/:id', authenticateToken, authorizeRoles(['teacher','admin']), async (req, res) => {
    const id = req.params.id;
    const { title, description, start_at, end_at, grade_id, subject_id } = req.body;
    const connection = await mysql.createConnection(dbConfig);
    try {
        await connection.execute('UPDATE assignments SET title = ?, description = ?, start_at = ?, end_at = ?, grade_id = ?, subject_id = ? WHERE id = ?', [title, description || null, start_at, end_at || null, grade_id || null, subject_id || null, id]);
        await connection.end();
        res.json({ message: 'Assignment actualizado' });
    } catch (err) {
        await connection.end();
        console.error('Error actualizando assignment:', err);
        res.status(500).json({ error: 'Error interno' });
    }
});

// Borrar assignment
app.delete('/api/assignments/:id', authenticateToken, authorizeRoles(['teacher','admin']), async (req, res) => {
    const id = req.params.id;
    const connection = await mysql.createConnection(dbConfig);
    try {
        await connection.execute('DELETE FROM assignments WHERE id = ?', [id]);
        await connection.end();
        res.json({ message: 'Assignment eliminado' });
    } catch (err) {
        await connection.end();
        console.error('Error eliminando assignment:', err);
        res.status(500).json({ error: 'Error interno' });
    }
});

// Config endpoint (expose quiz pass threshold)
app.get('/api/config', (req, res) => {
    const envThreshold = process.env.QUIZ_PASS_THRESHOLD ? Number(process.env.QUIZ_PASS_THRESHOLD) : 0.5;
    res.json({ quizPassThreshold: envThreshold });
});

// RUTAS DE PROGRESO
app.get('/api/progress/:courseId', authenticateToken, async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const studentId = req.user.userId;
        const courseId = req.params.courseId;

        const [progress] = await connection.execute(`
            SELECT COUNT(*) as total_lessons,
                   SUM(CASE WHEN sp.is_completed THEN 1 ELSE 0 END) as completed_lessons
            FROM lessons l
            JOIN modules m ON l.module_id = m.id
            LEFT JOIN student_progress sp ON l.id = sp.lesson_id AND sp.student_id = ?
            WHERE m.course_id = ?
        `, [studentId, courseId]);

        res.json(progress[0]);
        await connection.end();
    } catch (error) {
        console.error('Error obteniendo progreso:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.post('/api/progress/complete-lesson', authenticateToken, async (req, res) => {
    try {
        const { lessonId, courseId } = req.body;
        const studentId = req.user.userId;
        const connection = await mysql.createConnection(dbConfig);

        await connection.execute(`
            INSERT INTO student_progress (student_id, lesson_id, course_id, is_completed, completed_at)
            VALUES (?, ?, ?, true, NOW())
            ON DUPLICATE KEY UPDATE is_completed = true, completed_at = NOW()
        `, [studentId, lessonId, courseId]);

        res.json({ message: 'Lección completada' });
        await connection.end();
    } catch (error) {
        console.error('Error actualizando progreso:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ---------- ENDPOINTS PARA QUIZZES / EVALUACIONES ----------

// Crear un quiz (solo teacher/admin)
app.post('/api/quizzes',
    authenticateToken,
    authorizeRoles(['teacher','admin']),
    [
        check('lessonId').isInt().withMessage('lessonId debe ser entero'),
        check('title').isString().notEmpty().withMessage('title requerido'),
        check('questions').optional().isArray().withMessage('questions debe ser un array')
    ],
    async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { lessonId, title, questions = [] } = req.body;

    const connection = await mysql.createConnection(dbConfig);
    try {
        await connection.beginTransaction();

        const [quizResult] = await connection.execute(
            'INSERT INTO quizzes (lesson_id, title) VALUES (?, ?)',
            [lessonId, title]
        );

        const quizId = quizResult.insertId;
        let totalPoints = 0;

        for (const q of questions) {
            const qText = q.question_text || q.text || '';
            const qType = q.question_type || 'mcq';
            const qPoints = Number(q.points || 1);

            const [qRes] = await connection.execute(
                'INSERT INTO quiz_questions (quiz_id, question_text, question_type, points) VALUES (?, ?, ?, ?)',
                [quizId, qText, qType, qPoints]
            );

            const questionId = qRes.insertId;
            totalPoints += qPoints;

            if (Array.isArray(q.choices)) {
                for (const choice of q.choices) {
                    await connection.execute(
                        'INSERT INTO quiz_choices (question_id, choice_text, is_correct) VALUES (?, ?, ?)',
                        [questionId, choice.text || choice.choice_text || '', choice.is_correct ? 1 : 0]
                    );
                }
            }
        }

        await connection.execute('UPDATE quizzes SET total_points = ? WHERE id = ?', [totalPoints, quizId]);
        await connection.commit();

        res.status(201).json({ message: 'Quiz creado', quizId });
    } catch (error) {
        await connection.rollback();
        console.error('Error creando quiz:', error);
        res.status(500).json({ error: 'Error interno al crear quiz' });
    } finally {
        await connection.end();
    }
});

// Obtener quiz por lessonId (vista para estudiantes) - oculta respuestas correctas
app.get('/api/quizzes/lesson/:lessonId', authenticateToken, async (req, res) => {
    const lessonId = req.params.lessonId;
    const connection = await mysql.createConnection(dbConfig);
    try {
        const [quizzes] = await connection.execute('SELECT * FROM quizzes WHERE lesson_id = ?', [lessonId]);
        for (const quiz of quizzes) {
            const [questions] = await connection.execute('SELECT * FROM quiz_questions WHERE quiz_id = ?', [quiz.id]);
            for (const q of questions) {
                const [choices] = await connection.execute('SELECT id, choice_text FROM quiz_choices WHERE question_id = ?', [q.id]);
                q.choices = choices;
            }
            quiz.questions = questions;
        }
        res.json(quizzes);
    } catch (error) {
        console.error('Error obteniendo quizzes por lección:', error);
        res.status(500).json({ error: 'Error interno' });
    } finally {
        await connection.end();
    }
});

// Obtener quiz por id (si es teacher/admin, incluye la respuesta correcta)
app.get('/api/quizzes/:id', authenticateToken, async (req, res) => {
    const quizId = req.params.id;
    const connection = await mysql.createConnection(dbConfig);
    try {
        const [quizzes] = await connection.execute('SELECT * FROM quizzes WHERE id = ?', [quizId]);
        if (quizzes.length === 0) {
            await connection.end();
            return res.status(404).json({ error: 'Quiz no encontrado' });
        }
        const quiz = quizzes[0];
        const [questions] = await connection.execute('SELECT * FROM quiz_questions WHERE quiz_id = ?', [quizId]);
        for (const q of questions) {
            if (req.user && (req.user.role === 'teacher' || req.user.role === 'admin')) {
                const [choices] = await connection.execute('SELECT * FROM quiz_choices WHERE question_id = ?', [q.id]);
                q.choices = choices;
            } else {
                const [choices] = await connection.execute('SELECT id, choice_text FROM quiz_choices WHERE question_id = ?', [q.id]);
                q.choices = choices;
            }
        }
        quiz.questions = questions;
        res.json(quiz);
    } catch (error) {
        console.error('Error obteniendo quiz por id:', error);
        res.status(500).json({ error: 'Error interno' });
    } finally {
        await connection.end();
    }
});

// Enviar respuestas de un quiz y calcular calificación
app.post('/api/quizzes/:id/submit',
    authenticateToken,
    quizSubmitLimiter,
    [ check('answers').isArray().withMessage('answers debe ser un array') ],
    async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const quizId = req.params.id;
    const studentId = req.user.userId;
    const { answers = [] } = req.body; // [{ questionId, choiceId }]

    const connection = await mysql.createConnection(dbConfig);
    try {
        await connection.beginTransaction();

        // Obtener preguntas y sus puntos
        const [questions] = await connection.execute('SELECT id, points FROM quiz_questions WHERE quiz_id = ?', [quizId]);
        const pointsMap = {};
        for (const q of questions) pointsMap[q.id] = Number(q.points || 1);

        // Obtener las opciones correctas por pregunta
        const [correctRows] = await connection.execute('SELECT question_id, id as choice_id FROM quiz_choices WHERE is_correct = 1 AND question_id IN (SELECT id FROM quiz_questions WHERE quiz_id = ?)', [quizId]);
        const correctMap = {};
        for (const row of correctRows) correctMap[row.question_id] = Number(row.choice_id);

        // Calcular score
        let totalScore = 0;
        let maxScore = 0;
        for (const q of questions) {
            maxScore += Number(q.points || 1);
        }

        for (const ans of answers) {
            const qid = ans.questionId;
            const chosen = ans.choiceId;
            const isCorrect = correctMap[qid] && Number(correctMap[qid]) === Number(chosen);
            if (isCorrect) totalScore += (pointsMap[qid] || 1);
        }

        // Guardar submission
        const [subRes] = await connection.execute(
            'INSERT INTO quiz_submissions (quiz_id, student_id, score) VALUES (?, ?, ?)',
            [quizId, studentId, totalScore]
        );
        const submissionId = subRes.insertId;

        // Guardar respuestas individuales
        for (const ans of answers) {
            const qid = ans.questionId;
            const chosen = ans.choiceId || null;
            const isCorrect = (correctMap[qid] && Number(correctMap[qid]) === Number(chosen)) ? 1 : 0;
            await connection.execute(
                'INSERT INTO submission_answers (submission_id, question_id, choice_id, is_correct) VALUES (?, ?, ?, ?)',
                [submissionId, qid, chosen, isCorrect]
            );
        }

        // Intentar marcar progreso para la lección asociada al quiz solo si alcanza el umbral
        try {
            const [quizRows] = await connection.execute('SELECT lesson_id, pass_threshold FROM quizzes WHERE id = ?', [quizId]);
            if (quizRows.length > 0) {
                const lessonId = quizRows[0].lesson_id;
                const quizPass = quizRows[0].pass_threshold !== null ? Number(quizRows[0].pass_threshold) : null;
                if (lessonId) {
                    const [lessonRows] = await connection.execute('SELECT module_id FROM lessons WHERE id = ?', [lessonId]);
                    if (lessonRows.length > 0) {
                        const moduleId = lessonRows[0].module_id;
                        const [moduleRows] = await connection.execute('SELECT course_id FROM modules WHERE id = ?', [moduleId]);
                        const courseId = moduleRows.length > 0 ? moduleRows[0].course_id : null;

                        // Determinar umbral: prioridad -> quiz.pass_threshold -> query param -> env -> default 0.5
                        const envThreshold = process.env.QUIZ_PASS_THRESHOLD ? Number(process.env.QUIZ_PASS_THRESHOLD) : 0.5;
                        const reqThreshold = req.query.threshold ? Number(req.query.threshold) : null;
                        const percent = maxScore > 0 ? (Number(totalScore) / Number(maxScore)) : 0;
                        const thresholdToUse = quizPass !== null ? Number(quizPass) : (reqThreshold !== null ? Number(reqThreshold) : envThreshold);

                        if (courseId && percent >= (thresholdToUse || 0.5)) {
                            await connection.execute(
                                `INSERT INTO student_progress (student_id, lesson_id, course_id, is_completed, completed_at)
                                 VALUES (?, ?, ?, true, NOW())
                                 ON DUPLICATE KEY UPDATE is_completed = true, completed_at = NOW()`,
                                [studentId, lessonId, courseId]
                            );
                        }
                    }
                }
            }
        } catch (err) {
            console.error('No se pudo actualizar student_progress automáticamente:', err);
        }

        await connection.commit();

        res.json({ message: 'Quiz enviado', score: totalScore, maxScore });
    } catch (error) {
        await connection.rollback();
        console.error('Error al enviar quiz:', error);
        res.status(500).json({ error: 'Error interno al guardar respuestas' });
    } finally {
        await connection.end();
    }
});

// ---------- ENDPOINTS PARA FOROS ----------

// Crear thread en foro (curso o lección)
app.post('/api/forums/threads',
    authenticateToken,
    [
        check('title').isString().notEmpty().withMessage('title requerido'),
        check('content').isString().notEmpty().withMessage('content requerido'),
        check('courseId').optional().isInt(),
        check('lessonId').optional().isInt()
    ],
    async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { courseId = null, lessonId = null, title, content } = req.body;

    const connection = await mysql.createConnection(dbConfig);
    try {
        await connection.beginTransaction();
        const [tRes] = await connection.execute(
            'INSERT INTO forum_threads (course_id, lesson_id, user_id, title) VALUES (?, ?, ?, ?)',
            [courseId, lessonId, req.user.userId, title]
        );
        const threadId = tRes.insertId;
        await connection.execute('INSERT INTO forum_posts (thread_id, user_id, content) VALUES (?, ?, ?)', [threadId, req.user.userId, content]);
        await connection.commit();
        res.status(201).json({ message: 'Thread creado', threadId });
    } catch (err) {
        await connection.rollback();
        console.error('Error creando thread:', err);
        res.status(500).json({ error: 'Error creando thread' });
    } finally {
        await connection.end();
    }
});

// Obtener threads por curso o lección
app.get('/api/forums/threads', async (req, res) => {
    const { courseId, lessonId } = req.query;
    const connection = await mysql.createConnection(dbConfig);
    try {
        let rows;
        if (lessonId) {
            [rows] = await connection.execute('SELECT * FROM forum_threads WHERE lesson_id = ? ORDER BY created_at DESC', [lessonId]);
        } else if (courseId) {
            [rows] = await connection.execute('SELECT * FROM forum_threads WHERE course_id = ? ORDER BY created_at DESC', [courseId]);
        } else {
            [rows] = await connection.execute('SELECT * FROM forum_threads ORDER BY created_at DESC');
        }
        res.json(rows);
    } catch (err) {
        console.error('Error obteniendo threads:', err);
        res.status(500).json({ error: 'Error interno' });
    } finally {
        await connection.end();
    }
});

// Obtener posts de un thread
app.get('/api/forums/threads/:id/posts', async (req, res) => {
    const threadId = req.params.id;
    const connection = await mysql.createConnection(dbConfig);
    try {
        const [posts] = await connection.execute('SELECT p.*, u.name as author_name FROM forum_posts p LEFT JOIN users u ON p.user_id = u.id WHERE p.thread_id = ? ORDER BY p.created_at', [threadId]);
        res.json(posts);
    } catch (err) {
        console.error('Error obteniendo posts:', err);
        res.status(500).json({ error: 'Error interno' });
    } finally {
        await connection.end();
    }
});

// Agregar post a un thread (autenticado)
app.post('/api/forums/threads/:id/posts',
    authenticateToken,
    forumPostLimiter,
    [ check('content').isString().notEmpty().withMessage('content requerido') ],
    async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const threadId = req.params.id;
    const { content } = req.body;
    const connection = await mysql.createConnection(dbConfig);
    try {
        const [resInsert] = await connection.execute('INSERT INTO forum_posts (thread_id, user_id, content) VALUES (?, ?, ?)', [threadId, req.user.userId, content]);
        res.status(201).json({ message: 'Post agregado', postId: resInsert.insertId });
    } catch (err) {
        console.error('Error agregando post:', err);
        res.status(500).json({ error: 'Error interno' });
    } finally {
        await connection.end();
    }
});

// Ruta de salud
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'SMARTSTUDIO LMS API funcionando' });
});

// Inicializar servidor
async function startServer() {
    await createDatabase();
    
    const server = app.listen(PORT, () => {
        console.log(`🚀 Servidor SMARTSTUDIO LMS corriendo en http://localhost:${PORT}`);
        console.log(`📚 API disponible en http://localhost:${PORT}/api`);
    });
    return server;
}

// Solo iniciar el servidor si NO estamos en modo test
if (process.env.NODE_ENV !== 'test') {
    startServer().catch(console.error);
}

export default app;