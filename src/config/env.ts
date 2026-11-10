import { randomBytes } from 'node:crypto';

/**
 * Configuración por variables de entorno (process.env), con valores por defecto de DESARROLLO que coinciden con la
 * base que levanta la capa database (docker compose up -d). npm run dev y npm start leen un .env de la raíz si
 * existe. En producción (NODE_ENV=production) se pasan todas por el entorno: sin JWT_SECRET la API no arranca.
 */
const text = (name: string, fallback: string): string => {
  const value = process.env[name]?.trim();
  return value ? value : fallback;
};

const integer = (name: string, fallback: number): number => {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value > 0 ? value : fallback;
};

const DB_CLIENTS = ['pg', 'mysql2'] as const;
export type DbClient = (typeof DB_CLIENTS)[number];

const dbClient = text('DB_CLIENT', 'pg');
if (!(DB_CLIENTS as readonly string[]).includes(dbClient)) {
  throw new Error(`DB_CLIENT="${dbClient}" no es válido: usa ${DB_CLIENTS.join(' o ')}.`);
}

const isProduction = process.env['NODE_ENV'] === 'production';

/**
 * Secreto HS256 de los JWT de sesión. Nunca hay uno fijo en el código (sería público y cualquiera podría firmar
 * sesiones): en producción es obligatorio y, en desarrollo, sin JWT_SECRET se genera uno al azar en cada arranque
 * (las sesiones se pierden al reiniciar).
 */
function sessionSecret(): string {
  const configured = process.env['JWT_SECRET']?.trim();
  if (configured) {
    if (configured.length < 32) throw new Error('JWT_SECRET tiene que tener al menos 32 caracteres.');
    return configured;
  }
  if (isProduction) throw new Error('Falta JWT_SECRET: en producción es obligatorio (al menos 32 caracteres al azar).');
  console.warn('Sin JWT_SECRET: se usa un secreto al azar y las sesiones se pierden al reiniciar.');
  return randomBytes(32).toString('hex');
}

export const env = {
  port: integer('PORT', 8080),
  isProduction,
  db: {
    client: dbClient as DbClient,
    /** Si viene, reemplaza a host/port/name/user/password (ej. postgres://app:app@localhost:5432/app). */
    url: process.env['DATABASE_URL']?.trim() || null,
    host: text('DB_HOST', 'localhost'),
    port: integer('DB_PORT', dbClient === 'mysql2' ? 3306 : 5432),
    name: text('DB_NAME', 'app'),
    user: text('DB_USER', 'app'),
    password: text('DB_PASSWORD', 'app'),
    poolMax: integer('DB_POOL_MAX', 10),
  },
  /** Orígenes del frontend que pueden llamar a la API (CORS con credenciales), separados por coma. */
  corsOrigins: text('FRONT_URL', 'http://localhost:4200')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  session: {
    jwtSecret: sessionSecret(),
    cookieName: 'app_session',
    hours: integer('SESSION_HOURS', 8),
    /** Cookie solo por HTTPS: por defecto true en producción y false en desarrollo (http://localhost). */
    cookieSecure: text('COOKIE_SECURE', isProduction ? 'true' : 'false') === 'true',
  },
} as const;
