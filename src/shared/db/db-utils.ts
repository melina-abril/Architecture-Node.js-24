import { randomUUID } from 'node:crypto';

/** Id nuevo para una fila (columnas id VARCHAR(36)): se genera en el backend, igual en PostgreSQL y MySQL. */
export const newId = (): string => randomUUID();

/** Fecha y hora de una columna (Date de pg / mysql2, o string) como ISO 8601 para la respuesta. */
export function toIsoDateTime(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

/** Columna DATE (fecha sin hora) como 'YYYY-MM-DD', sin correrla por la zona horaria. */
export function toIsoDate(value: Date | string): string {
  if (typeof value === 'string') return value.slice(0, 10);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

/** DECIMAL / NUMERIC como number (pg los devuelve como string para no perder precisión). Redondeado a 2 decimales. */
export function toMoney(value: string | number): number {
  return Math.round(Number(value) * 100) / 100;
}

/** COUNT(*) como number (pg lo devuelve como string, mysql2 como number). */
export function toCount(row: { total?: string | number } | undefined): number {
  return Number(row?.total ?? 0);
}

/** Escapa % y _ de un texto de búsqueda para usarlo en un LIKE. */
export function likePattern(search: string): string {
  return `%${search.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}
