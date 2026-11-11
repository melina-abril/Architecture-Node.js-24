import { randomUUID } from 'node:crypto';
import { Timestamp, type DocumentData, type DocumentSnapshot, type Query } from 'firebase-admin/firestore';

/** Id nuevo para un documento: se genera en el backend (uuid), nunca .add() ni doc() sin id. */
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

/** Rango para buscar por prefijo: where(campo, '>=', desde).where(campo, '<=', hasta). */
export const prefixRange = (prefix: string): { from: string; to: string } => ({ from: prefix, to: `${prefix}` });
