/**
 * Errores de negocio y de request. Los services y routers los LANZAN (throw) y el errorHandler los convierte en
 * ProblemDetail { title, status, detail, code, errors }: nadie arma respuestas de error a mano.
 */
export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly errors: Record<string, string[]> | undefined;

  constructor(status: number, code: string, message: string, errors?: Record<string, string[]>) {
    super(message);
    this.name = new.target.name;
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

/** 404: el recurso no existe (ej. new NotFoundError(`No existe el producto ${id}.`)). */
export class NotFoundError extends HttpError {
  constructor(message: string) {
    super(404, 'NOT_FOUND', message);
  }
}

/** 409: choca con otro dato (ej. un código repetido). Con field, el front marca ese campo. */
export class ConflictError extends HttpError {
  constructor(message: string, field?: string) {
    super(409, 'CONFLICT', message, field ? { [field]: [message] } : undefined);
  }
}

/** 422: una regla de negocio no se cumple. code en MAYÚSCULAS y estable (el front puede decidir por él). */
export class BusinessRuleError extends HttpError {
  constructor(code: string, message: string) {
    super(422, code, message);
  }
}

/** 400 con errores por campo: lo lanza parse() cuando el body o la query no pasan su schema. */
export class ValidationError extends HttpError {
  constructor(errors: Record<string, string[]>, message = 'Revisa los datos ingresados.') {
    super(400, 'VALIDATION_ERROR', message, errors);
  }
}

/** 401: sin sesión, sesión vencida o credenciales incorrectas. */
export class UnauthorizedError extends HttpError {
  constructor(code = 'UNAUTHORIZED', message = 'Tu sesión venció. Vuelve a iniciar sesión.') {
    super(401, code, message);
  }
}

/** 403: con sesión pero sin el rol necesario. */
export class ForbiddenError extends HttpError {
  constructor(message = 'No tienes permiso para realizar esta acción.') {
    super(403, 'FORBIDDEN', message);
  }
}
