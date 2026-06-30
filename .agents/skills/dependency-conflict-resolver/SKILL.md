---
name: dependency-conflict-resolver
description: Use when resolving npm/package dependency conflicts, version mismatches, peer dependency issues, or package installation failures. Triggers on requests like "dependency conflict", "npm install failed", "peer dependency", "version mismatch", "cannot resolve", "incompatible versions", "lockfile issues", "node_modules problem", or when package management issues block development.
---

# Dependency Conflict Resolver

## Goal

Resolve package dependency issues with minimal disruption to the project.

## Do Not Use When

- Dependencies install cleanly
- The issue is not related to packages

## Required Inputs To Inspect

- package.json and lockfile
- Error message from install
- Node version
- Package manager (npm, yarn, pnpm)

## Workflow

1. **Read the error**: Exact conflict message
2. **Check Node version**: `node -v` matches engine requirements
3. **Clear cache**: `npm cache clean --force`
4. **Delete node_modules**: Fresh install
5. **Check for duplicates**: `npm ls <package>`
6. **Override resolutions**: Force specific versions
7. **Update selectively**: One package at a time
8. **Verify**: Install succeeds, build passes

## Common Fixes

```bash
# Peer dependency conflict
npm install --legacy-peer-deps

# Force resolution
npm install package@version --force

# Clean slate
rm -rf node_modules package-lock.json
npm install

# Check outdated
npm outdated

# Update specific package
npm update package-name
```

## Quality Checks

- [ ] Install completes without errors
- [ ] Build succeeds
- [ ] Tests pass
- [ ] No duplicate packages

## Safety Rules

- Commit before major dependency changes
- Update one major dependency at a time
- Read changelogs before major version updates
- Pin critical dependencies

## Coordinates With

- `build-error-fixer` — for build issues caused by deps
- `maintenance-update-planner` — for planned updates
