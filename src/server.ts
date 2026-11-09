import { createApp } from './app.js';
import { closeDatabase } from './config/database.js';
import { env } from './config/env.js';

/** Arranque (FIJO): levanta la API en PORT y, al apagar (Ctrl+C o SIGTERM), deja de aceptar requests y cierra la base. */
const server = createApp().listen(env.port, () => {
  console.log(`API escuchando en http://localhost:${env.port}/api`);
});

const shutdown = (signal: string) => {
  console.log(`${signal}: cerrando…`);
  server.close(() => {
    closeDatabase()
      .catch((error: unknown) => console.error(error))
      .finally(() => process.exit(0));
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
