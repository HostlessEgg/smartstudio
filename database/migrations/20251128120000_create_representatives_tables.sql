-- Migration: crear tablas para representatives, consents y representative_access_logs
-- Timestamped: 20251128120000

CREATE TABLE IF NOT EXISTS representatives (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY ux_representative_user (user_id)
);

CREATE TABLE IF NOT EXISTS consents (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  student_id BIGINT NOT NULL,
  representative_id BIGINT NOT NULL,
  granted_by BIGINT NULL,
  granted_at DATETIME NULL,
  requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NULL,
  active BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_consents_representative FOREIGN KEY (representative_id) REFERENCES representatives(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS representative_access_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  representative_id BIGINT NOT NULL,
  student_id BIGINT NOT NULL,
  action VARCHAR(128) NOT NULL,
  details TEXT,
  ip VARCHAR(128) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_rep_access_rep FOREIGN KEY (representative_id) REFERENCES representatives(id) ON DELETE CASCADE
);

-- Note: Add indexes as needed for query performance
CREATE INDEX idx_consents_student ON consents (student_id);
CREATE INDEX idx_rep_access_logs_rep_student ON representative_access_logs (representative_id, student_id);
