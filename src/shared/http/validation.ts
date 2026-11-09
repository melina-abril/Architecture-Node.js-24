import { z } from 'zod';
import { ValidationError } from '../errors/http-errors.js';

/**
 * Valida y convierte un valor (req.body, req.query, req.params) con su schema de zod. Si no pasa, lanza
 * ValidationError (400 VALIDATION_ERROR) con los mensajes por campo: { sku: ['…'] }. Devuelve el valor tipado y
 * ya convertido (números, fechas, defaults), así el router nunca usa req.body sin validar.
 *
 *   const request = parse(productRequestSchema, req.body);
 */
export function parse<Schema extends z.ZodType>(schema: Schema, value: unknown): z.output<Schema> {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  const errors: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const field = issue.path.length ? issue.path.map(String).join('.') : '_';
    (errors[field] ??= []).push(issue.message);
  }
  throw new ValidationError(errors);
}

/** Id de la ruta (:id): texto no vacío. */
export const idParamSchema = z.object({ id: z.string().trim().min(1, 'El id es obligatorio.') });
