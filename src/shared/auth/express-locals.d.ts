import type { CurrentUser } from './current-user.js';

// res.locals.user tipado en toda la app (lo completa requireSession).
declare global {
  namespace Express {
    interface Locals {
      user?: CurrentUser;
    }
  }
}

export {};
