import bcrypt from 'bcryptjs';
import { db } from '../../config/database.js';
import { UnauthorizedError } from '../errors/http-errors.js';
import type { CurrentUser } from './current-user.js';

/**
 * Fila de la tabla users (la crea la capa database con estas columnas; su seed trae al menos un usuario activo
 * con un rol del sistema y el hash bcrypt de una contraseña documentada). Es la misma tabla que usa el backend
 * Spring Boot de la arquitectura.
 */
interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: string;
  active: boolean | number;
}

/** Tabla de usuarios: la capa database la crea con este nombre EXACTO y las columnas de UserRow (más created_at). */
export const USERS_TABLE = { tableName: 'users' } as const;

/** Hash de relleno: se compara igual cuando el correo no existe, para no revelar qué correos están registrados. */
const DUMMY_HASH = bcrypt.hashSync('correo-inexistente', 10);

const invalidCredentials = () => new UnauthorizedError('INVALID_CREDENTIALS', 'El correo o la contraseña no son correctos.');

/** Valida correo y contraseña contra users (bcrypt). 401 INVALID_CREDENTIALS si no coinciden o el usuario no está activo. */
export async function authenticate(email: string, password: string): Promise<CurrentUser> {
  const row = await db<UserRow>(USERS_TABLE.tableName)
    .select('id', 'email', 'password_hash', 'name', 'role', 'active')
    .whereRaw('LOWER(email) = ?', [email.trim().toLowerCase()])
    .first();
  const matches = await bcrypt.compare(password, row?.password_hash ?? DUMMY_HASH);
  if (!row || !matches || !row.active) throw invalidCredentials();
  return { id: row.id, name: row.name, email: row.email, role: row.role };
}
