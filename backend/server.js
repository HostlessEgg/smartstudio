import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { check, validationResult } from 'express-validator';
import path from 'path';
import fs from 'fs';

// Optional AWS S3 presign imports
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import multer from 'multer';
import representativesRouter from './routes/representatives.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Security headers
app.use(helmet());

// Rate limiting (global) - can be disabled via env var to avoid flakiness during automated tests
const GLOBAL_RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const GLOBAL_RATE_LIMIT_MAX = process.env.GLOBAL_RATE_LIMIT_MAX ? Number(process.env.GLOBAL_RATE_LIMIT_MAX) : 100; // default prod-ish
let apiLimiter;
let authLimiter;
let quizSubmitLimiter;
let forumPostLimiter;

const runtimeRateLimitsDisabled = () => (
    process.env.RATE_LIMITS_DISABLED === '1' ||
    String(process.env.RATE_LIMITS_DISABLED).toLowerCase() === 'true' ||
    process.env.NODE_ENV === 'test'
);

// Helper to wrap a middleware and check the env at request time
const conditional = (mw) => {
    return (req, res, next) => {
        if (runtimeRateLimitsDisabled()) return next();
        return mw(req, res, next);
    };
};

apiLimiter = conditional(rateLimit({
    windowMs: GLOBAL_RATE_LIMIT_WINDOW,
    max: GLOBAL_RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
}));

authLimiter = conditional(rateLimit({
    windowMs: GLOBAL_RATE_LIMIT_WINDOW,
    max: process.env.AUTH_RATE_LIMIT_MAX ? Number(process.env.AUTH_RATE_LIMIT_MAX) : 10,
    standardHeaders: true,
    legacyHeaders: false,
}));

quizSubmitLimiter = conditional(rateLimit({
    windowMs: GLOBAL_RATE_LIMIT_WINDOW,
    max: process.env.QUIZ_SUBMIT_RATE_LIMIT_MAX ? Number(process.env.QUIZ_SUBMIT_RATE_LIMIT_MAX) : 30,
    standardHeaders: true,
    legacyHeaders: false,
}));

forumPostLimiter = conditional(rateLimit({
    windowMs: GLOBAL_RATE_LIMIT_WINDOW,
    max: process.env.FORUM_POST_RATE_LIMIT_MAX ? Number(process.env.FORUM_POST_RATE_LIMIT_MAX) : 30,
    standardHeaders: true,
    legacyHeaders: false,
}));

app.use(apiLimiter);

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root', 
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'smartstudio_lms'
};

// uploads folder for local fallback
const uploadsDir = path.join(process.cwd(), 'backend', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploads statically
app.use('/uploads', express.static(uploadsDir));

// Representatives router (endpoints para solicitud/consentimiento/visualización por representante)
app.use('/api/representatives', representativesRouter);

// Multer for fallback multipart uploads
const upload = multer({ dest: uploadsDir });

// Configure S3 client if env vars provided
let s3Client = null;
if (process.env.S3_BUCKET && process.env.AWS_REGION && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    s3Client = new S3Client({ region: process.env.AWS_REGION });
}

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

// Helper: registrar auditoría
const logAudit = async (req, action, entity = null, entityId = null, details = null) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const userId = req.user ? req.user.userId : null;
        const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || null;
        await connection.execute(
            'INSERT INTO audits (user_id, action, entity, entity_id, details, ip) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, action, entity, entityId ? String(entityId) : null, details ? JSON.stringify(details) : null, ip]
        );
        await connection.end();
    } catch (err) {
        console.error('Error registrando auditoría:', err);
    }
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

// ---------- ENDPOINTS DE USUARIOS / ROLES ----------

// Listar usuarios (filtros: role, tag, q=name|email) - solo Admin/Instructor
app.get('/api/users', authenticateToken, authorizeRoles(['teacher','admin']), async (req, res) => {
    const { role, tag, q } = req.query;
    // pagination
    let page = parseInt(req.query.page || '1', 10);
    let per_page = parseInt(req.query.per_page || '20', 10);
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(per_page) || per_page < 1) per_page = 20;
    per_page = Math.min(per_page, 100);

    const offset = (page - 1) * per_page;

    const connection = await mysql.createConnection(dbConfig);
    try {
        // Build base WHERE clause
        let where = ' WHERE 1=1';
        const params = [];
        if (role) { where += ' AND role = ?'; params.push(role); }
        if (tag) { where += ' AND JSON_CONTAINS(tags, ?)'; params.push(JSON.stringify(tag)); }
        if (q) { where += ' AND (name LIKE ? OR email LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
        if (typeof req.query.active !== 'undefined') {
            let activeVal = req.query.active;
            if (typeof activeVal === 'string') {
                if (activeVal === '0' || activeVal.toLowerCase() === 'false') activeVal = 0;
                else activeVal = 1;
            }
            where += ' AND active = ?';
            params.push(Number(activeVal) === 0 ? 0 : 1);
        }

        // Total count
        const countSql = `SELECT COUNT(*) as total FROM users ${where}`;
        const [countRows] = await connection.execute(countSql, params);
        const total = countRows && countRows[0] ? Number(countRows[0].total || 0) : 0;
        const total_pages = Math.max(1, Math.ceil(total / per_page));

        // Data page
        // Avoid using parameter placeholders for LIMIT/OFFSET because some MySQL drivers
        // treat them specially; inject numeric values safely since they are validated above.
        const dataSql = `SELECT id, name, email, role, active, avatar_url, occupation, tags, organization, created_at FROM users ${where} ORDER BY created_at DESC LIMIT ${per_page} OFFSET ${offset}`;
        const dataParams = params.slice();

        const [rows] = await connection.execute(dataSql, dataParams);
        await connection.end();

        res.json({
            meta: { total, total_pages, page, per_page },
            data: rows
        });
    } catch (err) {
        await connection.end();
        console.error('Error listando usuarios:', err);
        res.status(500).json({ error: 'Error interno' });
    }
});

// Obtener usuario por id (propio o Admin/Instructor)
app.get('/api/users/:id', authenticateToken, async (req, res) => {
    const id = Number(req.params.id);
    const requester = req.user;
    if (!requester) return res.status(401).json({ error: 'No autorizado' });

    // Permite ver si es el propio recurso o si es instructor/admin
    if (requester.userId !== id && !['teacher','admin'].includes(requester.role)) {
        return res.status(403).json({ error: 'Permisos insuficientes' });
    }

    const connection = await mysql.createConnection(dbConfig);
    try {
        const [rows] = await connection.execute('SELECT id, name, email, role, avatar_url, occupation, tags, organization, created_at FROM users WHERE id = ?', [id]);
        await connection.end();
        if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json(rows[0]);
    } catch (err) {
        await connection.end();
        console.error('Error obteniendo usuario:', err);
        res.status(500).json({ error: 'Error interno' });
    }
});

