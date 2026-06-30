---
name: visual-regression-reviewer
description: Use when checking for visual changes, CSS regressions, layout shifts, or unintended UI changes after code modifications. Triggers on requests like "visual regression", "layout broke", "CSS issue", "UI changed", "check the design", "pixels don't match", "styling regression", or after refactoring that might affect visual output. Provides systematic visual comparison approaches.
---

# Visual Regression Reviewer

## Goal
Detect and fix unintended visual changes introduced by code modifications.

## Do Not Use When
- Visual change is intentional
- The issue is functional, not visual

## Required Inputs To Inspect
- Before/after screenshots
- Browser and viewport
- Recent CSS/HTML changes
- Component isolation

## Workflow

1. **Capture baseline**: Screenshot of known good state
2. **Capture current**: Screenshot after changes
3. **Compare**: Pixel diff or visual inspection
4. **Isolate**: Comment out changes to identify culprit
5. **Fix**: Restore intended styling
6. **Verify**: Compare again

## Tools
- Chromatic (Storybook)
- Playwright screenshots
- Percy
- Manual DevTools inspection

## Common Regressions

| Change | Risk |
|--------|------|
| Global CSS | Breaks unrelated components |
| Dependency update | Component styling changes |
| Refactoring | Removes needed classes |
| Responsive changes | Breaks other breakpoints |

## Quality Checks
- [ ] Visual differences identified
- [ ] Root cause CSS/HTML found
- [ ] Fix restores intended appearance
- [ ] No new regressions introduced

## Coordinates With
- `component-system-builder` — for component isolation
- `css-styling-architecture` — for CSS changes
