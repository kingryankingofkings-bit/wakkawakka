---
name: bug-reproduction-debugger
description: Use when investigating bugs, reproducing reported issues, tracking down root causes, or fixing broken functionality in websites and web applications. Triggers on requests like "fix this bug", "broken feature", "not working", "error occurred", "investigate issue", "debug this", "trace the problem", or when any unexpected behavior needs diagnosis. Provides systematic debugging workflows from reproduction to fix verification.
---

# Bug Reproduction and Debugger

## Goal
Systematically reproduce, diagnose, and fix bugs with minimal changes and verified solutions.

## Do Not Use When
- The task is a feature request (not a bug)
- Bug is already diagnosed and fix is known

## Required Inputs To Inspect
- Bug description and expected vs actual behavior
- Steps to reproduce (if provided)
- Error messages and stack traces
- Environment (browser, OS, device)
- Recent changes (git log)

## Workflow

1. **Reproduce the bug**: Follow reported steps exactly
2. **Isolate the cause**: Binary search — comment out half the code
3. **Check recent changes**: `git log --oneline -20` for culprits
4. **Add logging**: Console.log or debugger at key points
5. **Check the obvious**: Typos, missing imports, wrong variable names
6. **Verify the fix**: Fix → reproduce steps → confirm resolved
7. **Check for regressions**: Ensure fix doesn't break other things
8. **Add regression test**: Prevent the bug from returning

## Debugging Checklist

```
□ Reproduce consistently
□ Check browser console for errors
□ Check network tab for failed requests
□ Check server logs
□ Review recent git changes
□ Test in different browser
□ Test with clean cache/incognito
□ Add strategic console.log statements
□ Use debugger breakpoints
□ Check for race conditions
□ Verify data (is it what you expect?)
```

## Quality Checks
- [ ] Bug is reproducible before fix
- [ ] Fix is minimal and targeted
- [ ] Fix verified by reproduction steps
- [ ] No regressions introduced
- [ ] Regression test added

## Safety Rules
- Don't fix symptoms — fix root causes
- Don't change unrelated code
- Always verify the fix doesn't break other things

## Coordinates With
- `console-network-error-diagnoser` — for error analysis
- `test-suite-builder` — for regression tests
- `code-reviewer` — for fix review
