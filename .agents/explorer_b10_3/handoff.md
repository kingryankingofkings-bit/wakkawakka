# Handoff Report: Batch 10 (Camera & AR) Exploration

This report outlines the REST API endpoints, Zustand state stores, and E2E testing scenarios (Tiers 1-4) required to implement and verify Batch 10 (Camera & AR) features.

---

## 1. Observations

We explored the codebase and observed the following:
* **Prisma Schema (`prisma/schema.prisma`)**:
  * **Streak Support**: A `Streak` model is already defined at lines 900-913:
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
    And the `User` model (line 102) has `streak Streak?` relation.
  * **BeReal Support**: The `Post` model already has fields for Behind-The-Scenes (BTS) media and custom backgrounds at lines 224-225:
    ```prisma
    btsUrl          String?
    greenScreenBg   String?
    ```
  * **Missing Models**: There are no database tables or models for **Disappearing Media (view-once)** or **Coordinate-based Location Sharing** in the current schema. Proposing these additions is necessary for Batch 10.
* **Zustand State Stores (`src/store/`)**:
  * Currently contains stores like `authStore.ts`, `feedStore.ts`, `messageStore.ts`, `uiStore.ts`. There is no `cameraStore.ts` or coordinate location mapping in `uiStore.ts`.
* **Testing Setup (`tests/e2e_runner.js`)**:
  * Employs a custom, lightweight Node.js test runner using `assert` and `assertEq` helper functions.
  * Tier 4 tests spawn the Next.js API server using the `server.ts` entry point on dynamically assigned ports and send real HTTP requests (containing authentication headers like `x-user-id`) to verify database integrity and state propagation.

---

## 2. Logic Chain

