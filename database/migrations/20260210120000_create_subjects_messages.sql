-- Migration: create subjects and messages tables
-- Timestamped: 20260210120000

CREATE TABLE IF NOT EXISTS subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);

ALTER TABLE subjects ADD COLUMN grade VARCHAR(64) DEFAULT NULL;
ALTER TABLE subjects ADD COLUMN hours INT DEFAULT NULL;
ALTER TABLE subjects ADD COLUMN sections VARCHAR(128) DEFAULT NULL;
ALTER TABLE subjects ADD COLUMN active BOOLEAN DEFAULT TRUE;
ALTER TABLE subjects ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE subjects ADD COLUMN code VARCHAR(64) DEFAULT NULL;
ALTER TABLE subjects ADD COLUMN teachers JSON DEFAULT NULL;
ALTER TABLE subjects ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE subjects ADD UNIQUE KEY ux_subjects_code (code);

CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT NOT NULL,
  recipient_id INT NOT NULL,
  subject VARCHAR(255) DEFAULT NULL,
  body TEXT NOT NULL,
  read_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_messages_recipient (recipient_id, created_at),
  INDEX idx_messages_sender (sender_id, created_at)
);

-- Optional seed removed to avoid column mismatch on existing installs