// Admin summary: counts and DB health
app.get('/api/admin/summary', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const [[{ users_count }]] = await connection.execute('SELECT COUNT(*) AS users_count FROM users');
        const [[{ courses_count }]] = await connection.execute('SELECT COUNT(*) AS courses_count FROM courses');
        const [[{ submissions_count }]] = await connection.execute('SELECT COUNT(*) AS submissions_count FROM submissions');
        const [[{ migrations_count }]] = await connection.execute('SELECT COUNT(*) AS migrations_count FROM migrations');

        // Additional metrics
        const [[{ forum_threads_count }]] = await connection.execute('SELECT COUNT(*) AS forum_threads_count FROM forum_threads');
        const [[{ quiz_submissions_count }]] = await connection.execute('SELECT COUNT(*) AS quiz_submissions_count FROM quiz_submissions');
        const [[{ assignments_count }]] = await connection.execute('SELECT COUNT(*) AS assignments_count FROM assignments');
        const [recentAssignments] = await connection.execute('SELECT id, title, start_at, end_at, created_by, created_at FROM assignments ORDER BY created_at DESC LIMIT 5');

        await connection.end();
        res.json({
            status: 'ok',
            db: {
                users: Number(users_count || 0),
                courses: Number(courses_count || 0),
                submissions: Number(submissions_count || 0),
                migrations: Number(migrations_count || 0),
                forum_threads: Number(forum_threads_count || 0),
                quiz_submissions: Number(quiz_submissions_count || 0),
                assignments: Number(assignments_count || 0)
            },
            recent_assignments: recentAssignments
        });
    } catch (err) {
        await connection.end();
        console.error('Error admin summary:', err);
        res.status(500).json({ error: 'Error interno' });
    }
});

// Endpoint para consultar logs de auditoría (admin)
app.get('/api/admin/audits', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
    const { page = 1, per_page = 50, q, action } = req.query;
    const p = Math.max(1, Number(page));
    const pp = Math.min(200, Math.max(1, Number(per_page)));
    const offset = (p - 1) * pp;
    try {
        const connection = await mysql.createConnection(dbConfig);
        let where = ' WHERE 1=1';
        const params = [];
        if (action) { where += ' AND action = ?'; params.push(action); }
        if (q) { where += ' AND (entity LIKE ? OR details LIKE ? OR ip LIKE ? )'; params.push(`%${q}%`, `%${q}%`, `%${q}%`); }

        const [countRows] = await connection.execute(`SELECT COUNT(*) as total FROM audits ${where}`, params);
        const total = countRows && countRows[0] ? Number(countRows[0].total || 0) : 0;

        const [rows] = await connection.execute(
            `SELECT id, user_id, action, entity, entity_id, details, ip, created_at FROM audits ${where} ORDER BY created_at DESC LIMIT ${pp} OFFSET ${offset}`,
            params
        );
        await connection.end();
        res.json({ meta: { total, page: p, per_page: pp, total_pages: Math.max(1, Math.ceil(total / pp)) }, data: rows });
    } catch (err) {
        console.error('Error fetching audits:', err);
        return res.status(500).json({ error: 'Error interno' });
    }
});

// Export audits as CSV (admin)
app.get('/api/admin/audits/export', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
    const { q, action } = req.query;
    try {
        const connection = await mysql.createConnection(dbConfig);
        let where = ' WHERE 1=1';
        const params = [];
        if (action) { where += ' AND action = ?'; params.push(action); }
        if (q) { where += ' AND (entity LIKE ? OR details LIKE ? OR ip LIKE ? )'; params.push(`%${q}%`, `%${q}%`, `%${q}%`); }

        const [rows] = await connection.execute(
            `SELECT id, user_id, action, entity, entity_id, details, ip, created_at FROM audits ${where} ORDER BY created_at DESC`,
            params
        );
        await connection.end();

        const escapeCsv = (value) => {
            const str = value === null || value === undefined ? '' : String(value);
            if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
            return str;
        };

        const header = ['id', 'user_id', 'action', 'entity', 'entity_id', 'details', 'ip', 'created_at'];
        const lines = [header.join(',')];
        for (const r of rows) {
            lines.push([
                r.id,
                r.user_id,
                r.action,
                r.entity,
                r.entity_id,
                r.details,
                r.ip,
                r.created_at
            ].map(escapeCsv).join(','));
        }

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="audits.csv"');
        res.send(lines.join('\n'));
    } catch (err) {
        console.error('Error exportando auditoría:', err);
        return res.status(500).json({ error: 'Error interno' });
    }
});

// Admin actions runner (minimal): Accepts { actions: ['id1','id2'] }
// In development allow unauthenticated calls for convenience; in production require admin auth.
if (process.env.NODE_ENV === 'development') {
    app.post('/api/admin/actions/run', async (req, res) => {
        try {
            const actions = Array.isArray(req.body?.actions) ? req.body.actions : [];
            console.log('Dev admin actions requested:', actions);
            return res.json({ message: `Enqueued ${actions.length} admin action(s)` });
        } catch (err) {
            console.error('Error running admin actions (dev):', err);
            return res.status(500).json({ error: 'Error ejecutando acciones' });
        }
    });
} else {
    app.post('/api/admin/actions/run', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
        try {
            const actions = Array.isArray(req.body?.actions) ? req.body.actions : [];
            console.log('Admin actions requested:', actions, 'by user', req.user?.userId);
            return res.json({ message: `Enqueued ${actions.length} admin action(s)` });
        } catch (err) {
            console.error('Error running admin actions:', err);
            return res.status(500).json({ error: 'Error ejecutando acciones' });
        }
    });
}

