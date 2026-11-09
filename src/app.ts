import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { apiRouter } from './routes.js';
import { authRouter } from './shared/auth/auth.router.js';
import { requireSession } from './shared/auth/require-session.js';
import { errorHandler, notFoundHandler } from './shared/errors/error-handler.js';

/**
 * Arma la app (FIJO): seguridad, CORS con credenciales para el front, JSON, cookies, sesión y errores. Las rutas
 * de los módulos se montan en src/routes.ts (apiRouter, lo genera el paso base) bajo /api y siempre con sesión.
 */
export function createApp(): express.Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: env.corsOrigins, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'UP' });
  });
  app.use('/api/auth', authRouter);
  app.use('/api', requireSession, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
