---
name: component-system-builder
description: Use when creating reusable UI component systems, building component libraries, establishing component patterns, or refactoring repeated UI into shared components. Triggers on requests like "create components", "build a component library", "reusable UI parts", "component structure", or when the same UI pattern appears more than twice in a design. Produces a well-organized component hierarchy with clear composition patterns and prop interfaces.
---

# Component System Builder

## Goal

Create organized, reusable component systems with clear composition patterns and consistent APIs.

## Do Not Use When

- Building one-off pages with no repeated patterns
- The project uses an external component library exclusively
- Components are already well-organized

## Required Inputs To Inspect

- Design system or style guide
- Page mockups showing repeated patterns
- Framework (React, Vue, Svelte, etc.)
- Existing component structure (if any)

## Workflow

1. **Inventory repeated patterns**: Identify buttons, cards, inputs, modals that repeat
2. **Categorize components**:
   - `ui/`: Primitive components (Button, Input, Badge)
   - `layout/`: Structural (Header, Footer, Sidebar, Container)
   - `composite/`: Composed of primitives (SearchBar, UserCard)
   - `features/`: Domain-specific (ProductCard, CheckoutForm)
3. **Define component API**: Props interface with TypeScript
4. **Implement composition**: Use children/slots pattern over props for content
5. **Add variants**: Style variants via props (size, color, variant)
6. **Document usage**: Include usage examples in comments or Storybook
7. **Test isolation**: Components work standalone

## Output Format

```
components/
├── ui/
│   ├── Button.tsx        # Primitive
│   ├── Input.tsx
│   ├── Card.tsx
│   └── Badge.tsx
├── layout/
│   ├── Header.tsx
│   ├── Footer.tsx
│   └── Container.tsx
├── composite/
│   ├── SearchBar.tsx     # Input + Button
│   └── UserCard.tsx      # Card + Avatar + Text
└── features/
    ├── ProductCard.tsx
    └── CheckoutForm.tsx
```

## Quality Checks

- [ ] Each component has a single responsibility
- [ ] Props are typed with TypeScript
- [ ] Components are composable (accept children/slots)
- [ ] Variants are documented
- [ ] No prop drilling (use context or composition)
- [ ] Accessibility attributes included

## Safety Rules

- Keep primitives simple — no business logic in UI components
- Avoid deeply nested component trees
- Name components by what they are, not where they are used

## Coordinates With

- `design-system-enforcer` — for style consistency
- `accessibility-builder` — for a11y attributes
- `frontend-scaffold-builder` — for folder setup