// Import users from CSV (admin)
app.post('/api/admin/import/users', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
    const { csv } = req.body;
    if (!csv) return res.status(400).json({ error: 'csv requerido en body' });

    const allowedRoles = new Set(['student', 'teacher', 'admin', 'guest']);
    const lines = csv.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return res.status(400).json({ error: 'csv vacío' });

    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    const hasHeader = header.includes('email') || header.includes('name') || header.includes('role') || header.includes('password');
    const dataLines = hasHeader ? lines.slice(1) : lines;

    const connection = await mysql.createConnection(dbConfig);
    const report = { imported: 0, skipped: 0, errors: [], temp_passwords: [] };
    try {
        for (const [idx, line] of dataLines.entries()) {
            const cols = line.split(',').map(p => p.trim());
            const rowIndex = hasHeader ? idx + 2 : idx + 1;

            let name = cols[0] || '';
            let email = cols[1] || '';
            let role = cols[2] || 'student';
            let password = cols[3] || '';

            if (hasHeader) {
                name = cols[header.indexOf('name')] || '';
                email = cols[header.indexOf('email')] || '';
                role = cols[header.indexOf('role')] || 'student';
                password = cols[header.indexOf('password')] || '';
            }

            if (!email || !name) {
                report.skipped++;
                report.errors.push({ line: rowIndex, error: 'name/email requeridos' });
                continue;
            }

            if (!allowedRoles.has(role)) role = 'student';

            let tempPassword = null;
            if (!password) {
                tempPassword = `Temp#${Math.random().toString(36).slice(2, 8)}A1`;
                password = tempPassword;
            }

            const hashed = await bcrypt.hash(password, 10);

            const [existing] = await connection.execute('SELECT id FROM users WHERE email = ?', [email]);
            if (existing.length > 0) {
                report.skipped++;
                report.errors.push({ line: rowIndex, email, error: 'email ya existe' });
                continue;
            }

            await connection.execute(
                'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                [name, email, hashed, role]
            );
            report.imported++;
            if (tempPassword) report.temp_passwords.push({ email, password: tempPassword });
        }

        await logAudit(req, 'import_users_csv', 'user', null, { report: { imported: report.imported, skipped: report.skipped, errors: report.errors } });
        await connection.end();
        res.json({ message: 'Importación completada', report });
    } catch (err) {
        await connection.end();
        console.error('Error importando usuarios:', err);
        res.status(500).json({ error: 'Error interno' });
    }
});

// Import enrollments from CSV (admin)
app.post('/api/admin/enrollments/bulk', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
    const { csv } = req.body;
    if (!csv) return res.status(400).json({ error: 'csv requerido en body' });

    const lines = csv.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return res.status(400).json({ error: 'csv vacío' });

    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    const hasHeader = header.includes('student_id') || header.includes('student_email') || header.includes('course_id');
    const dataLines = hasHeader ? lines.slice(1) : lines;

    const connection = await mysql.createConnection(dbConfig);
    const report = { imported: 0, skipped: 0, errors: [] };
    try {
        for (const [idx, line] of dataLines.entries()) {
            const cols = line.split(',').map(p => p.trim());
            const rowIndex = hasHeader ? idx + 2 : idx + 1;

            let studentId = cols[0] || '';
            let courseId = cols[1] || '';
            let studentEmail = cols[2] || '';

            if (hasHeader) {
                studentId = cols[header.indexOf('student_id')] || '';
                courseId = cols[header.indexOf('course_id')] || '';
                studentEmail = cols[header.indexOf('student_email')] || '';
            }

            if (!courseId) {
                report.skipped++;
                report.errors.push({ line: rowIndex, error: 'course_id requerido' });
                continue;
            }

            let studentIdResolved = studentId ? Number(studentId) : null;
            if (!studentIdResolved && studentEmail) {
                const [userRows] = await connection.execute('SELECT id FROM users WHERE email = ?', [studentEmail]);
                if (userRows.length > 0) studentIdResolved = userRows[0].id;
            }

            if (!studentIdResolved) {
                report.skipped++;
                report.errors.push({ line: rowIndex, error: 'student_id o student_email requerido' });
                continue;
            }

            const [courseRows] = await connection.execute('SELECT id FROM courses WHERE id = ?', [courseId]);
            if (courseRows.length === 0) {
                report.skipped++;
                report.errors.push({ line: rowIndex, error: 'course_id no existe', courseId });
                continue;
            }

            const [ins] = await connection.execute(
                'INSERT IGNORE INTO enrollments (student_id, course_id) VALUES (?, ?)',
                [studentIdResolved, courseId]
            );

            if (ins.affectedRows > 0) {
                report.imported++;
            } else {
                report.skipped++;
                report.errors.push({ line: rowIndex, error: 'ya inscrito', studentId: studentIdResolved, courseId });
            }
        }

        await logAudit(req, 'import_enrollments_csv', 'enrollment', null, { report: { imported: report.imported, skipped: report.skipped, errors: report.errors } });
        await connection.end();
        res.json({ message: 'Importación completada', report });
    } catch (err) {
        await connection.end();
        console.error('Error importando inscripciones:', err);
        res.status(500).json({ error: 'Error interno' });
    }
});

// Actualizar perfil (propio o Admin)
app.put('/api/users/:id', authenticateToken, async (req, res) => {
    const id = Number(req.params.id);
    const requester = req.user;
    if (!requester) return res.status(401).json({ error: 'No autorizado' });

    if (requester.userId !== id && requester.role !== 'admin') {
        return res.status(403).json({ error: 'Permisos insuficientes' });
    }

    const { name, occupation, organization, avatar_url, tags } = req.body;
    const connection = await mysql.createConnection(dbConfig);
    try {
        const tagsVal = Array.isArray(tags) ? JSON.stringify(tags) : null;
        await connection.execute(
            'UPDATE users SET name = ?, occupation = ?, organization = ?, avatar_url = ?, tags = ? WHERE id = ?',
            [name || null, occupation || null, organization || null, avatar_url || null, tagsVal, id]
        );
        await logAudit(req, 'update_user', 'user', id, { name, occupation, organization, tags });
        await connection.end();
        res.json({ message: 'Usuario actualizado' });
    } catch (err) {
        await connection.end();
        console.error('Error actualizando usuario:', err);
        res.status(500).json({ error: 'Error interno' });
    }
});

// Asignar/setear role a un usuario (solo Admin)
app.post('/api/users/:id/role', authenticateToken, authorizeRoles(['admin']), [ check('role').isIn(['student','teacher','admin','guest']) ], async (req, res) => {
    const id = Number(req.params.id);
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { role } = req.body;
    const connection = await mysql.createConnection(dbConfig);
    try {
        await connection.execute('UPDATE users SET role = ? WHERE id = ?', [role, id]);
        await logAudit(req, 'set_user_role', 'user', id, { role });
        await connection.end();
        res.json({ message: `Role actualizado a ${role}` });
    } catch (err) {
        await connection.end();
        console.error('Error actualizando role:', err);
        res.status(500).json({ error: 'Error interno' });
    }
});

