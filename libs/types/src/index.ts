// Shared TypeScript types/interfaces used by BOTH frontends and mirrored
// against backend DTOs (apps/backend/src/modules/*/dto). Keep these in sync
// with the backend, or later auto-generate them from NestJS Swagger/OpenAPI.

export * from './lib/user.types';
export * from './lib/product.types';
export * from './lib/order.types';
export * from './lib/auth.types';
