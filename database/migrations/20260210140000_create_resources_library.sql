-- Migration: create resources and library tables
-- Timestamped: 20260210140000

CREATE TABLE IF NOT EXISTS resources (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  file_type VARCHAR(32) DEFAULT NULL,
  file_size VARCHAR(32) DEFAULT NULL,
  url VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS library_books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) DEFAULT NULL,
  status ENUM('Disponible','Reservado','Prestado') DEFAULT 'Disponible',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO resources (title, file_type, file_size, url)
VALUES
  ('Guía de estudio - Matemáticas', 'PDF', '1.2 MB', NULL),
  ('Plantilla de laboratorio', 'DOCX', '620 KB', NULL),
  ('Banco de ejercicios', 'ZIP', '5.4 MB', NULL)
ON DUPLICATE KEY UPDATE title = title;

INSERT INTO library_books (title, author, status)
VALUES
  ('Álgebra Moderna', 'J. Herrera', 'Disponible'),
  ('Física Conceptual', 'L. Martínez', 'Disponible'),
  ('Química Orgánica', 'P. Rojas', 'Reservado')
ON DUPLICATE KEY UPDATE title = title;
