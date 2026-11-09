import type { RequestHandler } from 'express';
import { env } from '../../config/env.js';
import { ForbiddenError, UnauthorizedError } from '../errors/http-errors.js';
import { hasRole } from './current-user.js';
import { verifySessionToken } from './session-token.js';

/**
 * Pide sesión: lee la cookie, valida el JWT y deja el usuario en res.locals.user (currentUser(res)). app.ts lo
 * aplica a TODO /api salvo /api/auth/login, /api/auth/logout y /api/health: los routers de los módulos no lo
 * repiten. Sin cookie o con un token inválido: 401.
 */
export const requireSession: RequestHandler = async (req, res, next) => {
  const token: unknown = req.cookies?.[env.session.cookieName];
  const user = typeof token === 'string' && token ? await verifySessionToken(token) : null;
  if (!user) throw new UnauthorizedError();
  res.locals.user = user;
  next();
};

/**
 * Acciones de un rol: router.post('/', requireRole('ADMIN'), handler). Con el código EXACTO de users.role (el
 * mismo de APP_ROLES del front). Sin requireRole alcanza con tener sesión.
 */
export const requireRole =
  (...roles: string[]): RequestHandler =>
  (_req, res, next) => {
    const user = res.locals.user;
    if (!user) throw new UnauthorizedError();
    if (!hasRole(user, roles)) throw new ForbiddenError();
    next();
  };
