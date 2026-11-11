import knex, { type Knex } from 'knex';
import { envInteger, envText } from './env.js';

/**
 * Pool único de conexiones (Knex) a la base {{DB_ENGINE}} de la capa database. La base y sus tablas las crean las
 * migraciones de esa capa: el backend NUNCA crea ni modifica tablas (sin knex.migrate ni schema.createTable). Los
 * repositorios importan db y arman consultas con el query builder (parámetros siempre ligados, nunca concatenados).
 */
const DB_CLIENTS = ['pg', 'mysql2', 'mssql', 'oracledb'] as const;
export type DbClient = (typeof DB_CLIENTS)[number];

const configuredClient = envText('DB_CLIENT', '{{DB_CLIENT}}');
if (!(DB_CLIENTS as readonly string[]).includes(configuredClient)) {
  throw new Error(`DB_CLIENT="${configuredClient}" no es válido: usa ${DB_CLIENTS.join(', ')}.`);
}
export const dbClient = configuredClient as DbClient;

/** Valores por defecto de cada motor: los mismos que levanta la capa database (docker compose up -d). */
const DEFAULTS: Record<DbClient, { port: number; name: string; user: string; password: string }> = {
  pg: { port: 5432, name: 'app', user: 'app', password: 'app' },
  mysql2: { port: 3306, name: 'app', user: 'app', password: 'app' },
  mssql: { port: 1433, name: 'app', user: 'sa', password: 'Dev_Passw0rd!' },
  oracledb: { port: 1521, name: 'FREEPDB1', user: 'app', password: 'app' },
};
const defaults = DEFAULTS[dbClient];

const settings = {
  /** Si viene, reemplaza a host/port/name/user/password (ej. postgres://app:app@localhost:5432/app). */
  url: envText('DATABASE_URL', ''),
  host: envText('DB_HOST', 'localhost'),
  port: envInteger('DB_PORT', defaults.port),
  /** Base (PostgreSQL, MySQL, SQL Server) o servicio (Oracle, ej. FREEPDB1). */
  name: envText('DB_NAME', defaults.name),
  user: envText('DB_USER', defaults.user),
  password: envText('DB_PASSWORD', defaults.password),
  poolMax: envInteger('DB_POOL_MAX', 10),
};

/** Oracle guarda los nombres sin comillas en MAYÚSCULAS: se consultan así y las filas vuelven en minúsculas. */
const lowerKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(lowerKeys);
  if (value && typeof value === 'object' && !(value instanceof Date) && !Buffer.isBuffer(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key.toLowerCase(), inner]));
  }
  return value;
};

function connection(): Knex.StaticConnectionConfig | string {
  if (settings.url) return settings.url;
  const { host, port, name, user, password } = settings;
  switch (dbClient) {
    case 'oracledb':
      return { user, password, connectString: `${host}:${port}/${name}` };
    case 'mssql':
      // En desarrollo el contenedor usa un certificado propio: DB_ENCRYPT=true en una base con TLS real.
      return {
        server: host,
        port,
        database: name,
        user,
        password,
        options: { encrypt: envText('DB_ENCRYPT', 'false') === 'true', trustServerCertificate: true },
      };
    case 'mysql2':
      // DECIMAL como número y fechas en UTC, igual que el resto de los motores.
      return { host, port, database: name, user, password, decimalNumbers: true, timezone: 'Z' };
    default:
      return { host, port, database: name, user, password };
  }
}

export const db: Knex = knex({
  client: dbClient,
  connection: connection(),
  pool: { min: 0, max: settings.poolMax },
  ...(dbClient === 'oracledb'
    ? {
        wrapIdentifier: (value: string, origImpl: (value: string) => string) => origImpl(value === '*' ? value : value.toUpperCase()),
        postProcessResponse: (result: unknown) => lowerKeys(result),
      }
    : {}),
});

/** Cierra el pool (lo usa server.ts al apagar). */
export const closeDatabase = (): Promise<void> => db.destroy();
