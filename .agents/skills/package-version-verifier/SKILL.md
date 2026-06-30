---
name: package-version-verifier
description: Use when checking package versions, verifying dependency compatibility, finding latest stable versions, or resolving version-related issues. Triggers on questions like "what version of", "latest version", "is this version compatible", "which version should I use", "version conflict", or when version information affects implementation decisions. Prevents compatibility issues from version mismatches.
---

# Package Version Verifier

## Goal

Verify package versions and compatibility before installation or upgrades.

## Do Not Use When

- Versions are already specified and working
- No version concerns exist

## Required Inputs To Inspect

- package.json dependencies
- npm registry or package documentation
- Changelog/release notes
- Peer dependency requirements

## Workflow

1. **Check installed**: `npm list <package>`
2. **Check latest**: `npm view <package> version`
3. **Check changelog**: GitHub releases or CHANGELOG.md
4. **Check peer deps**: `npm view <package> peerDependencies`
5. **Check compatibility**: Ensure versions work together
6. **Pin or range**: Decide on pinning vs semver range

## Commands

```bash
# Check installed version
npm list react

# Check latest available
npm view react version

# Check all versions
npm view react versions --json

# Check peer dependencies
npm view next peerDependencies

# Check for outdated
npm outdated
```

## Safety Rules

- Pin critical dependencies (exact version)
- Use caret (^) for stable packages
- Read changelogs for major version updates
- Test after version changes

## Coordinates With

- `dependency-conflict-resolver` — for conflict resolution
- `current-docs-researcher` — for API verification
