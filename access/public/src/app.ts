import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { apiRouter } from './routes.js';
import { errorHandler, notFoundHandler } from './shared/errors/error-handler.js';

/**
 * Arma la app (FIJO): seguridad, CORS para el front, JSON y errores. SIN inicio de sesión: las rutas de los módulos
 * se montan en src/routes.ts (apiRouter, lo genera el paso base) bajo /api y son públicas.
 */
export function createApp(): express.Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: env.corsOrigins, credentials: true }));
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'UP' });
  });
  app.use('/api', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
