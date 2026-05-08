# Feature Development Workflow

Follow this order for every feature:

1. **Branch** — create feature branch named after ticket number (e.g. `feature/TICKET-123-short-description`)
2. **Clarify** — ask user for full feature details before touching code
3. **Plan** — present implementation plan and wait for explicit approval
4. **Implement** — only after approval; no scope creep beyond what was planned
5. **Tests** — write tests for new code; update existing tests that the change affects
6. **Manual test** — hand off to user for manual testing; do not commit yet
7. **Commit** — commit only after user confirms manual test passes
8. **Pull request** — create GitHub PR from feature branch into main/master; do not merge yet
9. **Merge** — merge only after user approves the PR

Never skip or reorder steps. Never commit or merge before user sign-off.
