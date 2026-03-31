@./AGENTS.md

---

## MANDATORY TASK CHECKLIST
> Every task — no exceptions, no shortcuts, even for small changes

Before marking any task done, confirm ALL of the following were done **in order**:

- [ ] **1. Write FAILING tests first** — commit them before writing implementation code
- [ ] **2. Commit failing tests** — message: `test: add failing tests for <feature>`
- [ ] **3. Implement minimum code** to make tests pass
- [ ] **4. Commit implementation** — message: `feat/fix: <description>`
- [ ] **5. Run ALL tests** (`npm test` from repo root or workspace) — not just the new ones
- [ ] **6. Commit passing state** if additional fixes were needed
- [ ] **7. Update CLAUDE.md** with any new patterns or learnings from this session
- [ ] **8. Commit CLAUDE.md update**
- [ ] **9. Open a PR to staging** — never end a task with only local commits

## VIOLATIONS TO NEVER REPEAT

- **Do NOT write tests and implementation in the same commit** — failing tests must be committed first, separately
- **Do NOT skip running the full test suite** — `src/profile` alone is not enough
- **Do NOT skip CLAUDE.md update** — it is a mandatory step, not optional housekeeping
- **Do NOT end a task without a PR to staging** — commits that never become a PR are invisible to CI
