export const COURSE_STATES = {
  TEMPLATE: 'template',
  DRAFT: 'draft',
  ACTIVE: 'active',
  ARCHIVED: 'archived',
};

export function isValidCourseState(val) {
  return Object.values(COURSE_STATES).includes(val);
}