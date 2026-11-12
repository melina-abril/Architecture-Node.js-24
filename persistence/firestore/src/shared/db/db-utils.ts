import { randomUUID } from 'node:crypto';
import { Timestamp, type DocumentData, type DocumentSnapshot, type Query } from 'firebase-admin/firestore';
import { db } from '../../config/database.js';

/**
 * Id nuevo para un documento: se genera en el backend (uuid), nunca .add() ni doc() sin id. Un código visible y
 * correlativo (legajo, número de factura, ticket) NO es un uuid: usa createWithNextCode.
 */
export const newId = (): string => randomUUID();

/** Documento con su id: los repositorios devuelven { id, ...campos }. undefined si no existe. */
export function withId<T extends DocumentData>(snapshot: DocumentSnapshot): (T & { id: string }) | undefined {
  return snapshot.exists ? ({ ...(snapshot.data() as T), id: snapshot.id }) : undefined;
}

/** Momento de un campo timestamp (Timestamp de Firestore, Date o string) como ISO 8601 para la respuesta. */
export function toIsoDateTime(value: Timestamp | Date | string): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

/** Fecha sin hora como 'YYYY-MM-DD' (de un string 'YYYY-MM-DD' o de un timestamp, en UTC). */
export function toIsoDate(value: Timestamp | Date | string): string {
  if (typeof value === 'string') return value.slice(0, 10);
  return toIsoDateTime(value).slice(0, 10);
}

/** 'YYYY-MM-DD' o ISO 8601 → Timestamp para guardar (los campos que se ordenan o filtran por fecha). */
export const toTimestamp = (value: string | Date): Timestamp => Timestamp.fromDate(typeof value === 'string' ? new Date(value) : value);

/** Momento actual como Timestamp (createdAt / updatedAt que se escriben desde el backend). */
export const nowTimestamp = (): Timestamp => Timestamp.now();

/** Importe como number con 2 decimales. */
export function toMoney(value: number | string): number {
  return Math.round(Number(value) * 100) / 100;
}

/** Total de documentos de una consulta (agregación count, sin leer los documentos). */
export async function countOf(query: Query): Promise<number> {
  const snapshot = await query.count().get();
  return snapshot.data().count;
}

/** Colección de contadores de createWithNextCode: un documento por colección { last, updatedAt }. */
const COUNTERS_COLLECTION = '_counters';

const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Crea un documento cuyo id es el próximo código correlativo de la colección: prefijo + número con ceros a la
 * izquierda. createWithNextCode('employees', 'E-', (code) => ({ employeeNumber: code, ... })) → id 'E-0004'.
 * El contador vive en _counters/{colección} y se incrementa en la misma transacción que crea el documento: dos altas
 * simultáneas nunca repiten código. Si el contador todavía no existe (datos cargados por los scripts de la capa
 * database), arranca desde el mayor código con ese prefijo que ya esté en la colección.
 */
export async function createWithNextCode<T extends DocumentData>(
  collectionName: string,
  prefix: string,
  build: (code: string) => T,
  digits = 4,
): Promise<T & { id: string }> {
  const collection = db.collection(collectionName);
  const counterRef = db.collection(COUNTERS_COLLECTION).doc(collectionName);
  const pattern = new RegExp(`^${escapeRegExp(prefix)}(\\d+)$`);
  return db.runTransaction(async (trx) => {
    const counter = await trx.get(counterRef);
    let last = counter.exists ? Number(counter.get('last')) || 0 : 0;
    if (!counter.exists) {
      const existing = await trx.get(collection.select());
      for (const doc of existing.docs) {
        const match = pattern.exec(doc.id);
        if (match) last = Math.max(last, Number(match[1]));
      }
    }
    const next = last + 1;
    const code = `${prefix}${String(next).padStart(digits, '0')}`;
    const document = build(code);
    trx.set(counterRef, { last: next, updatedAt: Timestamp.now() });
    trx.create(collection.doc(code), document);
    return { ...document, id: code };
  });
}

/** Rango para buscar por prefijo: where(campo, '>=', desde).where(campo, '<=', hasta). */
export const prefixRange = (prefix: string): { from: string; to: string } => ({ from: prefix, to: `${prefix}` });