1. **Streak System**: Because the database already has the `Streak` model, we can map streaks logic directly to these fields. Daily activity checks should evaluate `lastActivityAt`. If the difference between `now` and `lastActivityAt` is:
   * **< 24 hours**: Keep current streak (don't increment twice in one calendar/24-hour day).
   * **Between 24 and 48 hours**: Increment `currentStreak` by 1, and update `longestStreak` if `currentStreak > longestStreak`.
   * **> 48 hours**: Reset `currentStreak` to 1.
2. **Disappearing Media**: Since no view-once table exists, we propose a new `DisappearingMedia` database model. View-once messages should return `410 Gone` on any subsequent GET request once they are marked as viewed or expire.
3. **Location Sharing**: Location mapping requires latitude, longitude, and sharing visibility. We propose a `UserLocation` model or updating the `User` model with coordinate fields. Fetching friends' locations should query the friends graph and filter by those who have active locations updated within a threshold (e.g. 24 hours).
4. **BeReal Dual Capture**: Since the `Post` model already holds `btsUrl`, we can use the existing `POST /api/posts` endpoint or create a specific `/api/posts/bereal` endpoint that sets `btsUrl` and marks `isEphemeral: true` (expiring in 24 hours). Gating the BeReal feed requires checking if the querying user has posted their own BeReal in the last 24 hours.
5. **E2E Testing Runner Integration**: Because the test runner dynamically spawns the Next.js app, E2E scenarios must boot the server, authenticate requests via headers, perform state mutations, and check HTTP statuses.

---

## 3. Caveats

* **AR Camera Testing**: AR lenses require device-specific graphics APIs (WebGL, camera stream access). Since E2E tests run in a headless environment, AR lens integration must be verified by:
  * Checking that desktop access is blocked/gated and mobile-only warnings are rendered.
  * Verifying backend API endpoints (e.g., lens upload/fetch) and mocking the AR rendering client-side.
* **Time Transitions for Streaks**: Testing daily streak retention normally requires 24-48 hours. E2E tests will mock time transitions by manually modifying the `lastActivityAt` timestamp in the database via Prisma client queries between simulated days.

---

## 4. Conclusion & Proposed Architecture

### A. Proposed Database Schema Modifications (`prisma/schema.prisma`)

We propose adding the following models to support view-once media and coordinate location sharing:

```prisma
// =============================================================================
// Disappearing Media (Batch 10 - View-Once)
// =============================================================================
model DisappearingMedia {
  id           String    @id @default(cuid())
  senderId     String
  receiverId   String
  mediaUrl     String
  type         String    @default("IMAGE") // IMAGE | VIDEO
  isViewed     Boolean   @default(false)
  viewedAt     DateTime?
  expiresAt    DateTime? // Optional TTL (e.g. expires 24 hours if unopened)
  createdAt    DateTime  @default(now())

  @@index([senderId])
  @@index([receiverId])
  @@index([isViewed])
}

// =============================================================================
// Location Sharing (Batch 10 - Map Coordinates)
// =============================================================================
model UserLocation {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  latitude        Float
  longitude       Float
  shareLocation   Boolean  @default(true)
  updatedAt       DateTime @updatedAt

  @@index([userId])
}
```

---

### B. Formulated REST API Endpoints

#### 1. Streaks
* **`POST /api/streaks/activity`**
  * **Description**: Logs an activity to increment or update the user's streak.
  * **Auth Required**: Yes (`x-user-id` header).
  * **Payload**: None.
  * **Database Logic**:
    1. Fetch `Streak` record for the user. If not found, create one with `currentStreak = 1`.
    2. Check `lastActivityAt` vs `now`:
       * If < 24 hours: Update `lastActivityAt` to `now`, do not change streak count.
       * If between 24 and 48 hours: Increment `currentStreak` by 1. If `currentStreak > longestStreak`, set `longestStreak = currentStreak`. Update `lastActivityAt`.
       * If > 48 hours: Reset `currentStreak` to 1. Update `lastActivityAt`.
    3. Increment `totalDaysActive` by 1.
  * **Response**: `200 OK` `{ data: { currentStreak: 3, longestStreak: 12, lastActivityAt: Date } }`

* **`GET /api/streaks/status`**
  * **Description**: Checks the user's current streak status.
  * **Auth Required**: Yes.
  * **Response**: `200 OK` `{ data: { currentStreak: 3, longestStreak: 12, lastActivityAt: Date, weeklyGoalProgress: 4 } }`

* **`GET /api/streaks/friends`**
  * **Description**: Fetches streak counts of the user's friends for leaderboard display.
  * **Auth Required**: Yes.
  * **Response**: `200 OK` `{ data: [ { username: "@alicedev", streak: 15 }, { username: "@bobdev", streak: 8 } ] }`

#### 2. View-Once / Disappearing Media
* **`POST /api/media/disappearing`**
  * **Description**: Captures and uploads a view-once media message to a friend.
  * **Auth Required**: Yes.
  * **Payload**: `{ receiverId: string, mediaUrl: string, type: "IMAGE" | "VIDEO", duration?: number }`
  * **Database Logic**: Inserts a new `DisappearingMedia` record with `isViewed = false` and optional `expiresAt`.
  * **Response**: `200 OK` `{ data: { id: "media_123", mediaUrl: "url", isViewed: false } }`

* **`GET /api/media/disappearing/[id]`**
  * **Description**: Retrieves the disappearing media content once.
  * **Auth Required**: Yes (only receiver can access).
  * **Database Logic**:
    1. Fetch `DisappearingMedia` where `id = [id]`.
    2. If `isViewed = true` or `expiresAt < now`, return `410 Gone`.
    3. Return media content and trigger immediate transition to viewed (update `isViewed = true`, `viewedAt = now`).
  * **Response**: `200 OK` `{ data: { mediaUrl: "url", type: "IMAGE", duration: 10 } }` or `410 Gone` `{ error: "This media has already been viewed or has expired." }`

* **`POST /api/media/disappearing/[id]/view`**
  * **Description**: Explicitly confirms that the client has rendered and closed the media.
  * **Auth Required**: Yes.
  * **Database Logic**: Updates `isViewed = true` and purges `mediaUrl` (sets to empty string or deletes the row to guarantee security).
  * **Response**: `200 OK` `{ success: true }`

#### 3. Location Sharing
* **`POST /api/location/update`**
  * **Description**: Updates the current user's GPS coordinates.
  * **Auth Required**: Yes.
  * **Payload**: `{ latitude: number, longitude: number, shareLocation?: boolean }`
  * **Database Logic**: Upserts coordinates into the `UserLocation` table for the user.
  * **Response**: `200 OK` `{ success: true, updatedAt: Date }`

* **`GET /api/location/friends`**
  * **Description**: Fetches the locations of the user's friends.
  * **Auth Required**: Yes.
  * **Database Logic**:
    1. Query all active friendships for the current user.
    2. Retrieve `UserLocation` records for those friends where `shareLocation = true` and `updatedAt` is within the last 24 hours.
  * **Response**: `200 OK` `{ data: [ { userId: "user_a", username: "alicedev", latitude: 37.7749, longitude: -122.4194, updatedAt: Date } ] }`

#### 4. BeReal BTS Capture/Uploads
* **`POST /api/posts/bereal`**
  * **Description**: Publishes a BeReal post with dual media (main camera image + BTS front camera image).
  * **Auth Required**: Yes.
  * **Payload**: `{ mainImageUrl: string, btsImageUrl: string, visibility: "PUBLIC" | "FOLLOWERS" }`
  * **Database Logic**:
    1. Create a `Post` record with `mediaUrls = "['mainImageUrl']"`, `btsUrl = btsImageUrl`, `isEphemeral = true`, and `expiresAt = now() + 24 hours`.
  * **Response**: `200 OK` `{ data: { id: "post_bereal_abc", mediaUrls: [...], btsUrl: "btsImageUrl" } }`

* **`GET /api/posts/bereal/feed`**
  * **Description**: Fetches friends' BeReal posts. Implements the core BeReal gating mechanic.
  * **Auth Required**: Yes.
  * **Database Logic**:
    1. Check if the current user has created a post with `btsUrl != null` and `createdAt >= now() - 24 hours`.
    2. If NO: return a gated state (`{ feedLocked: true }`) or returning posts with blurred media details.
    3. If YES: return the full un-gated list of friends' BeReal posts from the last 24 hours.
  * **Response**:
    * *Locked*: `200 OK` `{ feedLocked: true, message: "Upload your BeReal to unlock your friends' posts today!" }`
    * *Unlocked*: `200 OK` `{ feedLocked: false, data: [ { id: "post_1", author: "alicedev", mainUrl: "url", btsUrl: "btsUrl" } ] }`

---

### C. Zustand State Store Blueprint

#### 1. New Camera & AR Store (`src/store/cameraStore.ts`)

```typescript
import { create } from "zustand";

interface ARLens {
  id: string;
  name: string;
  effectFile: string;
  thumbnailUrl: string;
}

interface CameraState {
  activeLens: ARLens | null;
  availableLenses: ARLens[];
  isDesktop: boolean;
  capturedMainUrl: string | null;
  capturedBtsUrl: string | null;
  cameraMode: "NORMAL" | "BE_REAL" | "DISAPPEARING";
  
  // Actions
  setLens: (lens: ARLens | null) => void;
  setCameraMode: (mode: "NORMAL" | "BE_REAL" | "DISAPPEARING") => void;
  setCapturedMedia: (mainUrl: string, btsUrl?: string) => void;
  clearCapturedMedia: () => void;
  detectDevice: () => void;
}

export const useCameraStore = create<CameraState>((set) => ({
  activeLens: null,
  availableLenses: [
    { id: "lens_dog", name: "Dog Ears", effectFile: "/filters/dog.deepar", thumbnailUrl: "/thumbnails/dog.png" },
    { id: "lens_beauty", name: "Smooth Skin", effectFile: "/filters/beauty.deepar", thumbnailUrl: "/thumbnails/beauty.png" },
    { id: "lens_neon", name: "Neon Glow", effectFile: "/filters/neon.deepar", thumbnailUrl: "/thumbnails/neon.png" }
  ],
  isDesktop: false,
  capturedMainUrl: null,
  capturedBtsUrl: null,
  cameraMode: "NORMAL",

  setLens: (lens) => set({ activeLens: lens }),
  setCameraMode: (mode) => set({ cameraMode: mode }),
  setCapturedMedia: (mainUrl, btsUrl) => set({ capturedMainUrl: mainUrl, capturedBtsUrl: btsUrl || null }),
  clearCapturedMedia: () => set({ capturedMainUrl: null, capturedBtsUrl: null }),
  detectDevice: () => {
    if (typeof window !== "undefined") {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isMobile = /iphone|ipad|ipod|android|blackberry|windows phone/g.test(userAgent);
      set({ isDesktop: !isMobile });
    }
  }
}));
```

#### 2. Updates to Existing Stores

* **`src/store/feedStore.ts`**:
  * Add state variables: `berealPosts: Post[]`, `isBerealFeedLocked: boolean`.
  * Add actions: `fetchBerealFeed()`, which queries `/api/posts/bereal/feed` and sets `isBerealFeedLocked` or updates `berealPosts`.
* **`src/store/messageStore.ts`**:
  * Add actions: `sendDisappearingMedia(receiverId, url, type)` and `fetchDisappearingMedia(id)`.
* **`src/store/uiStore.ts` (or new `mapStore.ts`)**:
  * Add state variables: `friendsLocations: FriendLocation[]`, `userLocation: { lat: number; lng: number } | null`.
  * Add actions: `updateLocation(lat, lng)`, `fetchFriendsLocations()`.
* **`src/store/authStore.ts`**:
  * Add state variables: `userStreak: { current: number; longest: number } | null`.
  * Add actions: `fetchStreak()`, `logDailyActivity()`.

---

### D. E2E Testing Scenarios

These integration test outlines are designed for insertion into `tests/e2e_runner.js`.

#### Tier 1: Feature Coverage
Reads `implementation_tracker.md` and validates that the new features are listed and set to `"Implemented"`:
* `F-1001`: Daily Streaks.
* `F-1002`: View-Once / Disappearing Media.
* `F-1003`: Coordinate Location Map Sharing.
* `F-1004`: BeReal Dual-Camera BTS.

#### Tier 2: Boundary & Corner Cases

```javascript
runTest("tier2", "Streaks: validate daily activity check limits and resets", async () => {
  // 1. Log activity day 1 (expect streak = 1)
  // 2. Log activity again immediately (expect streak remains 1, no double increments)
  // 3. Mock database time back by 30 hours (representing day 2 activity) -> Log activity (expect streak = 2)
  // 4. Mock database time back by 60 hours (representing broken streak) -> Log activity (expect streak resets to 1)
});

runTest("tier2", "Disappearing Media: validate view-once boundaries and security gating", async () => {
  // 1. Fetch disappearing media belonging to another user (expect 403 Forbidden)
  // 2. Fetch nonexistent disappearing media ID (expect 404 Not Found)
  // 3. Retrieve valid media once (expect 200 OK)
  // 4. Retrieve same media again (expect 410 Gone)
});

runTest("tier2", "Location Sharing: coordinate boundary checks", async () => {
  // 1. Update location with latitude = 120 (expect 400 Bad Request)
  // 2. Update location with longitude = -250 (expect 400 Bad Request)
  // 3. Update location with empty values (expect 400 Bad Request)
  // 4. Update location with valid coordinates e.g., 37.7749, -122.4194 (expect 200 OK)
});

runTest("tier2", "BeReal BTS: validation of dual uploads", async () => {
  // 1. Publish BeReal post with missing back-camera image (expect 400 Bad Request)
  // 2. Publish BeReal post with empty front-camera image (expect 400 Bad Request)
});
```

#### Tier 3: Cross-Feature Combinations

```javascript
runTest("tier3", "BeReal Feed Lock/Unlock Gating Mechanic", async () => {
  // 1. User A (who has not posted a BeReal today) requests the BeReal feed
  //    -> Assert that feedLocked is true and mediaUrls/btsUrls of friends' posts are masked
  // 2. User A uploads a valid BeReal post (main + BTS image)
  // 3. User A requests the BeReal feed again
  //    -> Assert that feedLocked is false and full media/BTS urls of friends are returned
});

runTest("tier3", "Streaks and Badge Milestones Coupling", async () => {
  // 1. User has currentStreak = 6.
  // 2. Log daily activity to increment streak to 7.
  // 3. Verify that the user's Badge count has increased and the "Week Warrior" badge is awarded in their profile.
});

runTest("tier3", "Location Sharing and Block List Propagation", async () => {
  // 1. Friend A and Friend B are friends; Friend A updates location.
  // 2. Friend B fetches friends' locations -> Assert Friend A is on the map.
  // 3. Friend B blocks Friend A.
  // 4. Friend B fetches friends' locations -> Assert Friend A is no longer returned.
  // 5. Friend A fetches friends' locations -> Assert Friend B is not returned.
});
```

#### Tier 4: Real-World Application Scenarios

```javascript
runTest("tier4", "Camera & AR Integrated User Journey: Location, BeReal Feed, and View-Once Media lifecycle", async () => {
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  const { spawn } = require("child_process");
  const path = require("path");
  const port = 4100;
  const baseUrl = `http://127.0.0.1:${port}`;
  let serverProcess = null;

  try {
    const userA = await prisma.user.findUnique({ where: { username: "wakkadev" } });
    const userB = await prisma.user.findUnique({ where: { username: "alicedev" } });
    assert(userA && userB, "Seeded users wakkadev and alicedev must exist");

    // Spawn Next.js server
    const tsxPath = path.resolve(__dirname, "../node_modules/tsx/dist/cli.cjs");
    const env = { ...process.env, PORT: String(port), HOSTNAME: "127.0.0.1", NODE_ENV: "development" };
    serverProcess = spawn("node", [tsxPath, "server.ts"], { env });

    // Wait for server boot
    await new Promise((resolve) => {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`${baseUrl}/api/streaks/status`, { headers: { "x-user-id": userA.id } });
          if (res.status === 200 || res.status === 401) { clearInterval(interval); resolve(); }
        } catch {}
      }, 500);
    });

    console.log("    [Step 1] User A updates GPS coordinates and User B fetches locations...");
    await fetch(`${baseUrl}/api/location/update`, {
      method: "POST",
      headers: { "x-user-id": userA.id, "Content-Type": "application/json" },
      body: JSON.stringify({ latitude: 34.0522, longitude: -118.2437 })
    });
    const locationsRes = await fetch(`${baseUrl}/api/location/friends`, { headers: { "x-user-id": userB.id } });
    const locationsData = await locationsRes.json();
    const loc = locationsData.data.find(l => l.userId === userA.id);
    assert(loc, "User B must see User A's updated coordinates");
    assertEq(loc.latitude, 34.0522);

    console.log("    [Step 2] User B fetches BeReal feed (gated check)...");
    const gatedFeedRes = await fetch(`${baseUrl}/api/posts/bereal/feed`, { headers: { "x-user-id": userB.id } });
    const gatedFeedData = await gatedFeedRes.json();
    assertEq(gatedFeedData.feedLocked, true, "User B's BeReal feed must be locked before posting");

    console.log("    [Step 3] User B uploads BeReal and unlocks the feed...");
    await fetch(`${baseUrl}/api/posts/bereal`, {
      method: "POST",
      headers: { "x-user-id": userB.id, "Content-Type": "application/json" },
      body: JSON.stringify({ mainImageUrl: "https://example.com/back.jpg", btsImageUrl: "https://example.com/front.jpg" })
    });
    const unlockedFeedRes = await fetch(`${baseUrl}/api/posts/bereal/feed`, { headers: { "x-user-id": userB.id } });
    const unlockedFeedData = await unlockedFeedRes.json();
    assertEq(unlockedFeedData.feedLocked, false, "BeReal feed should unlock after posting");

    console.log("    [Step 4] User A sends a view-once media message to User B...");
    const sendMediaRes = await fetch(`${baseUrl}/api/media/disappearing`, {
      method: "POST",
      headers: { "x-user-id": userA.id, "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: userB.id, mediaUrl: "https://example.com/once.jpg", type: "IMAGE" })
    });
    const mediaObj = (await sendMediaRes.json()).data;

    console.log("    [Step 5] User B opens the view-once media (GET once)...");
    const openRes = await fetch(`${baseUrl}/api/media/disappearing/${mediaObj.id}`, { headers: { "x-user-id": userB.id } });
    const openData = await openRes.json();
    assertEq(openData.data.mediaUrl, "https://example.com/once.jpg", "Media URL must match");

    console.log("    [Step 6] User B attempts to open the media a second time (should fail)...");
    const reopenRes = await fetch(`${baseUrl}/api/media/disappearing/${mediaObj.id}`, { headers: { "x-user-id": userB.id } });
    assertEq(reopenRes.status, 410, "Media must reject double-view with 410 Gone");

  } finally {
    if (serverProcess) serverProcess.kill("SIGKILL");
    await prisma.$disconnect();
  }
});
```

---

## 5. Verification Method & Test Run Diagnostics

* **E2E Test Runner Verification**:
  * Executing `node tests/e2e_runner.js` runs all registered integration suites for Batches 1 to 8.
  * **Diagnostic Log**: During verification, the test runner executed successfully up to port 4085 startup:
    * Passed Tier 1 feature tracker status verify.
    * Passed all Tier 2 input boundaries (alias, recovery, 2FA, search, tipping, credit cards).
    * Passed all Tier 3 customizations (personas, privacy toggle, soundtracks, tab order).
    * Passed all Tier 4 user flows, live streams (Batch 6), server roles & boosts (Batch 7), jobs platform, premium quota, and course library completions (Batch 8).
    * **Failure observed**: The Reddit platform workflow (Batch 9) test on port 4085 failed to complete/connect. This does not invalidate the proposed designs for Batch 10 but indicates that a pre-existing Batch 9 integration check is failing on the host system.
* **Database Verification**:
  * Run `npx prisma generate` to verify model declarations compiling.
