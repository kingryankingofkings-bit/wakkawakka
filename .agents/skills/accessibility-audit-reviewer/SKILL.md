---
name: accessibility-audit-reviewer
description: Use when auditing websites for accessibility compliance, checking WCAG conformance, testing with screen readers, or identifying accessibility barriers. Triggers on requests like "accessibility audit", "a11y review", "WCAG check", "screen reader test", "keyboard navigation check", "color contrast check", or when evaluating whether a site is usable by people with disabilities. Provides automated and manual testing checklists.
---

# Accessibility Audit Reviewer

## Goal

Audit websites for WCAG compliance and identify accessibility barriers.

## Do Not Use When

- Building accessible components (use `accessibility-builder`)
- The site is known to be accessible

## Required Inputs To Inspect

- Target WCAG level (A, AA, AAA)
- Page URLs to audit
- Component library used
- Test environment

## Automated Checks

Run these tools first:

1. **axe DevTools**: Browser extension
2. **Lighthouse**: Accessibility score
3. **WAVE**: Web accessibility evaluator
4. **pa11y**: CLI accessibility checker

## Manual Checklist

### Keyboard

- [ ] All interactive elements reachable with Tab
- [ ] Focus order is logical
- [ ] Focus indicators visible
- [ ] No keyboard traps

### Screen Reader

- [ ] Headings navigate correctly (H1-H6)
- [ ] Images have alt text
- [ ] Form labels associated
- [ ] Dynamic content announced
- [ ] Skip link works

### Visual

- [ ] Color contrast 4.5:1 minimum (text)
- [ ] Information not conveyed by color alone
- [ ] Text resizes without breaking layout
- [ ] Content readable at 200% zoom

## Severity Labels

| Severity | Example                                |
| -------- | -------------------------------------- |
| Critical | Form unusable without mouse            |
| High     | Missing alt text on informative images |
| Medium   | Low contrast on secondary text         |
| Low      | Focus indicator could be more visible  |

## Coordinates With

- `accessibility-builder` — for building accessible components
- `design-system-enforcer` — for contrast requirements
