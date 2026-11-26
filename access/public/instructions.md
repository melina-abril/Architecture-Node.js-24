## Sin inicio de sesión (acceso público)
Esta API NO tiene inicio de sesión: todos sus endpoints son públicos. Esto le gana a lo que dicen arriba (y las instrucciones de persistencia) sobre la sesión, los usuarios y los roles.
- No existe src/shared/auth/ (ni authRouter, requireSession, requireRole, currentUser, ni la tabla o colección users para autenticar). No los importes ni los generes: no hay /api/auth/login, /logout ni /me.
- app.ts (fijo) monta `app.use('/api', apiRouter)` sin sesión; config/env.ts no tiene `env.session`.
- Ningún router pide rol ni lee el usuario actual: los services no reciben el usuario. Si una entidad del ejemplo guardaba quién la creó (created_by / createdById), queda en null o no se guarda.
- Una funcionalidad de inicio de sesión, registro de usuarios o perfil del MVP no se construye. Los datos de contacto o formularios públicos (ej. un formulario de consulta) se guardan sin usuario.
