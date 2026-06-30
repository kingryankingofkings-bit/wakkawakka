---
name: code-reviewer
description: Use when reviewing code for quality, security, performance, maintainability, or adherence to best practices. Triggers on requests like "review this code", "code review", "check this PR", "is this good code", "refactor this", "improve this code", or when assessing code quality before merging. Provides structured review across correctness, security, performance, readability, and maintainability dimensions.
---

# Code Reviewer

## Goal

Provide structured code reviews that catch bugs, security issues, and maintainability problems before they reach production.

## Do Not Use When

- The code is already reviewed and merged
- The request is for a complete rewrite (use `refactor-safety-planner`)

## Required Inputs To Inspect

- Code to review (files, PR, snippets)
- Context (what does this code do?)
- Framework and conventions
- Test coverage

## Review Checklist

### Correctness

- [ ] Logic handles edge cases (empty, null, error)
- [ ] No obvious bugs or infinite loops
- [ ] Error handling present
- [ ] Types are correct

### Security

- [ ] No secrets in code
- [ ] Input validated
- [ ] Output escaped
- [ ] Auth checks present

### Performance

- [ ] No unnecessary re-renders
- [ ] No N+1 queries
- [ ] Efficient algorithms
- [ ] Proper memoization

### Readability

- [ ] Clear variable names
- [ ] Functions are focused
- [ ] Comments explain why, not what
- [ ] Consistent formatting

### Maintainability

- [ ] Single responsibility principle
- [ ] DRY ( Don't Repeat Yourself)
- [ ] Testable structure
- [ ] No magic numbers/strings

## Output Format

```markdown
## Review Summary

**Status**: ✅ Approved / ⚠️ Changes requested / ❌ Needs work

### Issues

| Severity | Line | Issue              | Suggestion                |
| -------- | ---- | ------------------ | ------------------------- |
| High     | 42   | SQL injection risk | Use parameterized queries |
| Medium   | 15   | Magic number       | Extract to named constant |

### Positive

- Good error handling on line 67
- Clean component composition
```

## Coordinates With

- `refactor-safety-planner` — for refactoring
- `security-audit-reviewer` — for security focus
- `performance-audit-optimizer` — for performance focus
