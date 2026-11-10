import { Router } from 'express';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { parse } from '../http/validation.js';
import { authenticate } from './auth.service.js';
import { currentUser, type CurrentUser } from './current-user.js';
import { requireSession } from './require-session.js';
import { sessionCookieOptions, signSessionToken } from './session-token.js';

const loginSchema = z.object({
  email: z.email('Ingresa un correo válido.').trim(),
  password: z.string({ error: 'Ingresa tu contraseña.' }).min(1, 'Ingresa tu contraseña.'),
});

/** Respuesta de login y /me: misma forma que SessionUser del front. */
const toSessionUser = (user: CurrentUser): CurrentUser => ({ id: user.id, name: user.name, email: user.email, role: user.role });

/**
 * Sesión (FIJO, montado en /api/auth): POST /login { email, password } → usuario + cookie HttpOnly con el JWT,
 * POST /logout → 204 y borra la cookie, GET /me → usuario de la sesión o 401.
 */
export const authRouter = Router();

authRouter.post('/login', async (req, res) => {
  const { email, password } = parse(loginSchema, req.body);
  const user = await authenticate(email, password);
  res.cookie(env.session.cookieName, await signSessionToken(user), sessionCookieOptions());
  res.json(toSessionUser(user));
});

authRouter.post('/logout', (_req, res) => {
  res.clearCookie(env.session.cookieName, { ...sessionCookieOptions(), maxAge: undefined });
  res.status(204).end();
});

authRouter.get('/me', requireSession, (_req, res) => {
  res.json(toSessionUser(currentUser(res)));
});
