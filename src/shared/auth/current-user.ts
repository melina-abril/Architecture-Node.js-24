import type { Response } from 'express';
import { UnauthorizedError } from '../errors/http-errors.js';

/** Usuario de la sesión (claims del JWT): misma forma que SessionUser del front. */
export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  /** Código del rol (ej. 'ADMIN'): el mismo de users.role y de APP_ROLES del front. */
  role: string;
}

/**
 * Usuario de la request: lo deja requireSession en res.locals.user. En un router: currentUser(res); al service se
 * le pasa el usuario (o su id) como parámetro, nunca la request.
 */
export function currentUser(res: Response): CurrentUser {
  const user = res.locals.user;
  if (!user) throw new UnauthorizedError();
  return user;
}

/** true si el usuario tiene alguno de los roles. */
export const hasRole = (user: CurrentUser, roles: readonly string[]): boolean => roles.includes(user.role);
