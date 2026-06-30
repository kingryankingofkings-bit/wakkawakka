---
name: accessibility-builder
description: Use when building or auditing accessible websites, implementing WCAG compliance, adding ARIA attributes, ensuring keyboard navigation, or making websites usable for people with disabilities. Triggers on requests like "make this accessible", "ARIA attributes", "keyboard navigation", "screen reader support", "WCAG compliance", "a11y audit", or when building components that need assistive technology support. Produces accessible markup with proper semantic HTML, ARIA labels, focus management, and keyboard support.
---

# Accessibility Builder

## Goal
Build websites that work for everyone, including users with visual, motor, auditory, and cognitive disabilities.

## Do Not Use When
- The task has no UI component (pure API/backend work)
- Accessibility audit is what's needed (use `accessibility-audit-reviewer`)

## Required Inputs To Inspect
- Target WCAG level (A, AA, AAA)
- Component designs and interactions
- Color contrast requirements
- Keyboard navigation requirements
- Screen reader testing environment

## Workflow

1. **Semantic HTML**: Use correct elements (nav, main, article, button vs div)
2. **Heading hierarchy**: H1 → H2 → H3, no skips
3. **Alt text**: Descriptive for informative images, empty for decorative
4. **ARIA attributes**: Only when HTML semantics are insufficient
5. **Keyboard navigation**: All interactive elements reachable via Tab
6. **Focus indicators**: Visible focus rings on all interactive elements
7. **Color contrast**: 4.5:1 for normal text, 3:1 for large text (WCAG AA)
8. **Form labels**: Every input has an associated label
9. **Error identification**: Clear error messages linked to fields
10. **Skip links**: "Skip to content" link at page top
11. **Language attribute**: `<html lang="en">` set correctly
12. **Touch targets**: Minimum 44x44px on mobile

## Quick Reference

```html
<!-- Good: Semantic + accessible -->
<button type="button" aria-expanded="false" aria-controls="menu">
  Open Menu
</button>
<nav aria-label="Main">
  <ul><li><a href="/">Home</a></li></ul>
</nav>
<main id="content" tabindex="-1">
  <h1>Page Title</h1>
  <img src="photo.jpg" alt="Golden retriever playing fetch">
</main>

<!-- Bad: Inaccessible -->
<div class="btn" onclick="...">Click</div>
<img src="photo.jpg">
```

## Quality Checks
- [ ] All images have alt text
- [ ] All interactive elements are keyboard accessible
- [ ] Focus order is logical
- [ ] Color contrast meets WCAG AA
- [ ] Forms have labels
- [ ] ARIA attributes are valid
- [ ] Screen reader announces dynamic content

## Safety Rules
- Never remove focus indicators
- Never use color alone to convey information
- Never rely solely on ARIA — use semantic HTML first
- Test with actual keyboard navigation, not just mouse

## Coordinates With
- `component-system-builder` — accessible components
- `design-system-enforcer` — contrast requirements
- `forms-validation-builder` — accessible forms
- `accessibility-audit-reviewer` — for audits
