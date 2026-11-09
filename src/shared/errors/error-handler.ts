import type { ErrorRequestHandler, RequestHandler } from 'express';
import { STATUS_CODES } from 'node:http';
import { HttpError } from './http-errors.js';

/** Forma de TODOS los errores de la API (RFC 9457): la misma que espera el front (ProblemDetail). */
export interface ProblemDetail {
  title: string;
  status: number;
  detail: string;
  code: string;
  errors?: Record<string, string[]>;
}

const problem = (status: number, code: string, detail: string, errors?: Record<string, string[]>): ProblemDetail => ({
  title: STATUS_CODES[status] ?? 'Error',
  status,
  detail,
  code,
  ...(errors && Object.keys(errors).length ? { errors } : {}),
});

/** Cualquier error con status (ej. el JSON inválido de express.json(), que trae status 400 y type). */
const statusOf = (error: unknown): number | null => {
  if (typeof error !== 'object' || error === null || !('status' in error)) return null;
  return typeof error.status === 'number' ? error.status : null;
};

/** Ruta que no existe: 404 con la misma forma. Va después de todos los routers. */
export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json(problem(404, 'NOT_FOUND', `No existe ${req.method} ${req.path}.`));
};

/**
 * Middleware de errores (4 parámetros, va ÚLTIMO en app.ts). Express 5 manda acá también los errores de los
 * handlers async (promesa rechazada), así que los routers y services solo lanzan las clases de http-errors.
 */
export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }
  if (error instanceof HttpError) {
    res.status(error.status).json(problem(error.status, error.code, error.message, error.errors));
    return;
  }
  const status = statusOf(error);
  if (status === 400 || status === 413 || status === 415) {
    res.status(status).json(problem(status, 'INVALID_BODY', 'El cuerpo de la solicitud no es válido.'));
    return;
  }
  console.error(error);
  res.status(500).json(problem(500, 'INTERNAL_ERROR', 'Ocurrió un error inesperado. Intenta de nuevo.'));
};
