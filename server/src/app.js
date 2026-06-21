import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './lib/config.js';
import { attachUser } from './middleware/auth.js';

import authRoutes from './routes/auth.js';
import quizRoutes from './routes/quiz.js';
import resultRoutes from './routes/results.js';
import adminRoutes from './routes/admin.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(express.json({ limit: '64kb' }));
  app.use(
    cors({
      origin: config.clientOrigin === '*' ? true : config.clientOrigin.split(','),
      credentials: false,
    })
  );

  // Tighter limit on auth to slow credential stuffing.
  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50, standardHeaders: true, legacyHeaders: false });
  const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 600, standardHeaders: true, legacyHeaders: false });

  app.use(attachUser);

  app.get('/api/health', (_req, res) => res.json({ ok: true, env: config.nodeEnv }));

  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/quiz', apiLimiter, quizRoutes);
  app.use('/api/results', apiLimiter, resultRoutes);
  app.use('/api/admin', apiLimiter, adminRoutes);

  // 404 + error handlers
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }));
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    console.error('[error]', err);
    res.status(500).json({ error: 'Something went wrong.' });
  });

  return app;
}
