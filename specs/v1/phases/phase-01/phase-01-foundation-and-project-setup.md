# Phase 1 — Foundation & Project Setup

## Goal
Stand up the application skeleton using the target stack and architectural rules.

## Objectives
- Initialize the frontend and backend projects.
- Prepare the PostgreSQL and Drizzle workflow.
- Establish baseline environment configuration.
- Enforce the high-level architecture from day one.

## Tasks
### Repository and Environment
- Initialize the frontend application in Next.js.
- Initialize the backend application in NestJS.
- Configure environment variables for local and non-local environments.
- Set up PostgreSQL connectivity.
- Configure Drizzle ORM and migration workflow.

### Backend Module Scaffolding
- Create modules for:
  - auth
  - settings
  - spaces
  - tenants
  - contracts
  - ledgers
  - public access
  - audit

### Frontend Scaffolding
- Create app sections for:
  - admin login
  - dashboard
  - spaces
  - tenants
  - contracts
  - public tenant status view
  - tenant self-entry flow

### Architectural Guardrails
- Ensure the backend is not directly exposed to the public.
- Ensure public routes are frontend-mediated.
- Keep the ORM layer thin and explicit.
- Establish database-first business rule enforcement.

## Deliverables
- Running frontend and backend skeletons
- Shared environment setup
- Basic module structure
- Initial migration setup

## Exit Criteria
- Developers can run the app locally.
- Database connection and migrations work.
- Module structure is ready for feature implementation.
