import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'smartstudio',
    password: process.env.DB_PASSWORD || 'smartstudio123',
    database: process.env.DB_NAME || 'smartstudio_lms'
};

// ========== MIDDLEWARE DE DEBUG (TEMPORAL) ==========
app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.url}`);
    next();
});

// ========== FUNCIONES DE BASE DE DATOS ==========
async function createTables() {
    let connection;
    try {
        console.log('🔌 Conectando para crear tablas...');
        connection = await mysql.createConnection(dbConfig);
        
        console.log('🔧 Creando/verificando tablas...');
        
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('student', 'teacher', 'admin') DEFAULT 'student',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Tabla users verificada/creada');

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS courses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                instructor_id INT,
                price DECIMAL(10,2) DEFAULT 0,
                image_url VARCHAR(500),
                is_published BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Tabla courses verificada/creada');

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS modules (
                id INT AUTO_INCREMENT PRIMARY KEY,
                course_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                order_index INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Tabla modules verificada/creada');

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS lessons (
                id INT AUTO_INCREMENT PRIMARY KEY,
                module_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                content TEXT,
                video_url VARCHAR(500),
                duration INT DEFAULT 0,
                order_index INT DEFAULT 0,
                is_preview BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Tabla lessons verificada/creada');

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS student_progress (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                course_id INT NOT NULL,
                lesson_id INT NOT NULL,
                is_completed BOOLEAN DEFAULT false,
                completed_at TIMESTAMP NULL,
                progress_percentage DECIMAL(5,2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_progress (student_id, lesson_id)
            )
        `);
        console.log('✅ Tabla student_progress verificada/creada');

        const [tables] = await connection.execute('SHOW TABLES');
        console.log('📊 Tablas creadas:', tables.map(t => Object.values(t)[0]));

    } catch (error) {
        console.error('❌ Error creando tablas:', error.message);
        throw error;
    } finally {
        if (connection) await connection.end();
    }
}

async function createDatabase() {
    let connection;
    try {
        console.log('🔌 Conectando a MySQL...');
        connection = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password
        });
        
        await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
        console.log('✅ Base de datos verificada/creada');
        
    } catch (error) {
        console.error('❌ Error creando base de datos:', error.message);
        throw error;
    } finally {
        if (connection) await connection.end();
    }
}

async function getConnection() {
    return await mysql.createConnection(dbConfig);
}

// ========== MIDDLEWARE DE AUTENTICACIÓN ==========
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token de acceso requerido' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido' });
        }
        req.user = user;
        next();
    });
};

// ========== RUTAS DE LA API ==========

// RUTA DE SALUD (¡ESTA FALTABA!)
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'SMARTSTUDIO LMS API funcionando',
        timestamp: new Date().toISOString()
    });
});

// RUTAS DE AUTENTICACIÓN
app.post('/api/auth/register', async (req, res) => {
    let connection;
    try {
        const { name, email, password, role = 'student' } = req.body;
        
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' });
        }

        connection = await getConnection();

        const [existing] = await connection.execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'El usuario ya existe' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await connection.execute(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, role]
        );

        const token = jwt.sign(
            { userId: result.insertId, email, role },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'Usuario creado exitosamente',
            token,
            user: { id: result.insertId, name, email, role }
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
        if (connection) await connection.end();
    }
});

app.post('/api/auth/login', async (req, res) => {
    let connection;
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son requeridos' });
        }

        connection = await getConnection();

        const [users] = await connection.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'fallback_secret',
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

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
        if (connection) await connection.end();
    }
});

// RUTAS DE CURSOS
app.get('/api/courses', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        
        const [courses] = await connection.execute(`
            SELECT c.*, u.name as instructor_name 
            FROM courses c 
            LEFT JOIN users u ON c.instructor_id = u.id 
            WHERE c.is_published = true
            ORDER BY c.created_at DESC
        `);

        res.json(courses);
    } catch (error) {
        console.error('Error obteniendo cursos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
        if (connection) await connection.end();
    }
});

app.get('/api/courses/:id', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        
        const [courses] = await connection.execute(`
            SELECT c.*, u.name as instructor_name 
            FROM courses c 
            LEFT JOIN users u ON c.instructor_id = u.id 
            WHERE c.id = ?
        `, [req.params.id]);

        if (courses.length === 0) {
            return res.status(404).json({ error: 'Curso no encontrado' });
        }

        const course = courses[0];
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
    } catch (error) {
        console.error('Error obteniendo curso:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
        if (connection) await connection.end();
    }
});

// RUTA POR DEFECTO PARA RUTAS NO ENCONTRADAS
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Ruta no encontrada',
        path: req.originalUrl,
        availableRoutes: [
            'GET /api/health',
            'POST /api/auth/register', 
            'POST /api/auth/login',
            'GET /api/courses',
            'GET /api/courses/:id'
        ]
    });
});

// ========== INICIALIZACIÓN DEL SERVIDOR ==========
async function startServer() {
    try {
        console.log('🚀 Iniciando SMARTSTUDIO LMS...');
        
        await createDatabase();
        console.log('📦 Base de datos lista');
        
        await createTables();
        console.log('🗃️ Tablas listas');
        
        app.listen(PORT, () => {
            console.log(`🎉 Servidor SMARTSTUDIO LMS corriendo en http://localhost:${PORT}`);
            console.log(`📚 API disponible en http://localhost:${PORT}/api`);
            console.log(`✅ ¡Sistema listo para usar!`);
        });
        
    } catch (error) {
        console.error('💥 Error crítico iniciando servidor:', error.message);
        process.exit(1);
    }
}

startServer();