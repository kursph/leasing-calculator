Use the Agent tool to launch 2 instances of the `code-reviewer` subagent (defined in `.claude/agents/code-reviewer.md`) in parallel. Each focuses on different aspects. Wait for both to finish, then merge findings into a single report.

## Agent 1 — Correctness & Security
Spawn `code-reviewer` subagent with this prompt focus:
- Logic errors and edge cases
- Missing or incorrect input validation
- Type safety: unsafe casts, implicit `any`, missing types
- Security: injection risks, missing sanitization, exposed data

## Agent 2 — Structure & Consistency
Spawn `code-reviewer` subagent with this prompt focus:
- Naming and pattern consistency across codebase
- Architectural issues: wrong layer for logic, tight coupling
- Dead code, unused imports, unreachable branches
- Inconsistencies between backend types (`src/types.ts`) and frontend models (`core/models/`)

## After both finish

Merge findings into one report grouped by severity:
- **error** — must fix before commit
- **warning** — should fix
- **info** — optional improvement

Format: `[file:line] problem — suggestion`. No duplicates between agents.
