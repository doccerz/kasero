# kasero

Internal apartment rental management application.

---

## Overview

Kasero is a private, internal application for managing apartment spaces, tenants, contracts, and rent collections. It is not a SaaS product — it runs as a single-tenant internal tool with one admin account.

**Key capabilities (v1):**
- Manage rentable spaces and tenant records
- Create and post rental contracts with automatic payable generation
- Record and track payments across three independent ledgers (payables, payments, fund)
- Provide read-only tenant status views via a public code (no tenant login required)
- Admin dashboard showing all spaces sorted by urgency (overdue → nearing → occupied → vacant)
- Space detail view with full contract history; contract ledger view with payables, payments, and fund
- Admin-only access for all write operations
- Full contract management UI: create contracts, edit drafts, post contracts, record payments, and void payments from the admin panel

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (App Router) |
| Backend | NestJS |
| Database | PostgreSQL |
| ORM | Drizzle ORM |
| Auth | JWT — single seeded ADMIN user |
| Runtime | Node 24 |
| Package manager | npm workspaces |
| Container | Docker |

---

## Architecture

```
apps/web    ← Next.js frontend  (public-facing, owns all routing)
apps/api    ← NestJS API        (internal only, never publicly exposed)
```

The backend is **never publicly exposed**. All external traffic goes through Next.js, which calls the API server-side. Tenant-facing pages are read-only Next.js routes resolved via a one-time public code.

---

## Quick Start

### Prerequisites

- Node 24
- PostgreSQL running locally (or via Docker)
- npm

### Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd kasero

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env — fill in DATABASE_URL, JWT_SECRET, ADMIN_PASSWORD, etc.

# 4. Run database migrations
npm run db:migrate --workspace=apps/api

# 5. Seed initial data (admin user, default settings)
npm run db:seed --workspace=apps/api

# 6. Start development servers
npm run dev
```

Web app: `http://localhost:3000` | API (internal only): `http://localhost:3001`

---

## Key Commands

```bash
# Development
npm run dev                               # Start both apps
npm run dev --workspace=apps/api          # API only
npm run dev --workspace=apps/web          # Web only

# Testing
npm test                                  # Run all tests
npm run test:watch                        # Watch mode
npm run test:coverage                     # Coverage report

# Database
npm run db:generate --workspace=apps/api  # Generate migration from schema
npm run db:migrate --workspace=apps/api   # Run pending migrations
npm run db:seed --workspace=apps/api      # Seed admin + default settings

# Docker
docker build -t kasero .
docker run --env-file .env -p 3001:3001 kasero
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in values. Never commit `.env`.

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `API_PORT` | NestJS API port (default: `3001`) |
| `JWT_SECRET` | Secret for signing admin JWT tokens |
| `JWT_EXPIRES_IN` | Token expiry duration (e.g. `8h`) |
| `ADMIN_USERNAME` | Admin account username (used during seed) |
| `ADMIN_PASSWORD` | Admin account password (used during seed) |
| `WEB_PORT` | Next.js dev server port (default: `3000`) |
| `INTERNAL_API_URL` | API base URL for Next.js server-side calls (e.g. `http://localhost:3001`) |
| `NODE_ENV` | `development` / `production` / `test` |
| `TZ` | Timezone — must be `Asia/Manila` |
| `MIGRATIONS_PATH` | Override path to Drizzle migrations folder (optional; defaults to `apps/api/drizzle/migrations`) |

### Startup Behavior

When `DATABASE_URL` is set, the API automatically on startup:
1. Runs pending Drizzle migrations
2. Seeds default settings (`tenant.hide_expired=true`) — idempotent, uses `onConflictDoNothing`
3. Seeds the admin user — idempotent, uses `onConflictDoNothing`
4. Seeds the app version row (`1.0.0`) — idempotent, skips if a version row already exists

All seed operations are safe to re-run on restart without side effects.

---

## Deployment Checklist

### First Deployment

1. Copy `.env.example` to `.env` and fill in all required variables (see Environment Variables table above)
2. Ensure `TZ=Asia/Manila` is set in your environment
3. Build the Docker image: `docker build -t kasero .`
4. Start the container: `docker run --env-file .env -p 3001:3001 kasero`
5. On startup the API will automatically run migrations, seed settings, seed the admin user, and seed the app version row
6. Verify the app is healthy by checking the `/` endpoint (returns `200 OK`)

### Subsequent Upgrades

1. Pull the latest image or rebuild: `docker build -t kasero .`
2. Stop the running container
3. Start the new container with the same `.env`: `docker run --env-file .env -p 3001:3001 kasero`
4. Migrations run automatically on startup — pending migrations are applied, already-applied ones are skipped
5. All seed operations are idempotent — re-running them on restart is safe and produces no duplicates

---

## Operations Runbook

### 1. Clean Install (First-Time Setup)

```bash
# Build and start
docker build -t kasero .
docker run --env-file .env -p 3001:3001 kasero
```

On startup the API:
- Runs all pending migrations (creates all tables, indexes, and triggers)
- Inserts the default settings key (`tenant.hide_expired=true`)
- Inserts the admin user from `ADMIN_USERNAME` + `ADMIN_PASSWORD` env vars
- Inserts a version row (`1.0.0`) in `app_version`

