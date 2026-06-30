# Scope: Batch 10 (Camera & AR, Snapchat/BeReal-style)

## Architecture & Requirements
We are implementing a camera-first mobile experience with AR filters, Snap Map location sharing, disappearing messages, dual camera capture (BeReal-style), streaks, and geofilters.

### 1. Prisma Schema updates (SQLite compatible)
Add the following models:
- **`UserLocation`**: userId (unique), latitude (Float), longitude (Float), shareLocation (Boolean, default true), updatedAt (DateTime). Enables location mapping.
- **`DisappearingMedia`**: senderId, receiverId, mediaUrl, type (IMAGE | VIDEO, default IMAGE), isViewed (Boolean, default false), viewedAt (DateTime), expiresAt (DateTime), createdAt. Handles view-once direct messages.
- **`FriendStreak`**: friendshipId (unique), count (Int, default 0), lastInteractionAt (DateTime), expiresAt (DateTime), createdAt, updatedAt. Tracks Snapchat-style friend streaks.
- **`ARLens`**: name, iconUrl, assetUrl, category, isActive (Boolean, default true), createdAt. Tracks available camera lenses.
- **`Geofilter`**: name, overlayUrl, minLat, maxLat, minLng, maxLng, isActive (Boolean, default true), createdAt. Location-bound image overlays.
- **`SavedMemory`**: userId, mediaUrl, type, caption, latitude (Float), longitude (Float), createdAt. Private story/media vault.

### 2. API Routes
- `/api/streaks/activity` (POST): Record user interaction to update friend/user streak. Check last activity bounds.
- `/api/streaks/status` (GET): Retrieve current streak metrics.
- `/api/streaks/friends` (GET): Retrieve friends' streak leaderboard.
- `/api/media/disappearing` (POST): Create a new disappearing (view-once) media message.
- `/api/media/disappearing/[id]` (GET): Retreive single disappearing media message. Transition status to viewed, return `410 Gone` on subsequent views.
- `/api/media/disappearing/[id]/view` (POST): Explicitly finalize viewing, clearing content.
- `/api/location/update` (POST): Update latitude and longitude coordinates. Validate coordinate ranges (-90 to 90 lat, -180 to 180 lng).
- `/api/location/friends` (GET): Retrieve locations of friends. Exclude blocked users, check sharing permissions (Ghost Mode), and filter out coordinates older than 24 hours.
- `/api/posts/bereal` (POST): Publish a dual-media post (main image + BTS secondary image) expiring in 24 hours (`isEphemeral = true`).
- `/api/posts/bereal/feed` (GET): Fetch friends' BeReal posts. Lock/blur content if the querying user hasn't posted their own BeReal in the last 24 hours.

### 3. Frontend Routes & Components
- `/camera` (Mobile-Only Gate):
  - Gated using a Hybrid User-Agent parser (server-side) and viewport listener (`< 768px` client-side).
  - Desktop View: Glassmorphic fallback panel presenting an SVG QR code linking to `/camera`, link copy action, and mock App Store badges.
  - Mobile View: Extends `isFullWidthWorkspace` to remove `pb-16` padding and hides the bottom `MobileNav`. Full screen camera capture layout with:
    - Normal (Stories/Posts), BeReal (Simultaneous capture), and Disappearing (View-once message) modes.
    - Dual Camera: Renders a primary camera view and a PIP secondary view.
    - AR Lens Selector: Renders filters (Dog Ears, Smooth Skin, Neon Glow) applying overlay effects.
    - Geofilter Overlay: Displays active geofilter overlay based on user's coordinate.
- `/map`: Interactively display friends' locations utilizing a leaflet/custom canvas plotting canvas.
- `/memories`: Private vault dashboard to view saved stories/media filterable by date and location.

### 4. Integration Inventory Update
- The worker must update `integration_inventory.md` at the project root to record the completion of Batch 9.

## Execution Rules
- NEVER write, modify, or create source code files directly.
- NEVER run build/test commands yourself — require workers to do so.
- Verify everything via builds, lints, and E2E test runs.
