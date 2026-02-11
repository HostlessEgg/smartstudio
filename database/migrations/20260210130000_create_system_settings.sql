-- Migration: create system_settings table
-- Timestamped: 20260210130000

CREATE TABLE IF NOT EXISTS system_settings (
  id INT PRIMARY KEY,
  institution_name VARCHAR(255) DEFAULT NULL,
  school_year VARCHAR(32) DEFAULT NULL,
  period_name VARCHAR(64) DEFAULT NULL,
  period_start DATE DEFAULT NULL,
  period_end DATE DEFAULT NULL,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  allow_teacher_registration BOOLEAN DEFAULT TRUE,
  maintenance_mode BOOLEAN DEFAULT FALSE,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO system_settings (id, institution_name, school_year, period_name, period_start, period_end, notifications_enabled, allow_teacher_registration, maintenance_mode)
VALUES (1, 'Liceo Bolivariano "Libertador"', '2023-2024', '1er Lapso', '2023-09-15', '2023-12-15', TRUE, TRUE, FALSE)
ON DUPLICATE KEY UPDATE id = id;
