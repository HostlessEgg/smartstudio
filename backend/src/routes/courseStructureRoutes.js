import { Router } from 'express';
import { createTemplate } from '../controllers/templateController.js';
import { instantiateSection, listChildren } from '../controllers/sectionController.js';
import { listCoursesController } from '../controllers/courseController.js';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

const r = Router();

r.get('/courses', auth, listCoursesController);
r.post('/courses/templates', auth, requireRole(['teacher', 'admin']), createTemplate);
r.post('/courses/:id/sections', auth, requireRole(['admin']), instantiateSection);
r.get('/courses/sections/:parentId', auth, listChildren);

export default r;