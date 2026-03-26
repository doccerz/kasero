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
- Admin-only access for all write operations

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

---

## API Endpoints

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

### Internal Frontend-Only

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/internal/contracts/public/:code` | Tenant status lookup by public code |

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
| Project Overview (internal) | `.claude/rules/project-overview.md` |
| Coding Guidelines | `.claude/rules/coding-guidelines.md` |
| Testing Patterns | `.claude/rules/testing-patterns.md` |
| Git Workflow | `.claude/rules/git-workflow.md` |
| CI/CD Workflows | `.claude/rules/ci-cd-workflows.md` |
| Security Guidelines | `.claude/rules/security-guidelines.md` |

---

## Security

- All secrets must be in `.env` (never committed — see `.gitignore`)
- The NestJS API is never directly reachable from the internet
- Admin routes require JWT authentication
- Public tenant access is read-only and resolved via non-guessable codes
- No hard deletes on any core record
