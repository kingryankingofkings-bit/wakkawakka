# Handoff Report: Batch 10 (Camera & AR, Snapchat/BeReal-style) Codebase Investigation

## 1. Observation
We conducted a comprehensive search and analysis of the `wakkawakka-local` codebase, focusing on database models (`prisma/schema.prisma`), routes (`src/app/api`), and components (`src/components` & `src/app/(main)`). The key observations are detailed below:

### A. Streaks Tracking
* **Code Location**: `prisma/schema.prisma` (lines 900-913):
  ```prisma
  model Streak {
    id              String   @id @default(cuid())
    userId          String   @unique
    user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
    currentStreak   Int      @default(0)
    longestStreak   Int      @default(0)
    lastActivityAt  DateTime @default(now())
    totalDaysActive Int      @default(0)
    weeklyGoal      Int      @default(7)
    createdAt       DateTime @default(now())
    updatedAt       DateTime @updatedAt

    @@index([userId])
  }
  ```
* **Code Location**: `src/types/index.ts` (lines 54):
  ```typescript
  streakDays: number;
  ```
* **Code Location**: `src/app/api/posts/route.ts` (line 135) and other post endpoints return a hardcoded `streakDays: 0` for all post authors.
* **Friendships**: `model Friendship` in `prisma/schema.prisma` (lines 1100-1112) contains only `id`, `userAId`, `userBId`, and `createdAt`.

### B. Ephemeral Posts & Disappearing Content
* **Code Location**: `prisma/schema.prisma` (lines 452-472 & 474-485):
  * Models `Story` and `StoryView` exist. `Story` stores `mediaUrl`, `type`, `caption`, `expiresAt`, `isActive`, and has a relations to `StoryView` which tracks viewers.
* **Code Location**: `prisma/schema.prisma` (lines 221-222):
  * `Post` model contains `isEphemeral` and `expiresAt` fields.
* **Code Location**: `src/app/api/stories/route.ts` and `src/components/feed/StoriesRow.tsx` / `StoryViewer.tsx`:
  * Stories are created via `POST /api/stories` with a 24-hour expiration (`expiresAt = Date.now() + 24h`).
  * Stories are fetched via `GET /api/stories` filtering active stories that haven't expired: `expiresAt: { gt: new Date() }`.
  * Views are marked via `POST /api/stories/[id]/view` writing to `StoryView`.
* **Direct Messages**: `Message` model in `prisma/schema.prisma` (lines 386-411) does not contain expiration or view-once fields.

### C. BeReal Behind The Scenes (BTS)
* **Code Location**: `prisma/schema.prisma` (lines 224-225):
  * `Post` model contains `btsUrl` and `greenScreenBg` string columns.
* **Code Location**: `src/components/feed/CreatePostModal.tsx` (lines 570-583):
  * Toggles a hardcoded simulated video URL for Behind-the-Scenes:
  ```typescript
  setBtsUrl(btsUrl ? null : "https://www.w3schools.com/html/mov_bbb.mp4")
  ```
* **Code Location**: `src/components/feed/PostCard.tsx` (lines 452-459 & 951-979):
  * Renders a `BTS PLAYBACK` button which opens a modal playing the video specified in `post.btsUrl`.

### D. Map, AR Lenses, Geofilters, and Memory Vault
* **Location/Map**: Basic profile location string is present (`User.location`), but no map components or real-time geolocation tables exist.
* **AR Lenses**: The codebase lacks Three.js, WebGL, or DeepAR/Banuba integrations. No camera filter components exist besides a text `filter` field on the `Story` model.
* **Geofilters**: No geolocation-aware overlays or models.
* **Memory Vault**: The "On This Day" memories page in `src/app/(main)/memories/page.tsx` and API in `src/app/api/memories/route.ts` query regular posts matching the current month/day in past years. A dedicated private "Vault" to save stories is missing.

---