// Resetear contraseña de un usuario (solo Admin)
app.post('/api/users/:id/reset-password', authenticateToken, authorizeRoles(['admin']), [
    check('password').isLength({ min: 8 }).withMessage('password mínimo 8 caracteres')
], async (req, res) => {
    const id = Number(req.params.id);
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { password } = req.body;
    const connection = await mysql.createConnection(dbConfig);
    try {
        const hashed = await bcrypt.hash(password, 10);
        const [resUpd] = await connection.execute('UPDATE users SET password = ? WHERE id = ?', [hashed, id]);
        await logAudit(req, 'reset_user_password', 'user', id, { affectedRows: resUpd?.affectedRows || 0 });
        await connection.end();
        res.json({ message: 'Contraseña actualizada' });
    } catch (err) {
        await connection.end();
        console.error('Error reseteando contraseña:', err);
        res.status(500).json({ error: 'Error interno' });
    }
});

// Acciones masivas: asignar role a múltiples usuarios (solo Admin)
app.post('/api/users/bulk-role', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
    try {
        const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter(x => Number.isInteger(Number(x))).map(Number) : [];
        const role = req.body?.role;
        if (!role || !['student','teacher','admin','guest'].includes(role)) {
            return res.status(400).json({ error: 'role inválido' });
        }
        if (!ids.length) return res.status(400).json({ error: 'ids requeridos' });

        const placeholders = ids.map(() => '?').join(',');
        const connection = await mysql.createConnection(dbConfig);
        try {
            const [resUpd] = await connection.execute(
                `UPDATE users SET role = ? WHERE id IN (${placeholders})`,
                [role, ...ids]
            );
            await logAudit(req, 'bulk_set_role', 'user', null, { role, ids, affectedRows: resUpd?.affectedRows || 0 });
            await connection.end();
            return res.json({ message: 'Roles actualizados', affected: resUpd?.affectedRows || 0 });
        } catch (err) {
            await connection.end();
            console.error('Error en bulk-role:', err);
            return res.status(500).json({ error: 'Error interno' });
        }
    } catch (err) {
        console.error('Error procesando bulk-role:', err);
        return res.status(500).json({ error: 'Error interno' });
    }
});

// Acciones masivas: desactivar múltiples usuarios (solo Admin)
app.post('/api/users/bulk-deactivate', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
    try {
        const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter(x => Number.isInteger(Number(x))).map(Number) : [];
        if (!ids.length) return res.status(400).json({ error: 'ids requeridos' });

        const placeholders = ids.map(() => '?').join(',');
        const connection = await mysql.createConnection(dbConfig);
        try {
            const [resUpd] = await connection.execute(
                `UPDATE users SET active = 0 WHERE id IN (${placeholders})`,
                [...ids]
            );
            await logAudit(req, 'bulk_deactivate', 'user', null, { ids, affectedRows: resUpd?.affectedRows || 0 });
            await connection.end();
            return res.json({ message: 'Usuarios desactivados', affected: resUpd?.affectedRows || 0 });
        } catch (err) {
            await connection.end();
            console.error('Error en bulk-deactivate:', err);
            return res.status(500).json({ error: 'Error interno' });
        }
    } catch (err) {
        console.error('Error procesando bulk-deactivate:', err);
        return res.status(500).json({ error: 'Error interno' });
    }
});

// Acciones masivas: reactivar múltiples usuarios (solo Admin)
app.post('/api/users/bulk-reactivate', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
    try {
        const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter(x => Number.isInteger(Number(x))).map(Number) : [];
        if (!ids.length) return res.status(400).json({ error: 'ids requeridos' });

        const placeholders = ids.map(() => '?').join(',');
        const connection = await mysql.createConnection(dbConfig);
        try {
            const [resUpd] = await connection.execute(
                `UPDATE users SET active = 1 WHERE id IN (${placeholders})`,
                [...ids]
            );
            await logAudit(req, 'bulk_reactivate', 'user', null, { ids, affectedRows: resUpd?.affectedRows || 0 });
            await connection.end();
            return res.json({ message: 'Usuarios reactivados', affected: resUpd?.affectedRows || 0 });
        } catch (err) {
            await connection.end();
            console.error('Error en bulk-reactivate:', err);
            return res.status(500).json({ error: 'Error interno' });
        }
    } catch (err) {
        console.error('Error procesando bulk-reactivate:', err);
        return res.status(500).json({ error: 'Error interno' });
    }
});


