---
name: framework-migration-researcher
description: Use when planning migration between frameworks, upgrading major versions, or modernizing legacy codebases. Triggers on requests like "migrate from React to Vue", "upgrade Next.js", "migrate to TypeScript", "modernize the codebase", "framework switch", "version upgrade", "rewrite in", or when significant architectural migration is being considered. Provides migration path analysis, breaking change research, and phased migration strategies.
---

# Framework Migration Researcher

## Goal

Research and plan safe migrations between frameworks or major versions with minimal risk.

## Do Not Use When

- Migration is already planned and documented
- The change is minor (patch update)

## Required Inputs To Inspect

- Current framework and version
- Target framework and version
- Codebase size and complexity
- Migration guides and codemods available
- Breaking changes list

## Workflow

1. **Read migration guide**: Official guide for the target version
2. **List breaking changes**: All breaking changes between versions
3. **Check codemods**: Available automated migration tools
4. **Assess effort**: Estimated time and complexity
5. **Plan phased approach**: Incremental migration if possible
6. **Test strategy**: How to verify nothing broke
7. **Rollback plan**: How to revert if issues arise

## Migration Strategies

| Strategy         | When                                   |
| ---------------- | -------------------------------------- |
| Big bang         | Small codebase, simple migration       |
| Incremental      | Large codebase, component-by-component |
| Strangler fig    | Legacy system, gradually replace       |
| Branch migration | Major rewrite, parallel development    |

## Quality Checks

- [ ] All breaking changes accounted for
- [ ] Test suite passes after migration
- [ ] No deprecated APIs remain
- [ ] Performance not degraded

## Coordinates With

- `refactor-safety-planner` — for safe changes
- `test-suite-builder` — for regression testing
