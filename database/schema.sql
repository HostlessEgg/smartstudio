-- Crear base de datos y usarla
CREATE DATABASE IF NOT EXISTS smartstudio_lms;
USE smartstudio_lms;

-- Forzar recreación limpia (evita conflictos con columnas faltantes)
SET FOREIGN_KEY_CHECKS=0;
DROP TABLE IF EXISTS student_progress;
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS lessons;
DROP TABLE IF EXISTS modules;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS=1;

-- Tabla de usuarios
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'teacher', 'admin') DEFAULT 'student',
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de cursos
CREATE TABLE courses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
    instructor_id INT,
    thumbnail_url VARCHAR(500),
    price DECIMAL(10,2) DEFAULT 0.00,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Tabla de módulos
CREATE TABLE modules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Tabla de lecciones
CREATE TABLE lessons (
    id INT PRIMARY KEY AUTO_INCREMENT,
    module_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    lesson_type ENUM('video', 'text', 'quiz', 'pdf') DEFAULT 'text',
    video_url VARCHAR(500),
    file_url VARCHAR(500),
    order_index INT DEFAULT 0,
    duration_minutes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

-- Tabla de progreso de estudiantes
CREATE TABLE student_progress (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    lesson_id INT NOT NULL,
    course_id INT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP NULL,
    score DECIMAL(5,2) DEFAULT 0.00,
    time_spent_minutes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_lesson (student_id, lesson_id)
);

-- Tabla de inscripciones
CREATE TABLE enrollments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_course (student_id, course_id)
);

-- Datos de ejemplo
INSERT INTO users (id, name, email, password, role) VALUES 
(1, 'Admin SmartStudio', 'admin@smartstudio.com', '$2b$10$ExampleHash', 'admin'),
(2, 'Profesor Juan Pérez', 'profesor@smartstudio.com', '$2b$10$ExampleHash', 'teacher'),
(3, 'Estudiante María García', 'estudiante@smartstudio.com', '$2b$10$ExampleHash', 'student');

INSERT INTO courses (id, title, description, category, level, instructor_id, is_published) VALUES 
(1, 'Introducción a la Programación', 'Aprende los fundamentos de la programación desde cero. Perfecto para principiantes.', 'programming', 'beginner', 2, true),
(2, 'Matemáticas Avanzadas', 'Curso avanzado de matemáticas para estudiantes universitarios.', 'mathematics', 'advanced', 2, true);

INSERT INTO modules (id, course_id, title, description, order_index) VALUES 
(1, 1, 'Fundamentos de Programación', 'Conceptos básicos y fundamentales', 1),
(2, 1, 'Estructuras de Control', 'Aprende sobre condicionales y bucles', 2);

INSERT INTO lessons (id, module_id, title, lesson_type, order_index) VALUES 
(1, 1, '¿Qué es la programación?', 'text', 1),
(2, 1, 'Primeros pasos con JavaScript', 'text', 2),
(3, 1, 'Quiz: Conceptos básicos', 'quiz', 3),
(4, 2, 'Condicionales if/else', 'video', 1),
(5, 2, 'Bucles for y while', 'text', 2);