// RUTAS DE CURSOS
app.get('/api/courses', async (req, res) => {
    // soporta filtros básicos y paginación
    try {
        const { category, q } = req.query;
        let page = parseInt(req.query.page || '1', 10);
        let per_page = parseInt(req.query.per_page || '20', 10);
        if (isNaN(page) || page < 1) page = 1;
        if (isNaN(per_page) || per_page < 1) per_page = 20;
        per_page = Math.min(per_page, 100);
        const offset = (page - 1) * per_page;

        const connection = await mysql.createConnection(dbConfig);

        let where = ' WHERE c.is_published = true';
        const params = [];
        if (category) { where += ' AND c.category = ?'; params.push(category); }
        if (q) { where += ' AND (c.title LIKE ? OR c.description LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }

        // total
        const [countRows] = await connection.execute(`SELECT COUNT(*) as total FROM courses c ${where}`, params);
        const total = countRows && countRows[0] ? Number(countRows[0].total || 0) : 0;
        const total_pages = Math.max(1, Math.ceil(total / per_page));

        // Some MySQL drivers may not accept placeholders for LIMIT/OFFSET reliably,
        // so interpolate the numeric values directly (they are validated above).
        const dataSql = `SELECT c.*, u.name as instructor_name FROM courses c LEFT JOIN users u ON c.instructor_id = u.id ${where} ORDER BY c.created_at DESC LIMIT ${per_page} OFFSET ${offset}`;
        const [courses] = await connection.execute(dataSql, params);
        await connection.end();

        res.json({ meta: { total, total_pages, page, per_page }, data: courses });
    } catch (error) {
        console.error('Error obteniendo cursos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Get courses for current user: enrolled (student) or own courses (teacher/admin)
app.get('/api/my-courses', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const role = req.user.role;
    const connection = await mysql.createConnection(dbConfig);
    try {
        let rows;
        if (role === 'student') {
            const [r] = await connection.execute(
                `SELECT c.*, u.name as instructor_name
                 FROM courses c
                 JOIN enrollments e ON e.course_id = c.id
                 LEFT JOIN users u ON c.instructor_id = u.id
                 WHERE e.student_id = ?`, [userId]
            );
            rows = r;
        } else if (role === 'teacher') {
            const [r] = await connection.execute(
                `SELECT c.*, u.name as instructor_name FROM courses c LEFT JOIN users u ON c.instructor_id = u.id WHERE c.instructor_id = ?`, [userId]
            );
            rows = r;
        } else {
            // admin sees all courses
            const [r] = await connection.execute(`SELECT c.*, u.name as instructor_name FROM courses c LEFT JOIN users u ON c.instructor_id = u.id`);
            rows = r;
        }
        await connection.end();
        res.json(rows);
    } catch (err) {
        await connection.end();
        console.error('Error getting my courses:', err);
        res.status(500).json({ error: 'Error interno' });
    }
});

// Teacher courses (paginated, filter by q)
app.get('/api/teacher/courses', authenticateToken, authorizeRoles(['teacher','admin']), async (req, res) => {
    const userId = req.user.userId;
    const isAdmin = req.user.role === 'admin';
    let page = parseInt(req.query.page || '1', 10);
    let per_page = parseInt(req.query.per_page || '20', 10);
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(per_page) || per_page < 1) per_page = 20;
    per_page = Math.min(per_page, 100);
    const offset = (page - 1) * per_page;
    const q = req.query.q ? String(req.query.q).trim() : '';

    const connection = await mysql.createConnection(dbConfig);
    try {
        const params = [];
        let where = 'WHERE 1=1';
        if (!isAdmin) {
            where += ' AND c.instructor_id = ?';
            params.push(userId);
        }
        if (q) {
            where += ' AND (c.title LIKE ? OR c.description LIKE ?)';
            params.push(`%${q}%`, `%${q}%`);
        }

        const [countRows] = await connection.execute(`SELECT COUNT(*) as total FROM courses c ${where}`, params);
        const total = countRows && countRows[0] ? Number(countRows[0].total || 0) : 0;
        const total_pages = Math.max(1, Math.ceil(total / per_page));

        const dataSql = `SELECT c.*, u.name as instructor_name FROM courses c LEFT JOIN users u ON c.instructor_id = u.id ${where} ORDER BY c.created_at DESC LIMIT ${per_page} OFFSET ${offset}`;
        const [rows] = await connection.execute(dataSql, params);
        await connection.end();
        res.json({ meta: { total, total_pages, page, per_page }, data: rows });
    } catch (err) {
        await connection.end();
        console.error('Error getting teacher courses:', err);
        res.status(500).json({ error: 'Error interno' });
    }
});

// Teacher activities
app.get('/api/teacher/activities', authenticateToken, authorizeRoles(['teacher','admin']), async (req, res) => {
    const courseId = req.query.course_id;
    if (!courseId) return res.status(400).json({ error: 'course_id requerido' });
    const connection = await mysql.createConnection(dbConfig);
    try {
        // verify ownership for teachers
        if (req.user.role === 'teacher') {
            const [c] = await connection.execute('SELECT id FROM courses WHERE id = ? AND instructor_id = ?', [courseId, req.user.userId]);
            if (!c || c.length === 0) {
                await connection.end();
                return res.status(403).json({ error: 'No autorizado para este curso' });
            }
        }
        const [rows] = await connection.execute(
            'SELECT * FROM teacher_activities WHERE course_id = ? ORDER BY created_at DESC',
            [courseId]
        );
        await connection.end();
        res.json(rows);
    } catch (err) {
        await connection.end();
        console.error('Error getting teacher activities:', err);
        res.status(500).json({ error: 'Error interno' });
    }
});

app.post('/api/teacher/activities', authenticateToken, authorizeRoles(['teacher','admin']), async (req, res) => {
    const { course_id, title, description, due_at, attachments } = req.body;
    if (!course_id || !title) return res.status(400).json({ error: 'course_id y title son requeridos' });
    const connection = await mysql.createConnection(dbConfig);
    try {
        // verify ownership for teachers
        if (req.user.role === 'teacher') {
            const [c] = await connection.execute('SELECT id FROM courses WHERE id = ? AND instructor_id = ?', [course_id, req.user.userId]);
            if (!c || c.length === 0) {
                await connection.end();
                return res.status(403).json({ error: 'No autorizado para este curso' });
            }
        }

        let due = null;
        if (due_at) {
            const d = new Date(due_at);
            if (!isNaN(d.getTime())) {
                due = d.toISOString().slice(0, 19).replace('T', ' ');
            }
        }

        const attachmentsJson = attachments ? JSON.stringify(attachments) : null;
        const [insertRes] = await connection.execute(
            'INSERT INTO teacher_activities (course_id, title, description, due_at, attachments, created_by) VALUES (?, ?, ?, ?, ?, ?)',
            [course_id, title, description || null, due, attachmentsJson, req.user.userId]
        );
        const activityId = insertRes.insertId;
        await logAudit(req, 'teacher_create_activity', 'teacher_activities', activityId, { course_id, title });
        await connection.end();
        res.status(201).json({ id: activityId, message: 'Actividad creada' });
    } catch (err) {
        await connection.end();
        console.error('Error creando actividad:', err);
        res.status(500).json({ error: 'Error interno' });
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

// Crear un curso (teacher/admin)
app.post('/api/courses', authenticateToken, authorizeRoles(['teacher','admin']), [
    check('title').isString().notEmpty().withMessage('title requerido')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { title, description, category, level, instructor_id, modules } = req.body;
    const connection = await mysql.createConnection(dbConfig);
    try {
        // Basic validation for nested structure
        if (modules && !Array.isArray(modules)) {
            await connection.end();
            return res.status(400).json({ error: 'modules debe ser un array' });
        }

        // start transaction
        await connection.beginTransaction();

        const [courseResult] = await connection.execute(
            'INSERT INTO courses (title, description, category, level, instructor_id, state) VALUES (?, ?, ?, ?, ?, ?)',
            [title, description || null, category || null, level || 'beginner', instructor_id || req.user.userId, 'draft']
        );
        const courseId = courseResult.insertId;

        const insertedModules = [];
        if (Array.isArray(modules)) {
            const allowedLessonTypes = new Set(['video','text','quiz','pdf']);
            for (let mi = 0; mi < modules.length; mi++) {
                const m = modules[mi] || {};
                if (!m.title || String(m.title).trim() === '') {
                    await connection.rollback();
                    await connection.end();
                    return res.status(400).json({ error: `Module ${mi + 1} requires title` });
                }

                const [mRes] = await connection.execute(
                    'INSERT INTO modules (course_id, title, description, order_index) VALUES (?, ?, ?, ?)',
                    [courseId, m.title, m.description || null, m.order_index || 0]
                );
                const moduleId = mRes.insertId;

                const insertedLessons = [];
                if (m.lessons && !Array.isArray(m.lessons)) {
                    await connection.rollback();
                    await connection.end();
                    return res.status(400).json({ error: `lessons for module ${m.title} must be an array` });
                }

                if (Array.isArray(m.lessons)) {
                    for (let li = 0; li < m.lessons.length; li++) {
                        const lesson = m.lessons[li] || {};
                        if (!lesson.title || String(lesson.title).trim() === '') {
                            await connection.rollback();
                            await connection.end();
                            return res.status(400).json({ error: `Lesson ${li + 1} in module ${m.title} requires title` });
                        }
                        if (lesson.lesson_type && !allowedLessonTypes.has(lesson.lesson_type)) {
                            await connection.rollback();
                            await connection.end();
                            return res.status(400).json({ error: `Invalid lesson_type for lesson ${lesson.title}` });
                        }

                        const [lRes] = await connection.execute(
                            'INSERT INTO lessons (module_id, title, content, lesson_type, video_url, file_url, order_index, duration_minutes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                            [moduleId, lesson.title, lesson.content || null, lesson.lesson_type || 'text', lesson.video_url || null, lesson.file_url || null, lesson.order_index || 0, lesson.duration_minutes || 0]
                        );
                        insertedLessons.push({ id: lRes.insertId, title: lesson.title, lesson_type: lesson.lesson_type || 'text' });
                    }
                }

                insertedModules.push({ id: moduleId, title: m.title, lessons: insertedLessons });
            }
        }

        await connection.commit();

        await logAudit(req, 'create_course', 'course', courseId, { title, modulesCount: insertedModules.length });
        await connection.end();

        // Build response shape
        const courseResponse = { id: courseId, title, description: description || null, category: category || null, level: level || 'beginner', modules: insertedModules };
        res.status(201).json({ course: courseResponse });
    } catch (err) {
        try { await connection.rollback(); } catch (e) {}
        await connection.end();
        console.error('Error creando curso (nested):', err);
        res.status(500).json({ error: 'Error interno' });
    }
});

// Editar curso (teacher/admin)
app.put('/api/courses/:id', authenticateToken, authorizeRoles(['teacher','admin']), async (req, res) => {
    const id = req.params.id;
    const { title, description, category, level } = req.body;
    const connection = await mysql.createConnection(dbConfig);
    try {
        await connection.execute(
            'UPDATE courses SET title = ?, description = ?, category = ?, level = ?, updated_at = NOW() WHERE id = ?',
            [title, description || null, category || null, level || 'beginner', id]
        );
        await logAudit(req, 'update_course', 'course', id, { title });
        await connection.end();
        res.json({ message: 'Curso actualizado' });
    } catch (err) {
        await connection.end();
        console.error('Error actualizando curso:', err);
        res.status(500).json({ error: 'Error interno' });
    }
});

// Publicar / cambiar estado de curso (teacher/admin)
app.post('/api/courses/:id/state', authenticateToken, authorizeRoles(['teacher','admin']), [
    check('state').isIn(['draft','published','archived']).withMessage('state inválido')
], async (req, res) => {
    const id = req.params.id;
    const { state } = req.body;
    const connection = await mysql.createConnection(dbConfig);
    try {
        await connection.execute('UPDATE courses SET state = ?, updated_at = NOW() WHERE id = ?', [state, id]);
        await logAudit(req, 'change_course_state', 'course', id, { state });
        await connection.end();
        res.json({ message: `Curso actualizado a estado ${state}` });
    } catch (err) {
        await connection.end();
        console.error('Error cambiando estado del curso:', err);
        res.status(500).json({ error: 'Error interno' });
    }
});

// Inscribir usuario a un curso (simple)
app.post('/api/enrollments', authenticateToken, authorizeRoles(['teacher','admin']), [
    check('student_id').isInt(),
    check('course_id').isInt()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { student_id, course_id } = req.body;
    const connection = await mysql.createConnection(dbConfig);
    try {
        const [result] = await connection.execute('INSERT IGNORE INTO enrollments (student_id, course_id) VALUES (?, ?)', [student_id, course_id]);
        await logAudit(req, 'enroll_user', 'enrollment', result.insertId || null, { student_id, course_id });
        await connection.end();
        res.status(201).json({ message: 'Usuario inscrito', id: result.insertId });
    } catch (err) {
        await connection.end();
        console.error('Error inscribiendo usuario:', err);
        res.status(500).json({ error: 'Error interno' });
    }
});

// Student self-enroll to a course
app.post('/api/courses/:id/enroll', authenticateToken, async (req, res) => {
    const courseId = Number(req.params.id);
    const studentId = req.user.userId;
    if (!courseId || Number.isNaN(courseId)) return res.status(400).json({ error: 'Invalid course id' });

    const connection = await mysql.createConnection(dbConfig);
    try {
        // verify course exists
        const [courses] = await connection.execute('SELECT id FROM courses WHERE id = ?', [courseId]);
        if (courses.length === 0) {
            await connection.end();
            return res.status(404).json({ error: 'Course not found' });
        }

        // check existing enrollment
        const [existing] = await connection.execute('SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?', [studentId, courseId]);
        if (existing.length > 0) {
            await connection.end();
            return res.status(409).json({ message: 'Already enrolled', enrolled: true });
        }

        const [ins] = await connection.execute('INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)', [studentId, courseId]);
        await logAudit(req, 'self_enroll', 'enrollment', ins.insertId || null, { studentId, courseId });
        await connection.end();
        res.json({ message: 'Enrolled successfully', enrolled: true });
    } catch (err) {
        await connection.end();
        console.error('Error enrolling student:', err);
        res.status(500).json({ error: 'Error interno' });
    }
});

// Check if current user is enrolled in course
app.get('/api/courses/:id/enrolled', authenticateToken, async (req, res) => {
    const courseId = Number(req.params.id);
    const studentId = req.user.userId;
    if (!courseId || Number.isNaN(courseId)) return res.status(400).json({ error: 'Invalid course id' });

    const connection = await mysql.createConnection(dbConfig);
    try {
        const [rows] = await connection.execute('SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?', [studentId, courseId]);
        await connection.end();
        res.json({ enrolled: rows.length > 0 });
    } catch (err) {
        await connection.end();
        console.error('Error checking enrollment:', err);
        res.status(500).json({ error: 'Error interno' });
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

        // Normalize into an English-keyed structure: { levels: [ { id,name, grades: [ { id,name,total_hours,total_sections, subjects: [...] } ] } ] }
        const levelsMap = new Map();
        for (const r of rows) {
            if (!levelsMap.has(r.level_id)) {
                levelsMap.set(r.level_id, { id: r.level_id, name: r.level_name, grades: new Map() });
            }
            const levelObj = levelsMap.get(r.level_id);

            if (!levelObj.grades.has(r.grade_id)) {
                levelObj.grades.set(r.grade_id, {
                    id: r.grade_id,
                    name: r.grade_name,
                    total_hours: r.total_hours,
                    total_sections: r.total_sections,
                    subjects: []
                });
            }

            const gradeObj = levelObj.grades.get(r.grade_id);
            gradeObj.subjects.push({ id: r.subject_id, name: r.subject_name, hours: r.subject_hours, sections: r.subject_sections });
        }

        const levels = [];
        for (const [, lvl] of levelsMap) {
            const grades = [];
            for (const [, g] of lvl.grades) grades.push(g);
            levels.push({ id: lvl.id, name: lvl.name, grades });
        }

        await connection.end();
        res.json({ levels });
    } catch (err) {
        await connection.end();
        console.error('Error obteniendo curriculum:', err);
        res.status(500).json({ error: 'Error interno' });
    }
});

    // Endpoint to generate presigned upload URL for S3 (or fallback info)
    app.post('/api/uploads/presign', authenticateToken, async (req, res) => {
        const { filename, contentType } = req.body || {};
        if (!filename) return res.status(400).json({ error: 'filename requerido' });

        // If S3 configured, create presigned PUT URL
        if (s3Client) {
            try {
                const bucket = process.env.S3_BUCKET;
                const region = process.env.AWS_REGION;
                const key = `submissions/${Date.now()}-${Math.random().toString(36).slice(2,8)}-${filename}`;
                const putCommand = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType || 'application/octet-stream' });
                const uploadUrl = await getSignedUrl(s3Client, putCommand, { expiresIn: 900 }); // 15 minutes
                // public URL assuming bucket is public or uses presigned GETs; adapt if using CloudFront
                const fileUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
                await logAudit(req, 'presign_upload', 'upload', null, { key });
                return res.json({ uploadUrl, fileUrl, key, expiresIn: 900 });
            } catch (err) {
                console.error('Error generating presign URL:', err);
                return res.status(500).json({ error: 'Error generando presigned URL' });
            }
        }

        // Fallback: server will accept multipart upload at /api/uploads
        return res.status(200).json({ fallback: true, uploadEndpoint: '/api/uploads' });
    });

    // Fallback endpoint to accept multipart file upload and return a local URL
    app.post('/api/uploads', authenticateToken, upload.single('file'), async (req, res) => {
        try {
            if (!req.file) return res.status(400).json({ error: 'file required' });
            const localPath = `/uploads/${req.file.filename}`;
            await logAudit(req, 'upload_file', 'upload', null, { originalName: req.file.originalname, path: localPath });
            res.status(201).json({ fileUrl: `${req.protocol}://${req.get('host')}${localPath}` });
        } catch (err) {
            console.error('Error storing uploaded file:', err);
            res.status(500).json({ error: 'Error guardando archivo' });
        }
    });

// ---------- ENDPOINTS PARA ASSIGNMENTS (CALENDARIO) ----------

// Listar assignments, opcionalmente filtrar por gradeId, subjectId, rango de fechas
app.get('/api/assignments', authenticateToken, async (req, res) => {
    const { gradeId, subjectId, from, to, created_by } = req.query;
    const connection = await mysql.createConnection(dbConfig);
    try {
        let sql = 'SELECT a.*, g.name as grade_name, s.name as subject_name, u.name as author_name FROM assignments a LEFT JOIN curriculum_grades g ON a.grade_id = g.id LEFT JOIN subjects s ON a.subject_id = s.id LEFT JOIN users u ON a.created_by = u.id WHERE 1=1';
        const params = [];
        if (gradeId) { sql += ' AND a.grade_id = ?'; params.push(gradeId); }
        if (subjectId) { sql += ' AND a.subject_id = ?'; params.push(subjectId); }
        if (created_by) { sql += ' AND a.created_by = ?'; params.push(created_by); }
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

// Assignments para el estudiante autenticado, con estado de entrega
app.get('/api/my/assignments', authenticateToken, async (req, res) => {
    const studentId = req.user.userId;
    const gradeId = req.query.gradeId || req.user.grade_id || null;
    const subjectId = req.query.subjectId || null;
    const connection = await mysql.createConnection(dbConfig);
    try {
        let sql = `SELECT a.*, g.name as grade_name, s.name as subject_name,
                   sub.id as submission_id, sub.score, sub.feedback, sub.created_at as submitted_at
                   FROM assignments a
                   LEFT JOIN curriculum_grades g ON a.grade_id = g.id
                   LEFT JOIN subjects s ON a.subject_id = s.id
                   LEFT JOIN submissions sub ON sub.assignment_id = a.id AND sub.student_id = ?
                   WHERE 1=1`;
        const params = [studentId];
        if (gradeId) { sql += ' AND a.grade_id = ?'; params.push(gradeId); }
        if (subjectId) { sql += ' AND a.subject_id = ?'; params.push(subjectId); }
        sql += ' ORDER BY a.start_at ASC';

        const [rows] = await connection.execute(sql, params);
        const mapped = rows.map(r => ({
            ...r,
            status: r.submission_id ? 'submitted' : 'pending'
        }));
        await connection.end();
        res.json(mapped);
    } catch (err) {
        await connection.end();
        console.error('Error obteniendo assignments del estudiante:', err);
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

// ---------- ENDPOINTS PARA SUBMISSIONS (ENTREGAS) ----------

// Student submits an assignment (text + optional file_url)
app.post('/api/assignments/:id/submissions', authenticateToken, async (req, res) => {
    const assignmentId = Number(req.params.id);
    const studentId = req.user.userId;
    const { text_submission, file_url } = req.body;
    if (!assignmentId || Number.isNaN(assignmentId)) return res.status(400).json({ error: 'Invalid assignment id' });

    const connection = await mysql.createConnection(dbConfig);
    try {
        // verify assignment exists
        const [assignRows] = await connection.execute('SELECT id, start_at FROM assignments WHERE id = ?', [assignmentId]);
        if (assignRows.length === 0) {
            await connection.end();
            return res.status(404).json({ error: 'Assignment not found' });
        }

        const [ins] = await connection.execute(
            'INSERT INTO submissions (assignment_id, student_id, file_url, text_submission) VALUES (?, ?, ?, ?)',
            [assignmentId, studentId, file_url || null, text_submission || null]
        );

        await logAudit(req, 'submit_assignment', 'submission', ins.insertId, { assignmentId, studentId });
        await connection.end();
        res.status(201).json({ message: 'Submission created', submissionId: ins.insertId });
    } catch (err) {
        await connection.end();
        console.error('Error creating submission:', err);
        res.status(500).json({ error: 'Error interno' });
    }
});

// Instructors: list submissions for an assignment
app.get('/api/assignments/:id/submissions', authenticateToken, authorizeRoles(['teacher','admin']), async (req, res) => {
    const assignmentId = Number(req.params.id);
    const connection = await mysql.createConnection(dbConfig);
    try {
        const [rows] = await connection.execute(
            `SELECT s.*, u.name as student_name, u.email as student_email
             FROM submissions s
             LEFT JOIN users u ON s.student_id = u.id
             WHERE s.assignment_id = ? ORDER BY s.created_at DESC`,
            [assignmentId]
        );
        await connection.end();
        res.json(rows);
    } catch (err) {
        await connection.end();
        console.error('Error listing submissions:', err);
        res.status(500).json({ error: 'Error interno' });
    }
});

// View single submission (student can view own, teacher/admin can view any)
app.get('/api/submissions/:id', authenticateToken, async (req, res) => {
    const subId = Number(req.params.id);
    const userId = req.user.userId;
    const userRole = req.user.role;
    const connection = await mysql.createConnection(dbConfig);
    try {
        const [rows] = await connection.execute('SELECT * FROM submissions WHERE id = ?', [subId]);
        if (rows.length === 0) { await connection.end(); return res.status(404).json({ error: 'Submission not found' }); }
        const submission = rows[0];
        if (userRole !== 'teacher' && userRole !== 'admin' && submission.student_id !== userId) {
            await connection.end();
            return res.status(403).json({ error: 'Permisos insuficientes' });
        }
        await connection.end();
        res.json(submission);
    } catch (err) {
        await connection.end();
        console.error('Error fetching submission:', err);
        res.status(500).json({ error: 'Error interno' });
    }
});

// List submissions of current student (optional filter by assignment_id)
app.get('/api/my/submissions', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const assignmentId = req.query.assignment_id ? Number(req.query.assignment_id) : null;
    const connection = await mysql.createConnection(dbConfig);
    try {
        let sql = `SELECT s.*, a.title as assignment_title FROM submissions s LEFT JOIN assignments a ON s.assignment_id = a.id WHERE s.student_id = ?`;
        const params = [userId];
        if (assignmentId) {
            sql += ' AND s.assignment_id = ?';
            params.push(assignmentId);
        }
        sql += ' ORDER BY s.created_at DESC';
        const [rows] = await connection.execute(sql, params);
        await connection.end();
        res.json(rows);
    } catch (err) {
        await connection.end();
        console.error('Error obteniendo submissions del estudiante:', err);
        res.status(500).json({ error: 'Error interno' });
    }
});

// Grade a submission (teacher/admin)
app.post('/api/submissions/:id/grade', authenticateToken, authorizeRoles(['teacher','admin']), [
    check('score').optional().isNumeric(),
    check('feedback').optional().isString()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const subId = Number(req.params.id);
    const { score, feedback } = req.body;
    const connection = await mysql.createConnection(dbConfig);
    try {
        const [rows] = await connection.execute('SELECT * FROM submissions WHERE id = ?', [subId]);
        if (rows.length === 0) { await connection.end(); return res.status(404).json({ error: 'Submission not found' }); }
        await connection.execute('UPDATE submissions SET score = ?, feedback = ?, updated_at = NOW() WHERE id = ?', [score || null, feedback || null, subId]);
        await logAudit(req, 'grade_submission', 'submission', subId, { score, feedback });
        await connection.end();
        res.json({ message: 'Submission graded' });
    } catch (err) {
        await connection.end();
        console.error('Error grading submission:', err);
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

// Cohortes: crear
app.post('/api/cohorts', authenticateToken, authorizeRoles(['teacher','admin']), [
    check('name').isString().notEmpty(),
    check('course_id').isInt()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { name, course_id, start_date, end_date, rules, max_capacity, visibility } = req.body;
    const connection = await mysql.createConnection(dbConfig);
    try {
        const [result] = await connection.execute(
            'INSERT INTO cohorts (name, course_id, start_date, end_date, rules, max_capacity, visibility) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, course_id, start_date || null, end_date || null, rules ? JSON.stringify(rules) : null, max_capacity || null, visibility || 'private']
        );
        await logAudit(req, 'create_cohort', 'cohort', result.insertId, { name, course_id });
        await connection.end();
        res.status(201).json({ message: 'Cohorte creada', id: result.insertId });
    } catch (err) {
        await connection.end();
        console.error('Error creando cohorte:', err);
        res.status(500).json({ error: 'Error interno' });
    }
});

// Importar miembros a cohorte desde CSV (csv con columna email o user_id)
app.post('/api/cohorts/:id/import-members', authenticateToken, authorizeRoles(['teacher','admin']), async (req, res) => {
    const cohortId = req.params.id;
    const { csv } = req.body; // expects CSV text
    if (!csv) return res.status(400).json({ error: 'csv requerido en body' });
    const lines = csv.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const connection = await mysql.createConnection(dbConfig);
    const report = { imported: 0, skipped: 0, errors: [] };
    try {
        for (const line of lines) {
            const parts = line.split(',').map(p => p.trim());
            try {
                if (/^\d+$/.test(parts[0])) {
                    const userId = Number(parts[0]);
                    await connection.execute('INSERT IGNORE INTO cohort_members (cohort_id, user_id) VALUES (?, ?)', [cohortId, userId]);
                    report.imported++;
                } else if (parts[0].includes('@')) {
                    const email = parts[0];
                    const [rows] = await connection.execute('SELECT id FROM users WHERE email = ?', [email]);
                    if (rows.length > 0) {
                        const uid = rows[0].id;
                        await connection.execute('INSERT IGNORE INTO cohort_members (cohort_id, user_id) VALUES (?, ?)', [cohortId, uid]);
                        report.imported++;
                    } else {
                        report.errors.push({ line, error: 'user not found' });
                        report.skipped++;
                    }
                } else {
                    report.errors.push({ line, error: 'invalid format' });
                    report.skipped++;
                }
            } catch (inner) {
                report.errors.push({ line, error: inner.message });
            }
        }
        await logAudit(req, 'import_cohort_members', 'cohort', cohortId, { report });
        await connection.end();
        res.json(report);
    } catch (err) {
        await connection.end();
        console.error('Error importando miembros:', err);
        res.status(500).json({ error: 'Error interno' });
    }
});

// Inicializar servidor
async function startServer() {
    await createDatabase();
    
    const HOST = process.env.HOST || '0.0.0.0';
    const server = app.listen(PORT, HOST, () => {
        console.log(`🚀 Servidor SMARTSTUDIO LMS corriendo en http://${HOST}:${PORT}`);
        console.log(`📚 API disponible en http://${HOST}:${PORT}/api`);
    });
    return server;
}

// Iniciar el servidor normalmente, pero permitir forzarlo en modo `test`
// (útil en CI donde arrancamos el proceso externamente).
if (process.env.NODE_ENV !== 'test' || process.env.FORCE_START === '1') {
    startServer().catch(console.error);
}

export default app;