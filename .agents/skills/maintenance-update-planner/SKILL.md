---
name: maintenance-update-planner
description: Use when planning dependency updates, framework upgrades, security patches, or routine maintenance for web projects. Triggers on requests like "update dependencies", "upgrade Next.js", "npm update", "security patch", "framework upgrade", "dependency refresh", "maintenance window", "update packages", or when keeping the project current and secure. Provides safe update workflows with testing gates and rollback plans.
---

# Maintenance and Update Planner

## Goal
Keep dependencies current with safe update practices and minimal disruption.

## Do Not Use When
- Dependencies are already up to date
- No update is needed

## Required Inputs To Inspect
- Current dependencies and versions
- Outdated packages (`npm outdated`)
- Security advisories (`npm audit`)
- Test coverage
- Changelog compatibility

## Workflow

1. **Check outdated**: `npm outdated`
2. **Check security**: `npm audit`
3. **Read changelogs**: Check for breaking changes
4. **Update dev dependencies**: Lower risk first
5. **Update minor/patch**: `npm update`
6. **Test**: Run full test suite
7. **Update major**: One at a time, test each
8. **Commit**: Per-dependency update commits

## Update Order

```
1. Dev dependencies (ESLint, Prettier, types)
2. Patch updates (bug fixes)
3. Minor updates (features, backward compatible)
4. Major updates (breaking changes — one at a time)
```

## Quality Checks
- [ ] `npm audit` shows no high/critical vulnerabilities
- [ ] All tests pass after updates
- [ ] Build succeeds
- [ ] Changelogs reviewed for breaking changes

## Safety Rules
- Commit before updating
- Update one major dependency at a time
- Test after each update
- Have rollback plan

## Coordinates With
- `dependency-conflict-resolver` — for conflicts during updates
- `security-audit-reviewer` — for security patches