## 2. Logic Chain
1. Based on the presence of the `Streak` model in `schema.prisma` with `userId String @unique`, we infer that streaks are currently structured for **single-user daily activity gamification** rather than **friend-to-friend engagement tracking**.
2. Because `Friendship` doesn't record interaction metrics (like streak count or last interaction date) and no other friendship-streak tables exist, we conclude that **Snapchat-style friend streaks are entirely missing**.
3. Because the `Story` model has `expiresAt` and `StoryView` exists, and the API queries check `expiresAt: { gt: new Date() }`, we conclude that **24-hour ephemeral posts (stories) are fully implemented**.
4. Since the `Message` model contains only basic metadata and lacks expiration attributes, **expiring and view-once direct messages are missing**.
5. The presence of `btsUrl` and `greenScreenBg` on the `Post` model, coupled with `CreatePostModal`'s attachment option and `PostCard`'s modal player, proves that **BeReal-style simultaneous uploads have frontend/backend plumbing but rely on mock data** and lack real dual-camera camera capture mechanics.
6. The absence of geographic coordinate models, mapping page/components, WebGL filter logic, and dedicated private media vault models confirms that **Snap Map, AR Lenses, Geofilters, and Memory Vault (aside from the basic "On This Day" dashboard) are currently missing**.

---

## 3. Caveats
* We assumed that the frontend camera UI does not utilize any hidden WebRTC/canvas capture libraries for dual camera streams. The file search for camera components came up empty, indicating there is no custom camera dashboard.
* The investigation was strictly read-only; no code modifications were made.

---

## 4. Conclusion
While the foundational concepts of Stories (24h expiry) and BeReal BTS data storage are implemented, the primary Batch 10 mechanics (Friend Streaks, Snap Map, AR Filters, View-Once Messages, Geofilters, and dual-camera capture) are either missing or mock-only.

To complete Batch 10, we recommend implementing the following database additions and designs:

### Proposed Schema Additions (prisma/schema.prisma)
```prisma
// 1. Friend-to-Friend Streaks
model FriendStreak {
  id                String     @id @default(cuid())
  friendshipId      String     @unique
  friendship        Friendship @relation(fields: [friendshipId], references: [id], onDelete: Cascade)
  count             Int        @default(0)
  lastInteractionAt DateTime   @default(now())
  expiresAt         DateTime
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt

  @@index([expiresAt])
}

// 2. Ephemeral Chat Messages (View-Once/Disappearing)
// Modify Message model to include:
// isEphemeral      Boolean   @default(false)
// viewLimit        Int       @default(1)
// viewedCount      Int       @default(0)
// expiresAt        DateTime?

// 3. User Locations (Snap Map)
model UserLocation {
  id          String   @id @default(cuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  latitude    Float
  longitude   Float
  isSharing   Boolean  @default(true) // Ghost Mode
  updatedAt   DateTime @updatedAt

  @@index([latitude, longitude])
}

// 4. AR Lenses
model ARLens {
  id          String   @id @default(cuid())
  name        String
  iconUrl     String
  assetUrl    String   // Path to filter file
  category    String
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
}

// 5. Geofilters
model Geofilter {
  id          String   @id @default(cuid())
  name        String
  overlayUrl  String
  minLat      Float
  maxLat      Float
  minLng      Float
  maxLng      Float
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
}

// 6. Memory Vault (Private Saved Stories/Media)
model SavedMemory {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  mediaUrl  String
  type      String   // IMAGE, VIDEO
  caption   String?
  latitude  Float?
  longitude Float?
  createdAt DateTime @default(now())

  @@index([userId])
}
```

### Backend Design Recommendations
1. **Streaks**: Create a webhook or middleware hook triggered when users exchange direct messages or stories. When User A messages User B, lookup `FriendStreak` for their friendship:
   * If `expiresAt` is in the future and `lastInteractionAt` is older than 24h, increment `count` and extend `expiresAt` by 24h.
   * If `expiresAt` is in the past, reset `count` to 1.
   * Run a daily cron job to expire streaks (setting count to 0) if `expiresAt < now`.
2. **Ephemeral Direct Messages**: Update `GET /api/messages/conversations/[id]/messages` to exclude ephemeral messages that have been viewed (where `viewedCount >= viewLimit`). Write a background worker to hard-delete viewed and expired messages.
3. **Snap Map**: Expose `POST /api/location` for telemetry tracking (updating `UserLocation`) and `GET /api/location/friends` to retrieve coordinates for the Map UI.
4. **BeReal Dual Camera**: Update the file upload API to handle dual upload fields (`media` and `btsMedia`).

---

## 5. Verification Method
1. Inspect the Prisma schema at `prisma/schema.prisma` lines 900-913 to confirm the structure of the existing `Streak` model.
2. Run database validation via command:
   ```powershell
   npx prisma validate
   ```
3. Inspect `src/components/feed/CreatePostModal.tsx` lines 570-583 and `src/components/feed/PostCard.tsx` lines 452-459 to verify the current mock implementation of Behind-the-Scenes.
