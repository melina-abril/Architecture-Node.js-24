import knex, { type Knex } from 'knex';
import { env } from './env.js';

/**
 * Pool único de conexiones (Knex) a PostgreSQL o MySQL según DB_CLIENT. La base y sus tablas las crea la capa
 * database (migraciones): el backend NUNCA crea ni modifica tablas (sin knex.migrate ni schema.createTable).
 * Los repositorios importan db y arman consultas con el query builder (parámetros siempre ligados, nunca
 * concatenados).
 */
const connection: Knex.StaticConnectionConfig | string = env.db.url ?? {
  host: env.db.host,
  port: env.db.port,
  database: env.db.name,
  user: env.db.user,
  password: env.db.password,
  // mysql2: DECIMAL como número y fechas en UTC, igual que pg (los tipos de fila los fija cada repositorio).
  ...(env.db.client === 'mysql2' ? { decimalNumbers: true, timezone: 'Z' } : {}),
};

export const db: Knex = knex({
  client: env.db.client,
  connection,
  pool: { min: 0, max: env.db.poolMax },
});

/** Cierra el pool (lo usa server.ts al apagar). */
export const closeDatabase = (): Promise<void> => db.destroy();
