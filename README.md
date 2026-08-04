# Ecommerce Monorepo

**Monorepo** (Nx, one Git repo) containing a **monolithic** NestJS backend and two Next.js frontends.

## Structure

```
ecommerce/
├── apps/
│   ├── user-ui/           # Next.js — storefront, main domain
│   ├── admin-ui/          # Next.js — admin panel, subdomain, all admin responsibilities
│   └── backend/           # NestJS — ONE service (monolith), all domains as feature modules
├── libs/shared/
│   ├── ui/                # design-system components used by both frontends
│   ├── types/             # TS types mirroring backend DTOs
│   ├── utils/              # formatters, validators
│   └── api-client/         # typed fetch wrapper used by both frontends
├── nginx/nginx.conf        # main domain -> user-ui, admin subdomain -> admin-ui, /api -> backend
└── docker-compose.yml
```

## Architecture notes

- **Repo = monorepo.** Everything lives in one Git repo, managed with Nx.
- **Backend = monolith.** `apps/backend` is one deployable NestJS process. Each business
  domain (auth, products, orders, payments, ...) is its own self-contained module under
  `apps/backend/src/modules/*` (controller + service + dto), so any module CAN be
  extracted into its own microservice later without a rewrite -- but today it's one process.
- **Auth**: single `auth` module issues JWTs with a `role` claim (`customer` | `admin` | `staff`).
  - `user-ui` middleware only needs a valid session.
  - `admin-ui` middleware + backend `RolesGuard` restrict access to `admin`/`staff`.
- **Shared contracts**: `libs/shared/types` should stay in sync with `apps/backend/src/modules/*/dto`.
  Consider generating this automatically from Swagger/OpenAPI once the API stabilizes.

## Getting started

```bash
npm install
cp apps/backend/.env.example apps/backend/.env
docker compose up -d postgres redis   # local db/cache
npm run dev:backend                    # http://localhost:3333/api
npm run dev:user-ui                    # http://localhost:3000
npm run dev:admin-ui                   # http://localhost:3001
```

## Status of this scaffold

- `libs/shared/*` — implemented (types, api-client, ui example, utils)
- `apps/user-ui` — routes scaffolded (home, product, category, cart, checkout, orders, login, register)
- `apps/admin-ui` — routes scaffolded (overview + 11 admin sections), role-gated middleware stub
- `apps/backend` — all 14 feature modules generated; `auth`, `users`, `products` have real
  controller/service logic (uses in-memory placeholders -- wire up TypeORM entities + a real
  Postgres connection next); the remaining 11 modules are CRUD stubs following the same pattern
- Not yet done: TypeORM entities/migrations, real password hashing, payment provider integration,
  file upload storage (S3), tests, CI

This is a **starting skeleton**, not production-ready code — it's meant to give a coding agent
(or a new developer) the full shape of the app before filling in real business logic.
