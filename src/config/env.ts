import { randomBytes } from 'node:crypto';

/**
 * Configuración por variables de entorno (process.env), con valores por defecto de DESARROLLO. npm run dev y
 * npm start leen un .env de la raíz si existe. En producción (NODE_ENV=production) se pasan todas por el entorno:
 * sin JWT_SECRET la API no arranca. La conexión a la base la lee config/database.ts con envText / envInteger (solo
 * config/ lee process.env).
 */
export const envText = (name: string, fallback: string): string => {
  const value = process.env[name]?.trim();
  return value ? value : fallback;
};

export const envInteger = (name: string, fallback: number): number => {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value > 0 ? value : fallback;
};

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
  port: envInteger('PORT', 8080),
  isProduction,
  /** Orígenes del frontend que pueden llamar a la API (CORS con credenciales), separados por coma. */
  corsOrigins: envText('FRONT_URL', 'http://localhost:4200')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  session: {
    jwtSecret: sessionSecret(),
    cookieName: 'app_session',
    hours: envInteger('SESSION_HOURS', 8),
    /** Cookie solo por HTTPS: por defecto true en producción y false en desarrollo (http://localhost). */
    cookieSecure: envText('COOKIE_SECURE', isProduction ? 'true' : 'false') === 'true',
  },
} as const;
