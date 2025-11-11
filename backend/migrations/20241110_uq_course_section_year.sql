ALTER TABLE courses
  ADD UNIQUE KEY uq_parent_section_year (parent_course_id, section, academic_year);