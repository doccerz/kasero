# Coding

## Coding Patterns
> **IMPORTANT**: MUST follow strictly

- Always verify your work
- Avoid over-engineering
- Keep functions small ang single-purpose

## Package / library ethics

- You must not pull or download packages that we don't need yet

### Use test driven development
> **IMPORTANT**: MUST follow strictly

```mermaid
graph TD
    A[Write failing tests]
    A --> B[Git commit]
    B --> C[Execute plan]
    C --> D[Git commit]
    D --> E[Pass the tests for the task]
    E --> F[Git commit]
    F --> G[Pass all tests]
    G --> H[Mark task done]
    H --> I[Git commit]
    I --> J[Update CLAUDE.md]
    J --> K[Git commit]
    K --> L[Create PR to staging]
```

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