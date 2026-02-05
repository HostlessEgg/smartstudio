-- Migration: crear tabla de feature flags
-- Timestamped: 20260204121500

CREATE TABLE IF NOT EXISTS feature_flags (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  flag_key VARCHAR(128) NOT NULL,
  description VARCHAR(255) DEFAULT NULL,
  enabled BOOLEAN DEFAULT FALSE,
  rollout_percentage INT DEFAULT 100,
  environment VARCHAR(32) DEFAULT 'all',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY ux_feature_flag_env (flag_key, environment)
);
