# Phase 3 — Authentication & Admin Access

## Context

Phase 2 delivered a complete DB invariants layer. Phase 3 implements the v1 access model: a single seeded ADMIN user authenticated via JWT. All `/admin/*` routes must be protected; the login endpoint and public-access endpoint remain open.

**Current state:**
- `auth/` module exists but is completely empty (no strategies, no guards, no login)
- `@nestjs/jwt` is NOT installed; `bcryptjs` IS installed
- `jwtSecret` and `jwtExpiresIn` are already in `config.ts`
- `admin_users` table exists with `id`, `username`, `passwordHash`
- Admin user is seeded via `seedAdminUser()` in `seed.ts`
- `DatabaseModule` is `@Global()` but **NOT imported in AppModule** — this must be fixed
- All endpoints are currently unprotected

**Branch:** `feat/phase-02-db-schema-migrations-invariants` is the current branch (phase 3 will need a new branch per git-workflow rules)

---

## Approach

Use `@nestjs/jwt` directly — no Passport. One role, one guard. Avoid over-engineering.

- `POST /auth/login` → validates credentials, returns `{ access_token }`
- `JwtAuthGuard` → custom `CanActivate` that extracts Bearer token and verifies with `JwtService`
- Guard applied at controller level to all admin controllers

---

## Groups

### Group 1 — Fix DatabaseModule + Install @nestjs/jwt

**Tasks:**
- [x] Create new branch: `feat/phase-03-authentication-admin-access`
- [x] Install `@nestjs/jwt` inside `apps/api/`
- [x] Add `DatabaseModule` to `AppModule` imports (fix the existing bug)
- [x] Add `AuthModule` exports `JwtModule` so guard can use `JwtService` from other modules
- [x] Write/update module compilation test to verify it compiles

**Critical files:**
- `apps/api/src/app.module.ts` — add `DatabaseModule` import
- `apps/api/package.json` — add `@nestjs/jwt`

---

### Group 2 — Auth Service + Login Endpoint (TDD)

**Goal:** `POST /auth/login` returns a JWT on valid credentials, 401 on invalid.

**Failing tests first** (`auth.controller.spec.ts`):
- [x] `POST /auth/login` with valid `username`/`password` → HTTP 200 + `{ access_token: <string> }`
- [x] `POST /auth/login` with wrong password → HTTP 401
- [x] `POST /auth/login` with unknown username → HTTP 401

**Implementation:**

`auth.service.ts`:
```typescript
async login(username: string, password: string): Promise<{ access_token: string }> {
    // 1. Query admin_users by username
    // 2. compare(password, user.passwordHash) via bcryptjs
    // 3. If mismatch → throw UnauthorizedException
    // 4. jwtService.sign({ sub: user.id, username: user.username })
    // 5. return { access_token }
}
```

`auth.controller.ts`:
```typescript
@Post('login')
login(@Body() body: { username: string; password: string }) {
    return this.authService.login(body.username, body.password);
}
```

`auth.module.ts`:
```typescript
@Module({
    imports: [
        JwtModule.register({
            secret: appConfig.jwtSecret,
            signOptions: { expiresIn: appConfig.jwtExpiresIn },
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService],
    exports: [JwtModule],   // ← export so guard can inject JwtService elsewhere
})
```

**Test pattern:** Use `@nestjs/testing` with a mocked DB provider (no real DB needed for these tests — inject a mock that returns a fake admin_users row or null).

**Critical files:**
- [x] `apps/api/src/auth/auth.service.ts`
- [x] `apps/api/src/auth/auth.controller.ts`
- [x] `apps/api/src/auth/auth.module.ts`
- [x] `apps/api/src/auth/auth.controller.spec.ts` (new)

---

### Group 3 — JwtAuthGuard + Route Protection (TDD)

**Goal:** All `/admin/*` controllers return 401 without a valid Bearer token.

**Failing tests first** (`jwt-auth.guard.spec.ts`):
- Request with no `Authorization` header → `canActivate` returns false (or throws 401)
- Request with invalid/expired token → `canActivate` returns false
- Request with valid token → `canActivate` returns true

**Also add e2e-style guard tests** in existing controller spec files (or a dedicated `auth.e2e.spec.ts`):
- `GET /admin/spaces` without token → 401
- `GET /admin/spaces` with valid token → not 401

**Implementation:**

`auth/jwt-auth.guard.ts`:
```typescript
@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(private jwtService: JwtService) {}

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers['authorization'];
        if (!authHeader?.startsWith('Bearer ')) throw new UnauthorizedException();
        try {
            const token = authHeader.slice(7);
            request.user = this.jwtService.verify(token);
            return true;
        } catch {
            throw new UnauthorizedException();
        }
    }
}
```

**Apply guard to admin controllers** (all of these get `@UseGuards(JwtAuthGuard)`):
- `SpacesController`
- `TenantsController`
- `ContractsController`
- `LedgersController`
- `SettingsController`
- `AuditController`

**NOT guarded:**
- `AuthController` (login endpoint)
- `PublicAccessController` (public tenant endpoint)
- `AppController` (health check)

**Critical files:**
- `apps/api/src/auth/jwt-auth.guard.ts` (new)
- `apps/api/src/auth/jwt-auth.guard.spec.ts` (new)
- `apps/api/src/spaces/spaces.controller.ts`
- `apps/api/src/tenants/tenants.controller.ts`
- `apps/api/src/contracts/contracts.controller.ts`
- `apps/api/src/ledgers/ledgers.controller.ts`
- `apps/api/src/settings/settings.controller.ts`
- `apps/api/src/audit/audit.controller.ts`

---
### Group 3.1 - Fix github action issues
#17 [builder 6/6] RUN npm run build
#17 0.453 
#17 0.453 > kasero-api@0.0.1 build
#17 0.453 > nest build
#17 0.453 
#17 3.934 src/auth/auth.module.ts:11:28 - error TS2322: Type 'string' is not assignable to type 'number | StringValue | undefined'.
#17 3.934 
#17 3.934 11             signOptions: { expiresIn: appConfig.jwtExpiresIn },
#17 3.934                               ~~~~~~~~~
#17 3.934 
#17 3.934 Found 1 error(s).
---

### Group 4 — Integration Verification + PR

**Tasks:**
- `npm test` — all tests pass (DB tests self-skip without `DATABASE_URL`)
- Verify login → use token → access protected route flow manually if DB available
- Update `specs/v1/phases/phase-03/progress.txt`
- Update `service-workflows.md` with any new patterns learned
- Update `README.md` if relevant
- Create PR: `feat/phase-03-authentication-admin-access` → `staging`

---

## Verification

```bash
# All tests pass (no DATABASE_URL needed for auth tests)
npm test

# Manual smoke test (with DB running)
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"<ADMIN_PASSWORD>"}'
# → { "access_token": "..." }

# Without token → 401
curl http://localhost:3001/admin/spaces
# → 401 Unauthorized

# With token → 200 (or empty array)
curl http://localhost:3001/admin/spaces \
  -H "Authorization: Bearer <token>"
```
