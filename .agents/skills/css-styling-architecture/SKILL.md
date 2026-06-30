---
name: css-styling-architecture
description: Use when making decisions about CSS architecture, choosing styling approaches, configuring CSS tools, or resolving styling conflicts. Triggers on questions like "Tailwind or CSS Modules", "how to organize styles", "Sass vs PostCSS", "CSS-in-JS setup", "style conflicts", "specificity issues", or when setting up the styling foundation for a project. Advises on architecture patterns and implements the chosen approach.
---

# CSS Styling Architecture

## Goal

Establish maintainable CSS architecture with clear conventions, minimal conflicts, and optimal performance.

## Do Not Use When

- Styling is already configured and working
- The task is to change specific visual styles
- Using a UI framework that handles all styling (Material-UI, etc.)

## Required Inputs To Inspect

- Framework and build tool
- Team size and CSS expertise
- Component architecture plan
- Performance requirements
- Existing CSS (if migrating)

## Workflow

1. **Evaluate approaches**: Utility-first (Tailwind), CSS Modules, BEM, CSS-in-JS, Sass
2. **Consider constraints**: Build tool support, SSR compatibility, bundle size
3. **Recommend architecture**: Match approach to team and project
4. **Configure tooling**: Setup build pipeline for chosen approach
5. **Establish conventions**: Naming, file organization, specificity rules
6. **Document patterns**: How to handle common scenarios
7. **Plan for performance**: Critical CSS, code splitting, purging

## Architecture Patterns

### Utility-First (Tailwind)

- Pros: Rapid development, no naming fatigue, small CSS bundle
- Cons: HTML verbosity, learning curve
- Best for: Teams that value speed, component-heavy apps

### CSS Modules

- Pros: Scoped styles, explicit dependencies, zero runtime
- Cons: File proliferation, composition syntax
- Best for: Component libraries, teams wanting explicit CSS

### BEM

- Pros: Clear naming, scalable, no tooling required
- Cons: Verbose names, manual scoping
- Best for: Traditional CSS teams, smaller projects

### CSS-in-JS (Styled Components, Emotion)

- Pros: Dynamic styles, colocated, TypeScript support
- Cons: Runtime overhead, SSR complexity
- Best for: Highly dynamic UIs, React-heavy apps

## Quality Checks

- [ ] No global CSS leaks
- [ ] Specificity is controlled
- [ ] Unused styles are purged
- [ ] Critical CSS is inlined
- [ ] Bundle size is monitored

## Safety Rules

- Never use `!important` as a default
- Avoid deeply nested selectors (max 3 levels)
- Don't mix multiple styling approaches in one component

## Coordinates With

- `frontend-scaffold-builder` — initial setup
- `design-system-enforcer` — token implementation
- `performance-audit-optimizer` — CSS performance
