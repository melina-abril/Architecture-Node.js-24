import type { CookieOptions } from 'express';
import { jwtVerify, SignJWT } from 'jose';
import { env } from '../../config/env.js';
import type { CurrentUser } from './current-user.js';

const secret = new TextEncoder().encode(env.session.jwtSecret);
const ISSUER = 'app';

/** JWT HS256 de la sesión con el usuario en los claims (sub = id). Va en la cookie HttpOnly, nunca en el body. */
export async function signSessionToken(user: CurrentUser): Promise<string> {
  return new SignJWT({ name: user.name, email: user.email, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(`${env.session.hours}h`)
    .sign(secret);
}

/** Usuario de un token válido; null si está vencido, alterado o mal formado. */
export async function verifySessionToken(token: string): Promise<CurrentUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret, { issuer: ISSUER, algorithms: ['HS256'] });
    const { sub, name, email, role } = payload;
    if (typeof sub !== 'string' || typeof name !== 'string' || typeof email !== 'string' || typeof role !== 'string') return null;
    return { id: sub, name, email, role };
  } catch {
    return null;
  }
}

/** Opciones de la cookie de sesión (HttpOnly, SameSite Lax). maxAge 0 la borra. */
export function sessionCookieOptions(maxAgeMs = env.session.hours * 60 * 60 * 1000): CookieOptions {
  return { httpOnly: true, secure: env.session.cookieSecure, sameSite: 'lax', path: '/', maxAge: maxAgeMs };
}
