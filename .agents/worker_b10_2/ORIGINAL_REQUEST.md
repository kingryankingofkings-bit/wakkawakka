## 2026-06-30T20:04:07Z
<USER_REQUEST>
You are worker_b10_2. Your task is to implement the REST API routes for Batch 10 (Camera & AR, Snapchat/BeReal-style) in C:\Users\Kingr\OneDrive\Documents\wakkawakka-local.
Your working directory is: C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\.agents\worker_b10_2

Please implement the following API routes using Prisma client:
1. Streaks APIs:
   - `POST /api/streaks/activity`: Log user activity. If streak record does not exist for the user, create one. Check `lastActivityAt`.
     - If < 24 hours: do nothing, update `lastActivityAt`.
     - If between 24 and 48 hours: increment `currentStreak`, update `longestStreak` if `currentStreak > longestStreak`. Update `lastActivityAt`.
     - If > 48 hours: reset `currentStreak` to 1. Update `lastActivityAt`.
     Increment `totalDaysActive` and return streak status.
   - `GET /api/streaks/status`: Retrieve user streak counts.
   - `GET /api/streaks/friends`: Fetch streak counts of friends.
2. Disappearing View-Once Media APIs:
   - `POST /api/media/disappearing`: Payload: `{ receiverId, mediaUrl, type }`. Create a new `DisappearingMedia` record.
   - `GET /api/media/disappearing/[id]`: Retrieve single disappearing media message. Check if `isViewed` is true. If true, return `410 Gone` error. If false, set `isViewed = true`, set `viewedAt = now`, save, and return the media details.
   - `POST /api/media/disappearing/[id]/view`: Set `isViewed = true` and purge `mediaUrl` by setting it to empty string (or delete the row) for security.
3. Location Sharing APIs:
   - `POST /api/location/update`: Payload: `{ latitude, longitude, shareLocation }`. Validate that latitude is between -90 and 90, longitude is between -180 and 180. Upsert `UserLocation`.
   - `GET /api/location/friends`: Fetch friends' locations where `shareLocation = true` and coordinates were updated in the last 24 hours. Exclude blocked users.
4. BeReal Dual Camera APIs:
   - `POST /api/posts/bereal`: Payload: `{ mainImageUrl, btsImageUrl, visibility }`. Create a `Post` with `mediaUrls = [mainImageUrl]`, `btsUrl = btsImageUrl`, `isEphemeral = true`, `expiresAt = now + 24 hours`.
   - `GET /api/posts/bereal/feed`: Get BeReal posts from friends created in the last 24 hours. If the querying user has NOT created a BeReal post in the last 24 hours, return `{ feedLocked: true }`. If they have, return `{ feedLocked: false, data: [...] }`.

Verify all changes compile successfully by running `npm run type-check`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Document all changes made and compile outputs in handoff.md in your working directory, and send a message to the parent orchestrator (conversation ID: 5152cc68-a190-4c02-a3db-e86cc4efc787) when complete.
</USER_REQUEST>
