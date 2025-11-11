ALTER TABLE courses
  ADD COLUMN section VARCHAR(10) DEFAULT 'A',
  ADD COLUMN academic_year VARCHAR(20) DEFAULT '2024-2025',
  ADD COLUMN is_template TINYINT(1) DEFAULT 0,
  ADD COLUMN parent_course_id INT NULL,
  ADD COLUMN state ENUM('template','draft','active','archived') DEFAULT 'active';

ALTER TABLE courses
  ADD CONSTRAINT fk_courses_parent FOREIGN KEY (parent_course_id) REFERENCES courses(id) ON DELETE SET NULL;

CREATE INDEX idx_courses_section_year ON courses(section, academic_year);
CREATE INDEX idx_courses_template ON courses(is_template);
CREATE INDEX idx_courses_state ON courses(state);