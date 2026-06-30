---
name: browser-compatibility-checker
description: Use when testing websites across browsers and devices, fixing cross-browser issues, or ensuring compatibility with target browser versions. Triggers on requests like "test in Safari", "cross-browser", "IE support", "browser compatibility", "mobile browser issues", "iOS fixes", "Firefox problem", or when users report issues on specific browsers. Provides debugging strategies and polyfill recommendations for CSS and JavaScript compatibility issues.
---

# Browser Compatibility Checker

## Goal
Ensure websites work correctly across target browsers, versions, and devices.

## Do Not Use When
- Only supporting a single controlled browser environment
- The issue is not browser-specific (universal bug)

## Required Inputs To Inspect
- Target browser matrix (Chrome, Firefox, Safari, Edge, mobile)
- Polyfill strategy
- Feature detection approach
- Build tool configuration for compatibility

## Workflow

1. **Define browser matrix**: Based on analytics and project requirements
2. **Test systematically**: Chrome, Firefox, Safari, Edge (latest + 1 back)
3. **Test mobile**: iOS Safari, Chrome Android
4. **Check CSS compatibility**: Flexbox, Grid, custom properties, container queries
5. **Check JS compatibility**: Optional chaining, nullish coalescing, BigInt
6. **Check APIs**: Fetch, Intersection Observer, Resize Observer
7. **Use autoprefixer**: For CSS vendor prefixes
8. **Use core-js**: Polyfill via `core-js` and `regenerator-runtime`
9. **Feature detection**: Use `typeof` checks, not browser sniffing
10. **Test responsive**: Different viewports, orientations

## Common Issues and Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Flexbox gap missing | Old Safari | Use margin fallback |
| Scrollbar styling | Non-standard | `::-webkit-scrollbar` + `scrollbar-width` |
| Date parsing | Safari strictness | Use `date-fns` or explicit parsing |
| 100vh mobile | iOS URL bar | Use `dvh` units or `-webkit-fill-available` |

## Quality Checks
- [ ] Tested on all target browsers
- [ ] Mobile browsers tested
- [ ] No console errors on any browser
- [ ] Visual parity within acceptable range
- [ ] Touch interactions work on mobile

## Safety Rules
- Use feature detection, not browser sniffing
- Progressive enhancement over graceful degradation
- Don't exclude users on older browsers unless necessary

## Coordinates With
- `frontend-scaffold-builder` — for build tool config
- `bug-reproduction-debugger` — for specific browser bugs
- `performance-audit-optimizer` — for mobile performance
