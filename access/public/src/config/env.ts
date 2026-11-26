/**
 * Configuración por variables de entorno (process.env), con valores por defecto de DESARROLLO. npm run dev y
 * npm start leen un .env de la raíz si existe. En producción (NODE_ENV=production) se pasan todas por el entorno.
 * Sin inicio de sesión: no hay secreto ni cookie de sesión. La conexión a la base la lee config/database.ts con envText / envInteger (solo
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

export const env = {
  port: envInteger('PORT', 8080),
  isProduction,
  /** Orígenes del frontend que pueden llamar a la API (CORS), separados por coma. */
  corsOrigins: envText('FRONT_URL', 'http://localhost:4200')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
} as const;
