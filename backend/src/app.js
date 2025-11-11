import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { auth } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import courseStructureRoutes from './routes/courseStructureRoutes.js';
import enrollmentRoutes from './routes/enrollmentRoutes.js';

const app = express();

const REQUIRED_ENV = ['JWT_SECRET'];
if (!process.env.DEFAULT_ACADEMIC_YEAR) {
  console.warn('[WARN] DEFAULT_ACADEMIC_YEAR no definido. Usando 2025-2026');
  process.env.DEFAULT_ACADEMIC_YEAR = '2025-2026';
}
for (const v of REQUIRED_ENV){
  if (!process.env[v]) {
    console.error(`Falta variable de entorno: ${v}`);
  }
}

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/auth', rateLimit({ windowMs: 60_000, max: 30 }));
app.use('/api/auth', authRoutes);

app.use('/api', courseStructureRoutes);
app.use('/api', enrollmentRoutes);

app.get('/api/auth/me', auth, (req, res) => res.json({ user: req.user }));
app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.use(errorHandler);

export default app;