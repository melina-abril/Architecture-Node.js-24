import { deleteApp, initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { env, envText } from './env.js';

/**
 * Cloud Firestore de la capa database (firebase-admin). Las colecciones y sus datos de ejemplo los cargan los scripts
 * de esa capa: el backend NUNCA crea colecciones de ejemplo ni índices. Los repositorios importan db.
 *
 * - FIREBASE_PROJECT_ID: proyecto de Firebase (por defecto demo-app, el del .firebaserc de la capa database).
 * - FIRESTORE_EMULATOR_HOST: en desarrollo, por defecto el emulador de la capa database (127.0.0.1:8085);
 *   "none" para usar el Firestore real. En producción se usa el Firestore real con las credenciales del entorno
 *   (GOOGLE_APPLICATION_CREDENTIALS o las de la cuenta de servicio de Google Cloud).
 */
const projectId = envText('FIREBASE_PROJECT_ID', 'demo-app');
const emulatorHost = envText('FIRESTORE_EMULATOR_HOST', env.isProduction ? 'none' : '127.0.0.1:8085');
// firebase-admin lee el emulador de process.env: se fija acá, antes de crear la app (solo config/ lee process.env).
if (emulatorHost !== 'none') process.env['FIRESTORE_EMULATOR_HOST'] = emulatorHost;
else delete process.env['FIRESTORE_EMULATOR_HOST'];

const app = initializeApp({ projectId });

export const db: Firestore = getFirestore(app);
// Un campo opcional sin dato se guarda como null; undefined se ignora en vez de romper la escritura.
db.settings({ ignoreUndefinedProperties: true });

/** Cierra la conexión (lo usa server.ts al apagar). */
export const closeDatabase = async (): Promise<void> => {
  await db.terminate();
  await deleteApp(app);
};
