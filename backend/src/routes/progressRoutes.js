import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import {
  updateLessonProgress,
  getStudentProgress,
  listCourseProgressController
} from '../controllers/progressController.js';

const r = Router();

r.post('/courses/:courseId/lessons/:lessonId/progress', auth, updateLessonProgress);
r.get('/courses/:courseId/progress/:studentId', auth, getStudentProgress);
r.get('/courses/:courseId/progress', auth, requireRole(['teacher','admin']), listCourseProgressController);

export default r;