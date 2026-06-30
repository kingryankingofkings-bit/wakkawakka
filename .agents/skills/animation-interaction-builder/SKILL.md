---
name: animation-interaction-builder
description: Use when implementing animations, transitions, micro-interactions, scroll effects, page transitions, or motion design in websites. Triggers on requests like "add animation", "page transitions", "scroll effects", "hover effects", "micro-interactions", "framer motion", "GSAP", "loading animations", "parallax", or when enhancing UI with motion. Produces performant animations using CSS transitions, CSS animations, or animation libraries. Prefers CSS-first, respects prefers-reduced-motion.
---

# Animation and Interaction Builder

## Goal
Add meaningful, performant motion that enhances UX without hindering accessibility or performance.

## Do Not Use When
- The design specifies no animation
- Performance is critical and animation adds overhead
- The task is purely functional with no visual enhancement needed

## Required Inputs To Inspect
- Design specifications for motion
- Target devices and performance constraints
- Accessibility requirements (reduced-motion)
- Animation library preferences

## Workflow

1. **Prefer CSS for simple**: transitions, keyframes for simple effects
2. **Use libraries for complex**: Framer Motion (React), GSAP (universal), Vue transitions
3. **Animate performant properties**: transform, opacity only (avoid layout triggers)
4. **Respect reduced-motion**: Wrap in `prefers-reduced-motion` check
5. **Keep it purposeful**: Every animation guides attention or provides feedback
6. **Use easing**: Custom cubic-bezier over default ease
7. **Limit duration**: 200-400ms for micro-interactions, 500-800ms for page transitions
8. **Test performance**: Chrome DevTools Performance panel
9. **Avoid animating**: width, height, top, left, margin, padding (causes reflow)

## Performance Rules

```css
/* Good: GPU-accelerated */
.animated {
  transform: translateX(0);
  opacity: 0;
  will-change: transform, opacity;
}

/* Bad: Causes reflow */
.animated {
  left: 0;
  width: 100px;
}
```

## Quality Checks
- [ ] Animations are smooth (60fps)
- [ ] `prefers-reduced-motion` is respected
- [ ] No layout thrashing
- [ ] Animations enhance, don't distract
- [ ] Loading states are animated

## Safety Rules
- Never auto-play animations that can't be paused
- Don't block interaction during animations
- Test on low-end devices

## Coordinates With
- `component-system-builder` — for component animations
- `performance-audit-optimizer` — for animation performance
- `accessibility-builder` — for reduced-motion support
