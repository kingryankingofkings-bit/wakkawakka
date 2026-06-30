# Handoff Report: Batch 10 (Camera & AR) Mobile-Only Viewport Gating Analysis

This report outlines the mobile-only viewport gating analysis, existing layout dependencies, and a proposed frontend component structure for implementing Batch 10 Camera and AR features.

---

## 1. Observation

### Existing Layout Configurations & Breakpoints
In `src/app/(main)/layout.tsx`, the layout is structured for desktop vs mobile as follows:
- **Sidebar & Shell**: The desktop sidebar is visible from the `md` (768px) breakpoint and up.
  ```tsx
  {/* Desktop sidebar */}
  <div className="hidden md:block">
    <Sidebar />
  </div>
  ```
- **Padding & Content Max Width**: The main content wrapper applies left padding `md:pl-64` on desktop and uses `pb-16` on mobile to make room for the bottom navigation bar.
  ```tsx
  <div
    className={cn(
      "md:pl-64 flex min-h-screen",
      isFullWidthWorkspace && "md:pl-64",
    )}
  >
    <main
      className={cn(
        "flex-1 w-full py-0 pb-16 md:pb-0",
        isFullWidthWorkspace
          ? "max-w-none px-0"
          : "max-w-2xl mx-auto px-0 sm:px-4",
      )}
    >
      {children}
    </main>
  ```
- **Workspace Classifications**: The full-width layouts are determined by checking path sub-directories.
  ```tsx
  const isFullWidthWorkspace = pathname ? (pathname.startsWith("/servers") || pathname.startsWith("/reddit")) : false;
  ```
- **Mobile Bottom Navigation**: Rendered conditionally based on the workspace width classification.
  ```tsx
  {/* Mobile bottom nav */}
  {!isFullWidthWorkspace && <MobileNav />}
  ```

In `tailwind.config.js`, screen breakpoints are defined in lines 23-29 and extended in lines 265-268:
```javascript
screens: {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1400px",
},
// ... extended under theme:
screens: {
  xs: "480px",
  "3xl": "1920px",
}
```

### Missing Features & Routes
- Currently, there are no camera or AR-specific routes (such as `/camera` or `/ar`) or component directories (such as `src/components/camera`) inside the project workspace. 

---

## 2. Logic Chain

From the observations above, we establish the following logic:

1. **Defining "Mobile" Breakpoint**:
   - The desktop sidebar is displayed for viewports `>= 768px` (`md`). Below `768px`, the application relies on `MobileNav`. Therefore, the mobile-only viewport boundary should be defined as `< 768px` (`max-width: 767px`).

2. **Main Layout Adaptations**:
   - When a user navigates to `/camera` on mobile, the layout should fill the entire screen (`100dvh` / `100vh`) to display the camera feed and overlays without UI clipping.
   - Currently, `src/app/(main)/layout.tsx` applies `pb-16` on mobile to accommodate `MobileNav`. This would create an empty gap at the bottom of the camera screen on mobile.
   - Additionally, we need to hide the bottom `MobileNav` during the camera capture experience to maximize vertical screen area and mimic native camera application styling.
   - **Adjustment**: We must extend `isFullWidthWorkspace` in `src/app/(main)/layout.tsx` to include `/camera`:
     ```typescript
     const isFullWidthWorkspace = pathname 
       ? (pathname.startsWith("/servers") || pathname.startsWith("/reddit") || pathname.startsWith("/camera")) 
       : false;
     ```
     To fix the bottom padding issue, we should dynamically adjust the padding based on the workspace type:
     ```tsx
     <main
       className={cn(
         "flex-1 w-full py-0",
         isFullWidthWorkspace ? "pb-0 md:pb-0" : "pb-16 md:pb-0",
         isFullWidthWorkspace
           ? "max-w-none px-0"
           : "max-w-2xl mx-auto px-0 sm:px-4",
       )}
     >
     ```

3. **Comparison of Viewport Gating Strategies**:
   - **CSS Gating (`block md:hidden`)**: Shows/hides components via media queries.
     *Result*: Heavy client-side camera assets, Three.js/WebGL frameworks, and TensorFlow/MediaPipe models are compiled and executed on desktop anyway, even if the DOM nodes are hidden (`display: none`). Camera permissions (`navigator.mediaDevices.getUserMedia`) would still be requested on desktop. This is poor UX and bad for performance.
   - **Client-Side JS Hook Gating (`useMediaQuery`)**: Conditionally renders components after mount.
     *Result*: Prevents desktop execution of AR libraries. However, it triggers Next.js hydration warnings ("Text content did not match server-rendered HTML") unless delayed using a `mounted` state, which results in a layout flash on initial mobile page load.
   - **Server-Side User-Agent Detection**: Inspects the request header in the Server Page Component.
     *Result*: Renders the correct layout immediately (no hydration flashing or client-side overhead on desktop). However, it is not responsive to desktop window resizing (e.g. testing in browser responsive developer tools).
   - **Conclusion (Hybrid Multi-Layer Strategy)**:
     - Use a **Server-Side User-Agent check** as the first barrier: If the User-Agent is desktop, immediately render `<DesktopFallback />` (saving resources).
     - For mobile User-Agents, render a **Client Gateway** wrapper. Inside the gateway, use a client-side `useMediaQuery` listener to handle real-time screen resizing, and lazy-load the heavy `<CameraCapture />` component using Next.js `next/dynamic` with `ssr: false` to ensure client libraries only load when mobile viewport conditions are fully met.

