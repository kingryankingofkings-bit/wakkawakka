---
name: build-error-fixer
description: Use when fixing build failures, compilation errors, bundler issues, TypeScript errors, or any error that prevents the project from building. Triggers on requests like "build failed", "compilation error", "won't compile", "TypeScript error", "webpack error", "vite error", "build broken", "CI failed", or when `npm run build` produces errors. Provides systematic diagnosis of build pipeline failures.
---

# Build Error Fixer

## Goal
Diagnose and fix build failures quickly to restore the build pipeline.

## Do Not Use When
- Build succeeds
- The error is runtime (not build-time)

## Required Inputs To Inspect
- Full build error output
- Build tool (Vite, Webpack, Next.js, etc.)
- TypeScript configuration
- Recent changes

## Workflow

1. **Read the error**: Start from the first error, not the last
2. **Identify the file**: Which file caused the error
3. **Check the line**: What's wrong at that location
4. **Check imports**: Missing or incorrect imports
5. **Check types**: TypeScript type errors
6. **Check config**: tsconfig, build config changes
7. **Check dependencies**: Missing or incompatible packages
8. **Fix incrementally**: One error at a time
9. **Rebuild**: Verify the fix

## Common Build Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Cannot find module | Missing import or package | Install package or fix path |
| Type not assignable | Type mismatch | Fix type or add assertion |
| Property does not exist | Wrong type or typo | Fix type definition |
| Syntax error | Invalid JS/TS | Check for typos |
| Out of memory | Large bundle | Increase memory or split chunks |

## Quality Checks
- [ ] `npm run build` succeeds
- [ ] `npm run dev` starts
- [ ] No TypeScript errors
- [ ] Linting passes

## Coordinates With
- `dependency-conflict-resolver` — for package issues
- `typescript-type-debugger` — for type errors
