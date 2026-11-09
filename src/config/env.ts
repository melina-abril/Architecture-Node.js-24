/**
 * Configuración por variables de entorno (process.env), con valores por defecto de DESARROLLO que coinciden con la
 * base que levanta la capa database (docker compose up -d). npm run dev y npm start leen un .env de la raíz si
 * existe. En producción se pasan todas por el entorno, en especial JWT_SECRET y COOKIE_SECURE=true.
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

export const env = {
  port: integer('PORT', 8080),
  isProduction: process.env['NODE_ENV'] === 'production',
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
    /** Secreto HS256 de los JWT de sesión (al menos 32 caracteres). */
    jwtSecret: text('JWT_SECRET', 'dev-secret-cambiar-en-produccion-0123456789abcdef'),
    cookieName: 'app_session',
    hours: integer('SESSION_HOURS', 8),
    /** true en producción (HTTPS). En desarrollo el front y el backend corren por http://localhost. */
    cookieSecure: text('COOKIE_SECURE', 'false') === 'true',
  },
} as const;

if (env.session.jwtSecret.length < 32) throw new Error('JWT_SECRET tiene que tener al menos 32 caracteres.');
