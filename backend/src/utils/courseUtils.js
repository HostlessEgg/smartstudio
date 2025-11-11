export function canManageCourse(user, course) {
  if (!user || !course) return false;
  return user.role === 'admin' || (user.role === 'teacher' && course.instructor_id === user.id);
}