# Coding

## Coding Patterns
> **IMPORTANT**: MUST follow strictly

- Always verify your work
- Avoid over-engineering
- Keep functions small ang single-purpose

## Package / library ethics

- You must not pull or download packages that we don't need yet

### ⚠️ Use test-driven development (TDD) 
> ⚠️ MANDATORY TASK WORKFLOW
> **MUST follow for EVERY task — no exceptions, no shortcuts**
> **CRITICAL — applies unconditionally, even in non-interactive/automated runs**

```mermaid
graph TD
    A0[Create branch: feat/fix/issue-XXXX]
    A0 --> A[Write failing tests]
    A --> B[Git commit: test: add failing tests]
    B --> C[Implement — minimum code to pass]
    C --> D[Git commit: feat/fix: description]
    D --> E[Run full test suite]
    E --> F[Git commit if fixes needed]
    F --> G[STOP — update CLAUDE.md with learnings]
    G --> H[Git commit: docs: update CLAUDE.md]
    H --> I[STOP — open PR to staging NOW]
    I --> J[Phase COMPLETE]
```

> **STOP nodes are hard gates** — reach one, do that step before reading further.
> Tests passing is not task completion. The open PR is the deliverable.

## Coding Standards

### Path Handling
- Use relative paths: e.g. `.claude/rules/`
- Never hardcode absolute paths or home directories
- Use `path.join()` for cross-platform compatibility

### Naming Conventions
- Files: `kebab-case.js`, `PascalCase.js` (for classes)
- Functions/Variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Components: `hyphenated-names`

### Error Handling
- Use try/catch for async operations
- Provide helpful error messages
- Log errors with context
- Implement fallback mechanisms

### Others
- Use 4 spaces indentation 