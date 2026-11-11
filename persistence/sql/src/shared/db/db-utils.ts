import { randomUUID } from 'node:crypto';

/** Id nuevo para una fila (columnas id de 36 caracteres): se genera en el backend, igual en todos los motores. */
export const newId = (): string => randomUUID();

/** Fecha y hora de una columna (Date del driver, o string) como ISO 8601 para la respuesta. */
export function toIsoDateTime(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

/** Columna DATE (fecha sin hora) como 'YYYY-MM-DD', sin correrla por la zona horaria. */
export function toIsoDate(value: Date | string): string {
  if (typeof value === 'string') return value.slice(0, 10);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

/** DECIMAL / NUMERIC como number (pg y oracledb pueden devolverlos como string). Redondeado a 2 decimales. */
export function toMoney(value: string | number): number {
  return Math.round(Number(value) * 100) / 100;
}

/** COUNT(*) como number (pg lo devuelve como string; el resto, como number). */
export function toCount(row: { total?: string | number } | undefined): number {
  return Number(row?.total ?? 0);
}

/** Booleano de una columna: boolean (pg, SQL Server, Oracle 23) o 0/1 (MySQL). */
export const toBoolean = (value: boolean | number | string): boolean => value === true || value === 1 || value === '1';

/**
 * Operador LIKE con escape explícito (sin escape por defecto en SQL Server ni Oracle): úsalo con likePattern.
 * Ej.: builder.whereRaw(`LOWER(name) ${LIKE}`, [likePattern(search.toLowerCase())]).
 */
export const LIKE = "LIKE ? ESCAPE '!'";

/** Texto de búsqueda como patrón de LIKE ("contiene"), con %, _ y ! escapados para LIKE. */
export function likePattern(search: string): string {
  return `%${search.replace(/[!%_]/g, (char) => `!${char}`)}%`;
}
