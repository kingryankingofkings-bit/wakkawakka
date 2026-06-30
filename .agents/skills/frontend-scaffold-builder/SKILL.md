---
name: frontend-scaffold-builder
description: Use when initializing new frontend projects, setting up web application boilerplate, or creating the foundational project structure for any web build. Triggers on requests like "scaffold a new project", "setup React/Vue/Next.js", "create a new web app", "initialize the frontend", or when starting a greenfield project. Produces a running dev environment with proper folder structure, configuration, and tooling. Framework-aware for React, Vue, Svelte, Astro, and others.
---

# Frontend Scaffold Builder

## Goal
Initialize production-ready frontend projects with correct structure, tooling, and configuration.

## Do Not Use When
- Project already exists and has configuration
- Adding to an existing project (use the specific feature skill)
- The request is to set up backend only

## Required Inputs To Inspect
- Chosen framework (React, Vue, Svelte, Astro, etc.)
- Rendering strategy (SSR, SSG, SPA, hybrid)
- Styling approach (Tailwind, CSS Modules, Sass, etc.)
- TypeScript preference
- Package manager preference (npm, yarn, pnpm)

## Workflow

1. **Select initialization method**: Use official CLI/scaffold for the framework
2. **Configure TypeScript**: tsconfig with strict mode
3. **Configure styling**: Tailwind, preprocessor, or CSS-in-JS setup
4. **Set up folder structure**: Follow framework conventions + project needs
5. **Configure linting**: ESLint + Prettier with framework-specific rules
6. **Add git hooks**: Husky + lint-staged (optional but recommended)
7. **Set up environment config**: .env.example with documented variables
8. **Add base dependencies**: Router, state management, HTTP client as needed
9. **Verify dev server**: `npm run dev` starts without errors
10. **Document setup**: README with install and run instructions

See `references/framework-scaffold-commands.md` for exact initialization commands per framework.

## Output Format

Produce a running project with this structure:

```
my-app/
├── src/
│   ├── components/
│   │   └── ui/          # Base components
│   ├── lib/
│   │   └── utils.ts     # Shared utilities
│   ├── hooks/           # Custom hooks
│   ├── types/           # TypeScript types
│   ├── styles/          # Global styles
│   └── app/ or pages/   # Route components
├── public/
├── tests/
├── .env.example
├── .eslintrc
├── .prettierrc
├── tsconfig.json
└── package.json
```

## Quality Checks
- [ ] `npm run dev` starts without errors
- [ ] `npm run build` completes successfully
- [ ] TypeScript compiles without errors
- [ ] Linting passes
- [ ] .env.example documents all required variables
- [ ] README has install and run instructions

## Safety Rules
- Never commit .env files or secrets
- Use exact package versions in package.json (pin dependencies)
- Include .nvmrc or engines field for Node version

## Failure Handling
If scaffold fails, capture the exact error, check Node version compatibility, and try the next most stable initialization method.

## Coordinates With
- `stack-selection-advisor` — for framework choices
- `design-system-enforcer` — for styling setup
- `responsive-layout-builder` — for initial layouts
