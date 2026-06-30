---
name: compatibility-matrix-builder
description: Use when checking compatibility between dependencies, verifying peer dependency requirements, ensuring framework versions work together, or building compatibility matrices. Triggers on requests like "are these compatible", "peer dependency", "version matrix", "does X work with Y", "framework compatibility", or when integrating multiple packages that must work together. Prevents runtime errors from incompatible dependency combinations.
---

# Compatibility Matrix Builder

## Goal
Build compatibility matrices showing which versions of dependencies work together.

## Do Not Use When
- Using standard, well-tested combinations
- Compatibility is already verified

## Required Inputs To Inspect
- Package.json dependencies
- Peer dependency requirements
- Framework version constraints
- Known compatibility issues

## Workflow

1. **List all dependencies**: Direct and peer dependencies
2. **Check peer deps**: `npm view <pkg> peerDependencies`
3. **Check for known issues**: GitHub issues, Stack Overflow
4. **Test combinations**: Install and verify key combinations
5. **Document matrix**: What works with what

## Example Matrix

```
                React 18    React 19    Next.js 14    Next.js 15
React 18          ✓           ✗            ✓             ✗
React 19          ✗           ✓            ✗             ✓
Next.js 14        ✓           ✗            ✓             ✗
Next.js 15        ✗           ✓            ✗             ✓
```

## Safety Rules
- Always check peer dependencies
- Test before committing to version combination
- Pin versions once verified

## Coordinates With
- `package-version-verifier` — for version checking
- `dependency-conflict-resolver` — for conflicts
