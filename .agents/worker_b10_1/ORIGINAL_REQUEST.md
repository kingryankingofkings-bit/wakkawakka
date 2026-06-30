## 2026-06-30T20:00:42Z
You are worker_b10_1. Your task is to update the Prisma schema for Batch 10 (Camera & AR) features and update the integration inventory for Batch 9 in C:\Users\Kingr\OneDrive\Documents\wakkawakka-local.
Your working directory is: C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\.agents\worker_b10_1

Please execute the following steps:
1. In `prisma/schema.prisma`, add the database models needed for Batch 10 features:
   - `UserLocation`: latitude (Float), longitude (Float), shareLocation (Boolean, default true), updatedAt (DateTime, updatedAt). Enable location mapping.
   - `DisappearingMedia`: senderId, receiverId, mediaUrl, type (IMAGE | VIDEO, default IMAGE), isViewed (Boolean, default false), viewedAt (DateTime?), expiresAt (DateTime?), createdAt (DateTime, default now()). Handles view-once direct messages.
   - `FriendStreak`: friendshipId (String, unique), count (Int, default 0), lastInteractionAt (DateTime, default now()), expiresAt (DateTime), createdAt (DateTime, default now()), updatedAt (DateTime, updatedAt). Tracks friend-to-friend Snapchat-style streaks.
   - `ARLens`: name, iconUrl, assetUrl, category, isActive (Boolean, default true), createdAt (DateTime, default now()). Tracks available camera lenses.
   - `Geofilter`: name, overlayUrl, minLat, maxLat, minLng, maxLng, isActive (Boolean, default true), createdAt (DateTime, default now()). Geolocation-bound image overlays.
   - `SavedMemory`: userId, mediaUrl, type, caption, latitude (Float?), longitude (Float?), createdAt (DateTime, default now()). Private story/media vault.
   Also, ensure that you add the corresponding relation fields on `User`, `Friendship`, and other models as required so that Prisma generate succeeds.
2. Verify the Prisma schema by running:
   - `npx prisma validate`
   - `npx prisma generate`
   - `npx prisma db push --accept-data-loss` (or similar command to update the local sqlite database).
3. In `integration_inventory.md` at the project root, append the completed Batch 9 features:
   ```markdown
   ## Batch 9 Features

   | Feature | Description | Status |
   | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------- |
   | **Forum & Voting (Reddit-style)** | Subreddit-style topic communities with custom rules, upvote/downvote system with karma, award/gift system, crossposting, AMA format, and mod tools (automod rules, mod queue). | Implemented |
   ```
4. Verify by running `npm run type-check` to make sure the generated Prisma client does not break any existing types.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Document all changes made and outputs in handoff.md in your working directory and notify the parent orchestrator (conversation ID: 5152cc68-a190-4c02-a3db-e86cc4efc787) when complete.
