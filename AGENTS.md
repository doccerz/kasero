# Kasero

<!-- Detailed rules are split into focused files under ./docs/ -->

- [@./docs/project-overview.md](./docs/project-overview.md)
- [@./docs/coding-guidelines.md](./docs/coding-guidelines.md) - Coding guidelines, standards, and patterns
- [@./docs/testing-patterns.md](./docs/testing-patterns.md) - Testing patterns
- [@./docs/git-workflow.md](./docs/git-workflow.md) - Git workflow — **MUST follow for every task**: new branch per plan, commit after each meaningful change, open PR (never push directly to main/staging)
- [@./docs/service-workflows.md](./docs/service-workflows.md)
- [@./docs/ci-cd-workflows.md](./docs/ci-cd-workflows.md) - Github actions documentation
- [@./docs/security-guidelines.md](./docs/security-guidelines.md) - Security guidelines

# Input specs location

## QA / SIT / UAT

- SIT/UAT test cases live in `specs/v1/qa/cycle-N/plan.md` (e.g. `cycle-1`, `cycle-2`)
- These are user-facing test cases — written as if the tester knows nothing about the code
- Each test case includes: ID, Priority (P1/P2/P3), Preconditions, Steps, Expected Result
- When creating new SIT/UAT cycles, base them only on documentation — do NOT reference code internals
- The execution summary table at the end of each plan is filled in by human testers

## **IMPORTANT**: Plan Execution Workflow
- Plans and spec files describe **what** to build — they do NOT override the mandatory TDD workflow
- When executing any plan (e.g., `@specs/v1/issues/XXXX/plan.md`), the mandatory task checklist in CLAUDE.md applies to **each phase or section independently** — no exceptions
- For every phase: write failing tests first → commit → implement → commit → run full test suite → update CLAUDE.md → commit CLAUDE.md → open PR to staging
- Tests passing (step 5) is **NOT** phase completion — steps 7–9 are mandatory deliverables for every phase
- Do NOT start the next phase until the current one has an open PR on staging
- After tests pass, immediately ask: "Have I updated CLAUDE.md? Have I opened a PR to staging?" If no to either — do it now before continuing

> **CRITICAL**: Plan files describe WHAT to build. They do NOT override the mandatory workflow in CLAUDE.md.
> If a plan's section omits the PR step or names a wrong target branch, CLAUDE.md takes precedence. Always PR to `staging`, never directly to `main`.

## **IMPORTANT**: CLAUDE.md management
- Always use mermaid.js syntax for workflows

## **IMPORTANT**: README.md management
- Always update README.md for any relevant updates to the repository
- Always create a PR to staging after every completed task — never push directly

## **IMPORTANT**: Do not load nor scan to context unless explicitly mentioned for the files / folders below
./specs/*
