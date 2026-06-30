---
name: current-docs-researcher
description: Use when researching current documentation for libraries, frameworks, APIs, or platforms to verify syntax, check for breaking changes, or find the correct way to implement features. Triggers on requests involving uncertain API usage, new framework versions, deprecated methods, or when the agent is unsure about the exact syntax or behavior of a library. The agent should use this skill before writing code that depends on potentially changed APIs. Prevents hallucinated APIs and outdated patterns.
---

# Current Docs Researcher

## Goal

Verify API signatures, syntax, and best practices against current official documentation before implementing.

## Do Not Use When

- The API is well-known and stable
- Working with internal/proprietary APIs not publicly documented
- The implementation is already verified

## Required Inputs To Inspect

- Library/framework name and version
- Specific feature or API to verify
- Current documentation URL
- Release notes for recent versions

## Workflow

1. **Identify the exact version**: Check package.json for installed version
2. **Find official docs**: Navigate to official documentation
3. **Verify the API**: Check exact function signatures, parameters, return types
4. **Check for breaking changes**: Read migration guides
5. **Note deprecations**: Note any deprecated features
6. **Implement with verified syntax**: Use exact syntax from docs

## Documentation Sources

| Type     | Source               |
| -------- | -------------------- |
| React    | react.dev            |
| Next.js  | nextjs.org/docs      |
| Vue      | vuejs.org            |
| Svelte   | svelte.dev/docs      |
| Tailwind | tailwindcss.com/docs |
| Prisma   | prisma.io/docs       |
| Drizzle  | ORM Drizzle docs     |
| Stripe   | stripe.com/docs      |
| Auth.js  | authjs.dev           |

## Safety Rules

- Never assume API from memory — always verify
- Check the installed version, not latest
- Note when docs were last verified
- Flag if documentation is unclear

## Coordinates With

- All implementation skills — verify before coding
- `package-version-verifier` — for version checks
