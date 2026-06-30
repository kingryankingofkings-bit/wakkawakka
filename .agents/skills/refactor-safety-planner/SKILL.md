---
name: refactor-safety-planner
description: Use when planning code refactoring, restructuring components, migrating patterns, or improving code quality without changing functionality. Triggers on requests like "refactor this", "restructure", "clean up code", "improve this component", "migrate to new pattern", "tech debt", "simplify this", or when code needs improvement without feature changes. Provides safe refactoring workflows with verification steps and rollback plans.
---

# Refactor Safety Planner

## Goal

Refactor code safely with clear steps, verification at each point, and rollback capability.

## Do Not Use When

- The change adds new functionality (not refactoring)
- Code is working fine and no improvement needed

## Required Inputs To Inspect

- Code to refactor
- Current tests (must exist before refactoring)
- Desired outcome
- Risk assessment

## Workflow

1. **Ensure tests exist**: Write tests if none exist (safety net)
2. **Document current behavior**: What does it do now?
3. **Plan small steps**: One change at a time
4. **Make one change**: Small, focused refactoring
5. **Run tests**: Verify nothing broke
6. **Commit**: Save this checkpoint
7. **Repeat**: Next small change
8. **Final verification**: Full test suite passes

## Refactoring Patterns

| Pattern               | When                  |
| --------------------- | --------------------- |
| Extract function      | Function too long     |
| Extract component     | Component too complex |
| Rename                | Unclear names         |
| Simplify conditionals | Nested ifs            |
| Remove duplication    | Repeated code         |
| Move function         | Wrong file/module     |

## Safety Rules

- Never refactor without tests
- One refactoring per commit
- Don't refactor and add features simultaneously
- If tests break, fix immediately before continuing

## Quality Checks

- [ ] Tests pass before and after
- [ ] No functionality changed
- [ ] Code is cleaner/more maintainable
- [ ] Performance not degraded

## Coordinates With

- `test-suite-builder` — for test coverage
- `code-reviewer` — for review after refactoring
