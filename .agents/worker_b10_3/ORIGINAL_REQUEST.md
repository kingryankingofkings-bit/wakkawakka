## 2026-06-30T20:04:07Z
You are worker_b10_3. Your task is to implement the frontend pages, components, and Zustand store updates for Batch 10 (Camera & AR, Snapchat/BeReal-style) in C:\Users\Kingr\OneDrive\Documents\wakkawakka-local.
Your working directory is: C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\.agents\worker_b10_3

Please implement the following updates:
1. Zustand Stores:
   - Create `src/store/cameraStore.ts` with states for active lens, available lenses (Dog Ears, Smooth Skin, Neon Glow), camera mode (NORMAL, BE_REAL, DISAPPEARING), and captured media urls.
   - Update `src/store/feedStore.ts` to include BeReal feed lock/unlock states and actions.
   - Update `src/store/messageStore.ts` for disappearing media actions.
   - Update `src/store/uiStore.ts` (or mapStore) for user location mapping.
   - Update `src/store/authStore.ts` for user streaks data.
2. Sidebar Navigation (`src/components/layout/Sidebar.tsx`):
   - Add links to `/camera` ("Camera"), `/map` ("Snap Map"), and `/memories` ("Memories") dashboards.
3. Mobile Viewport detection:
   - Implement `src/hooks/useMediaQuery.ts` to listen for screen width change (target boundary `max-width: 767px`).
4. Camera Pages & Components:
   - Create `/camera` page in `src/app/(main)/camera/page.tsx` and layout in `layout.tsx`.
     - Layout: Extends `isFullWidthWorkspace` to remove `pb-16` padding and hides `MobileNav` on mobile viewports.
     - Page: Server-side User-Agent check regex. If desktop, render `<DesktopFallback />`. If mobile, render `<CameraGateway />`.
     - `src/components/camera/DesktopFallback.tsx`: Glassmorphic fallback panel presenting an SVG QR code linking to `/camera`, quick copy link, and App Store badges.
     - `src/components/camera/CameraGateway.tsx`: Client gateway using `useMediaQuery` for resize gating and lazy loading `<CameraCapture />` via `next/dynamic` with `ssr: false`.
     - `src/components/camera/CameraCapture.tsx`: Renders full-screen camera feed, front/rear camera toggle, PIP dual camera capture container, AR lens selector carousel, geofilter overlay, and mode toggles. Capture action should write posts/stories/messages depending on the mode.
5. Snap Map page (`src/app/(main)/map/page.tsx`):
   - Render a mock visual map display plotting friends' location coordinates and their user avatars.
6. Memories Vault page (`src/app/(main)/memories/page.tsx`):
   - Extend the page to display user's saved stories and memories, filterable by date and geofilter tags.

Verify all changes compile successfully by running `npm run type-check`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Document all changes made in handoff.md in your working directory and notify the parent orchestrator (conversation ID: 5152cc68-a190-4c02-a3db-e86cc4efc787) when complete.
