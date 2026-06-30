# BRIEFING — 2026-06-30T19:59:00Z

## Mission
Analyze the mobile-only design requirements and propose a viewport gating strategy for AR lenses and face filters.

## 🔒 My Identity
- Archetype: Teamwork explorer
- Roles: Read-only investigator
- Working directory: C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\.agents\explorer_b10_2
- Original parent: 5152cc68-a190-4c02-a3db-e86cc4efc787
- Milestone: Mobile-only viewport gating for AR/Camera

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Analyze mobile-only viewport gating for AR lenses and face filters
- Propose component structure and layout design

## Current Parent
- Conversation ID: 5152cc68-a190-4c02-a3db-e86cc4efc787
- Updated: 2026-06-30T19:59:00Z

## Investigation State
- **Explored paths**:
  - `src/app/(main)/layout.tsx` (main shell, sidebar/mobile-nav display logic)
  - `tailwind.config.js` (screen breakpoints and glassmorphism definitions)
  - `package.json` (next, react, and UI library dependencies)
- **Key findings**:
  - Desktop-only shell features (Sidebar, RightPanel) depend on the `md` breakpoint (768px). Mobile layouts hide sidebar and render MobileNav.
  - A mobile-only Camera/AR page requires bypassing MobileNav and bottom padding (`pb-16`) on mobile to allow the camera feed to fill `100dvh`.
  - Three gating methods (CSS Gating, Client-side Hooks, and Server-side UA detection) were analyzed. A Hybrid Multi-Layer Gating Strategy is recommended: Server-Side UA detection as the first line of defense, client-side window media checks for responsive resizing, and dynamic imports with `ssr: false` to prevent loading heavy AR libraries on desktop.
- **Unexplored areas**:
  - The integration of location sharing (Snap Map) and disappearing content, which may also require viewport or device-level constraints.

## Key Decisions Made
- Propose a `/camera` page layout structure that overrides `MainLayout` shell logic.
- Recommend using standard client-side lazy-loading (`next/dynamic` with `ssr: false`) combined with server-side UA check for gating.
- Propose a specific desktop fallback design using a glassmorphic card, copy-link CTA, and QR code mapping.

## Artifact Index
- C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\.agents\explorer_b10_2\handoff.md — Analysis and proposal report
