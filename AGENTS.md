# [Project Name]

## ⚠️ MANDATORY TASK WORKFLOW
> **MUST follow for EVERY task — no exceptions, no shortcuts**

### Before starting
1. Create a new branch: `feat/issue-XXXX-short-desc` or `fix/issue-XXXX-short-desc`
2. NEVER commit to or work on `main` or `staging` directly

### TDD cycle — repeat per feature / fix
3. Write failing tests first (unit and/or E2E as applicable)
4. `git commit` the failing tests
5. Implement the minimum code to make tests pass
6. `git commit` the implementation
7. Verify ALL tests pass (`npm test` + playwright if applicable)
8. `git commit` the passing state

### Finishing a task
9. Update `CLAUDE.md` (or its referenced docs) with any new patterns or learnings from this task
10. `git commit` the CLAUDE.md update
11. Create a PR to `staging` — NEVER push directly to `staging` or `main`

> See full detail: [TDD workflow](./docs/coding-guidelines.md) | [Git rules](./docs/git-workflow.md)

---

<!-- Detailed rules are split into focused files under ./docs/ -->

- [Project overview](./docs/project-overview.md)
    - 
- [Coding guidelines](./docs/coding-guidelines.md) - Coding guidelines, standards, and patterns
- [Testing patterns](./docs/testing-patterns.md) - Testing patterns
- [Git workflow](./docs/git-workflow.md) - Git workflow — **MUST follow for every task**: new branch per plan, commit after each meaningful change, open PR (never push directly to main/staging)
- [Service workflows](./docs/service-workflows.md)
- [CI/CD workflows](./docs/ci-cd-workflows.md) - Github actions documentation
- [Security guidelines](./docs/security-guidelines.md) - Security guidelines

# Input specs location

## QA / SIT / UAT

- SIT/UAT test cases live in `specs/v1/qa/cycle-N/plan.md` (e.g. `cycle-1`, `cycle-2`)
- These are user-facing test cases — written as if the tester knows nothing about the code
- Each test case includes: ID, Priority (P1/P2/P3), Preconditions, Steps, Expected Result
- When creating new SIT/UAT cycles, base them only on documentation — do NOT reference code internals
- The execution summary table at the end of each plan is filled in by human testers

## **IMPORTANT**: CLAUDE.md management
- Always use mermaid.js syntax for workflows

## **IMPORTANT**: README.md management
- Always update README.md for any relevant updates to the repository
- Always create a PR to staging after every completed task — never push directly

## **IMPORTANT**: Do not load nor scan to context unless explicitly mentioned for the files / folders below
./specs/*