---

## 3. Caveats

- **Tablet Viewports**: Medium-sized devices like iPads may have a User-Agent that falls in a grey area. The media query (`max-width: 767px`) will gate them as "Desktop" viewports (showing the fallback), which is desirable since the AR lenses and face tracking features are optimized for portrait-oriented handheld devices.
- **User-Agent Spoofing**: Users who manually override their browser's User-Agent string on desktop to mimic mobile will bypass the server-side check. However, the client-side `useMediaQuery` will still gate the layout unless they also resize their screen to a mobile dimension. If they do both, they will see the camera capture, but it will fallback gracefully using standard browser WebAPI error handling if no camera hardware is available.

---

## 4. Conclusion & Proposed Architecture

We propose a robust frontend architecture and gating layout design for the Batch 10 Camera & AR feature.

### Route and Component Structure
```
src/
├── app/
│   └── (main)/
│       └── camera/
│           ├── page.tsx               # Server Component: User-Agent gate
│           └── layout.tsx             # Optional: camera-specific layout wrapper
├── components/
│   └── camera/
│       ├── CameraGateway.tsx          # Client Component: Responsive viewport gate & dynamic loader
│       ├── CameraCapture.tsx          # Client Component: Main WebCam stream handler & UI overlay
│       ├── DesktopFallback.tsx        # Client Component: Glassmorphic QR & App Promo redirect
│       ├── LensSelector.tsx           # Client Component: Scrollable AR Lens list
│       ├── DualCamera.tsx             # Client Component: Double lens layout utility
│       ├── GeofilterOverlay.tsx       # Client Component: Location-based canvas overlay
│       └── CameraSkeleton.tsx         # Client Component: Shimmer loading state
└── hooks/
    ├── useMediaQuery.ts               # Hook: Viewport width media-query listener
    ├── useCamera.ts                   # Hook: Handles WebRTC stream, device toggle (front/rear), and capture
    └── useARFilters.ts                # Hook: Manages face mesh tracking models & filters
```

### Proposed Gating Implementation Details

#### 1. Page Entry with User-Agent Gating (`src/app/(main)/camera/page.tsx`)
```tsx
import { headers } from "next/headers";
import { DesktopFallback } from "@/components/camera/DesktopFallback";
import { CameraGateway } from "@/components/camera/CameraGateway";

export default function CameraPage() {
  const headersList = headers();
  const userAgent = headersList.get("user-agent") || "";
  
  // Basic Regex targeting common mobile browsers
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  
  if (!isMobileUA) {
    return <DesktopFallback />;
  }
  
  return <CameraGateway />;
}
```

#### 2. Client Viewport Gateway (`src/components/camera/CameraGateway.tsx`)
```tsx
"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { DesktopFallback } from "./DesktopFallback";
import { CameraSkeleton } from "./CameraSkeleton";

// Lazy load the heavy camera capture components to prevent desktop bundle bloat
const CameraCapture = dynamic(
  () => import("./CameraCapture").then((mod) => mod.CameraCapture),
  {
    ssr: false,
    loading: () => <CameraSkeleton />,
  }
);

export function CameraGateway() {
  const [mounted, setMounted] = useState(false);
  const isMobileViewport = useMediaQuery("(max-width: 767px)"); // Gating at 768px (md breakpoint)

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <CameraSkeleton />;
  }

  return isMobileViewport ? <CameraCapture /> : <DesktopFallback />;
}
```

#### 3. Client Media Query Hook (`src/hooks/useMediaQuery.ts`)
```typescript
import { useState, useEffect } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query, matches]);

  return matches;
}
```

#### 4. Desktop Fallback Screen (`src/components/camera/DesktopFallback.tsx`)
Displays a premium glassmorphic UI card inviting users to transition to mobile:
- **Visuals**: Centered layout using Tailwind `flex flex-col items-center justify-center min-h-[70vh] px-4`.
- **Card**: Box with glassmorphism styles (`bg-card/30 backdrop-blur-md border border-border/50 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center`).
- **QR Code & App Stores**:
  - Embedded SVG QR Code that points to the `/camera` mobile URL. Scanning immediately opens the page on mobile.
  - Quick action to copy the link to clipboard.
  - Buttons linking to App Store and Google Play Store.
- **Copy**:
  - Heading: `Available on Mobile` (using `text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent`).
  - Paragraph: `AR Lenses and Camera captures require specialized mobile sensors and cameras. Scan the QR code below or copy the link to open this experience on your mobile device.`

---

## 5. Verification Method

To verify the proposed viewport gating:

1. **Lint and Type Checking**:
   Run standard checks to verify there are no TypeScript or Next.js build compilation errors:
   ```bash
   npm run type-check
   npm run lint
   ```
2. **Testing Scenarios**:
   - **Desktop Browser (Standard)**: Accessing `/camera` on desktop should render the `DesktopFallback` component immediately with zero hydration warnings. The network panel should verify that no camera streams or heavy AR libraries are requested.
   - **Mobile Browser / Responsive Emulation**: Toggle the browser devtools to Mobile Emulation (e.g. iPhone 12 Pro) and refresh. The User-Agent triggers mobile mode, rendering `<CameraGateway />`, which boots the `CameraCapture` capture interface.
   - **Responsive Resizing**: Open the page in Mobile Emulation, then switch back to Desktop view size. The client-side `useMediaQuery` hook should instantly switch the interface to `DesktopFallback`.
