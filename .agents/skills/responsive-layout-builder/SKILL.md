---
name: responsive-layout-builder
description: Use when building responsive layouts, implementing mobile-first designs, creating adaptive page structures, or fixing layout issues across screen sizes. Triggers on requests like "make this responsive", "mobile layout", "responsive grid", "breakpoint setup", "adapt for tablets", or when implementing any page layout that must work across devices. Framework-aware for Tailwind, CSS Grid, Flexbox, and component-library responsive systems.
---

# Responsive Layout Builder

## Goal
Build layouts that adapt gracefully from mobile to desktop with consistent spacing and readable content at every breakpoint.

## Do Not Use When
- The design is desktop-only (internal tools, dashboards)
- Layout is already responsive and working
- The task is purely visual design (colors, typography)

## Required Inputs To Inspect
- Design mockups or wireframes for each breakpoint
- Breakpoint strategy (mobile-first vs desktop-first)
- Content priority order on small screens
- Touch vs mouse interaction requirements
- Performance budget for responsive images

## Workflow

1. **Define breakpoints**: Default — sm:640px, md:768px, lg:1024px, xl:1280px, 2xl:1536px
2. **Mobile-first approach**: Base styles for mobile, enhancements for larger screens
3. **Build the grid**: Use CSS Grid for 2D layouts, Flexbox for 1D
4. **Handle navigation**: Hamburger menu below md, horizontal nav above
5. **Manage images**: Responsive srcset, lazy loading, WebP format
6. **Test typography**: Readable sizes at every breakpoint (min 16px on mobile)
7. **Touch targets**: Minimum 44x44px for buttons and links
8. **Content reordering**: Use order utilities or grid placement
9. **Hide/show content**: `hidden md:block` for breakpoint-specific content
10. **Test in dev tools**: Chrome DevTools device simulation

## Output Format

Layouts implemented as framework-appropriate components with responsive classes.

## Quality Checks
- [ ] Works at 320px (smallest phone) without horizontal scroll
- [ ] Navigation is usable on touch devices
- [ ] Images load appropriate sizes
- [ ] Text is readable without zooming
- [ ] Tap targets are >= 44px
- [ ] No content is lost on small screens

## Safety Rules
- Never use fixed widths for main content containers
- Never disable zoom with `user-scalable=no`
- Test on real devices, not just DevTools simulation

## Coordinates With
- `frontend-scaffold-builder` — for Tailwind/breakpoint config
- `component-system-builder` — for responsive components
- `browser-compatibility-checker` — for cross-device testing
