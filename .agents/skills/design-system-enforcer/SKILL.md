---
name: design-system-enforcer
description: Use when establishing or enforcing design consistency across a website — colors, typography, spacing, shadows, borders, and component styling. Triggers on requests like "set up the design system", "consistent styling", "brand colors", "typography scale", "spacing system", "create theme", or when styles are inconsistent across components. Produces a token-based design system with configuration files and documentation. Works with Tailwind, CSS variables, CSS-in-JS, and component library theming.
---

# Design System Enforcer

## Goal
Establish and enforce visual consistency through token-based design systems with configurable themes.

## Do Not Use When
- Using an external design system (Material, Chakra, etc.) exclusively
- The project is a quick prototype without design requirements
- Styles are already consistent and tokenized

## Required Inputs To Inspect
- Brand guidelines (colors, fonts, logo)
- Existing component styles
- Tailwind config or CSS variables
- Dark mode requirements
- Accessibility targets (WCAG level)

## Workflow

1. **Define color tokens**: Primary, secondary, accent, semantic (success, warning, error)
2. **Create color scale**: 50-950 scale for each color
3. **Define typography**: Font families, size scale, line heights, weights
4. **Define spacing scale**: Base unit (4px or 8px), scale multiples
5. **Define other tokens**: Shadows, radii, borders, z-index
6. **Configure Tailwind**: Extend theme in tailwind.config.js/ts
7. **Create CSS variables**: For runtime theming (dark mode)
8. **Document tokens**: Usage guidelines for each token

See `references/token-structure.md` for token naming conventions.

## Output Format

```javascript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a5f',
        },
        // ...
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        // Uses Tailwind defaults (0.5rem = 4px base)
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.375rem',
        lg: '0.5rem',
      },
    },
  },
}
```

## Quality Checks
- [ ] All colors meet WCAG AA contrast ratios
- [ ] Typography scale is harmonious (ratio-based)
- [ ] Spacing is consistent (base unit multiples)
- [ ] Dark mode tokens are defined
- [ ] No hardcoded values in components

## Safety Rules
- Never use hex/rgb values directly in components
- Always use semantic token names (not literal colors)
- Test contrast ratios before finalizing colors

## Coordinates With
- `component-system-builder` — component styling
- `responsive-layout-builder` — responsive spacing
- `accessibility-builder` — contrast requirements
