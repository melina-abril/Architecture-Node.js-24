import { z } from 'zod';

/** Respuesta paginada de TODOS los listados: misma forma que Page<T> del front. page empieza en 0. */
export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
}

/** Query común de paginado (?page=0&size=10). Se extiende con los filtros del listado: pageQuerySchema.extend({ … }). */
export const pageQuerySchema = z.object({
  page: z.coerce.number().int('page tiene que ser un entero.').min(0, 'page empieza en 0.').default(0),
  size: z.coerce.number().int('size tiene que ser un entero.').min(1, 'size va de 1 a 100.').max(100, 'size va de 1 a 100.').default(10),
});

export type PageQuery = z.output<typeof pageQuerySchema>;

/** Arma la página con los items ya filtrados y paginados en la consulta y el total de filas del filtro. */
export function toPageResponse<T>(items: T[], totalItems: number, { page, size }: PageQuery): PageResponse<T> {
  return { items, page, size, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / size)) };
}

/** offset para la consulta (page * size). */
export const offsetOf = ({ page, size }: PageQuery): number => page * size;