Result: database is fully initialized, app is ready to use.

### 2. Application Restart (Idempotent Startup)

```bash
# Stop and restart with same image
docker stop <container>
docker run --env-file .env -p 3001:3001 kasero
```

On restart:
- Drizzle migration runner checks `_journal.json` — all previously applied migrations are skipped
- All seed operations check for existing rows before inserting — no duplicates are created
- The app starts cleanly with no side effects

### 3. Migration-Based Upgrade

```bash
# Deploy new image that includes pending migrations
docker build -t kasero:new .
docker stop <current-container>
docker run --env-file .env -p 3001:3001 kasero:new
```

On startup with a new image:
- Drizzle runs only the new migration files not yet applied (tracked in `_journal.json`)
- Already-applied migrations are skipped (idempotent)
- Seed operations check for existing rows and skip if already seeded
- The app starts normally after migrations complete

> **Note**: Migrations are run in the application process on startup. There is no separate migration job. If a migration fails, the app will not start — fix the migration and redeploy.

---

## API Endpoints

### Authentication (public)

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/auth/login` | Authenticate admin — returns `{ access_token }` |

Pass the token as `Authorization: Bearer <token>` to access admin endpoints.

### Admin (JWT required)

| Method | Path | Purpose |
|--------|------|---------|
| `*` | `/admin/spaces` | Space management |
| `*` | `/admin/tenants` | Tenant management |
| `*` | `/admin/contracts` | Contract management |
| `POST` | `/admin/contracts/:id/post` | Finalize (post) a contract |
| `GET` | `/admin/contracts/:id/ledger` | View contract ledger |
| `*` | `/admin/contracts/:id/payments` | Record payments |
| `POST` | `/admin/payments/:id/void` | Void a payment |
| `POST` | `/admin/contracts/:id/revoke-code` | Revoke public access code |
| `POST` | `/admin/tenants/:id/entry-link` | Generate tenant self-entry link |

### Internal Frontend-Only

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/internal/contracts/public/:code` | Tenant status lookup by public code |
| `GET` | `/internal/tenants/entry/:token` | Resolve tenant entry token |
| `POST` | `/internal/tenants/entry/:token` | Submit tenant entry details |

---

## CI/CD

Automated via GitHub Actions:

- **PRs to `staging` or `main`**: runs tests and Docker build smoke test
- **Merges to `main`**: release-please creates a GitHub release and pushes a Docker image to `ghcr.io`
- **Feature branches → `staging`**: auto-merged after CI passes

See `.claude/rules/ci-cd-workflows.md` for the full pipeline diagram.

---

## Documentation

| Document | Location |
|----------|----------|
| v1 Project Specification | `specs/v1/kasero-v1-project-specs.md` |
| Implementation Phases | `specs/v1/phases/` |
| SIT/UAT Test Cases — Cycle 1 | `specs/v1/qa/cycle-1/plan.md` |
| SIT Cycle 1 Execution Progress | `specs/v1/qa/cycle-1/progress.txt` |
| Project Overview (internal) | `.claude/rules/project-overview.md` |
| Coding Guidelines | `.claude/rules/coding-guidelines.md` |
| Testing Patterns | `.claude/rules/testing-patterns.md` |
| Git Workflow | `.claude/rules/git-workflow.md` |
| CI/CD Workflows | `.claude/rules/ci-cd-workflows.md` |
| Security Guidelines | `.claude/rules/security-guidelines.md` |

---

## Database Invariants

Enforced at the PostgreSQL level via triggers and constraints:

| Invariant | Mechanism | Migration |
|-----------|-----------|-----------|
| One active contract per space | Partial unique index | `0001_constraints_and_triggers.sql` |
| Tenant expiration date auto-set on status change | `BEFORE UPDATE` trigger | `0001_constraints_and_triggers.sql` |
| Posted contract core fields immutable | `BEFORE UPDATE` trigger | `0002_contract_immutability.sql` |
| No hard deletes on core records | `BEFORE DELETE` triggers | `0003_no_hard_delete.sql` |
| Payment void action recorded | `AFTER UPDATE` trigger | `0004_payment_void_audit.sql` |
| Tenant auto-inactivation by contract expiry | `expire_contract_tenants()` function | `0005_expire_contract_tenants.sql` |

Protected tables (no hard delete): `tenants`, `contracts`, `payments`, `fund`, `payables`, `public_access_codes`, `audit`. Spaces use soft-delete via `deleted_at`.

`expire_contract_tenants()` is a callable PL/pgSQL function (no background job in v1) that marks tenants `inactive` when their contract `end_date` has passed. Call it on a schedule when ready.

All migrations (0000–0005) are tracked in `_journal.json` and are idempotent — safe to re-run against existing databases.

---

## Security

- All secrets must be in `.env` (never committed — see `.gitignore`)
- The NestJS API is never directly reachable from the internet
- Admin routes require JWT authentication
- Public tenant access is read-only and resolved via non-guessable codes
- No hard deletes on any core record — enforced at the database level by triggers
