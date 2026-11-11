import bcrypt from 'bcryptjs';
import { db } from '../../config/database.js';
import { UnauthorizedError } from '../errors/http-errors.js';
import type { CurrentUser } from './current-user.js';

/**
 * Documento de la colección users (la carga la capa database en su paso core: al menos un usuario activo con un rol
 * del sistema, el email en minúsculas y passwordHash = hash bcrypt de una contraseña documentada). Id del documento
 * = id del usuario (ej. "U-0001").
 */
interface UserDocument {
  email: string;
  passwordHash?: string;
  name: string;
  role: string;
  active: boolean;
}

/** Colección de usuarios: la capa database la carga con este nombre EXACTO y los campos de UserDocument (más createdAt). */
export const USERS_COLLECTION = { collectionName: 'users' } as const;

/** Hash de relleno: se compara igual cuando el correo no existe, para no revelar qué correos están registrados. */
const DUMMY_HASH = bcrypt.hashSync('correo-inexistente', 10);

const invalidCredentials = () => new UnauthorizedError('INVALID_CREDENTIALS', 'El correo o la contraseña no son correctos.');

/** Valida correo y contraseña contra users (bcrypt). 401 INVALID_CREDENTIALS si no coinciden o el usuario no está activo. */
export async function authenticate(email: string, password: string): Promise<CurrentUser> {
  const snapshot = await db
    .collection(USERS_COLLECTION.collectionName)
    .where('email', '==', email.trim().toLowerCase())
    .limit(1)
    .get();
  const doc = snapshot.docs[0];
  const user = doc?.data() as UserDocument | undefined;
  const matches = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!doc || !user || !user.passwordHash || !matches || user.active !== true) throw invalidCredentials();
  return { id: doc.id, name: user.name, email: user.email, role: user.role };
}
