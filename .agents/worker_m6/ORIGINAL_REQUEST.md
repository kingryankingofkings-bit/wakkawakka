## 2026-06-30T10:36:41Z

Implement the REAL, integrated, database-backed features for Batch 5 (E-Commerce, Creator Tools, Analytics, APIs) in C:\Users\Kingr\OneDrive\Documents\wakkawakka-local.

## 2026-06-30T10:46:12Z

We have received new requirements from a platform audit. You must implement the following 13 feature gaps and corrections in your current pass:

### 1. Database Schema Updates:

- Update `prisma/schema.prisma` to add necessary models:
  - `Fundraiser` (id, creatorId, title, description, goalAmount, raisedAmount, status, createdAt) and `FundraiserDonation` (id, fundraiserId, donorId, amount, createdAt).
  - `DatingProfile` (id, userId, bio, prompts, lookingFor, matches, crushes, datingEvents) or add fields to User.
  - `AdPlacement` (id, adId, type, page) - support WhatsApp Ads placements.
  - `Bounty` (id, creatorId, title, description, rewardAmount, status, participantsCount).
  - `WebhookSubscription` and `WebhookDeliveryLog` (as previously defined).

### 2. Implementation of Gaps:

1. **Facebook Dating (`/dating` page)**:
   - Build a `/dating` page with:
     - Profile setup (dating bio, prompts).
     - Swipe/match simulator UI (displaying discoverable dating cards with Like/Pass buttons, persisting matches to the database).
     - Secret Crush setup (adding usernames to a secret crush list; if two users crush each other, trigger a MATCH).
     - Dating Events calendar (calendar listing local/online single mixers events).
2. **Facebook Fundraisers (`/fundraisers` page)**:
   - Build endpoints `GET/POST /api/fundraisers` and `/api/fundraisers/[id]/donate` to create charitable campaigns, track goal progress bars, and simulate credit card donation processing.
   - Build `/fundraisers` frontend to display campaigns, progress bars, and a donation checkout modal.
3. **Facebook Gaming (`/gaming` page)**:
   - Build a `/gaming` page featuring a list of gaming streams/tournaments, a tournament signup/creation form, and simulated instant games (interactive canvas/iframe HTML5 games, e.g. Tic-Tac-Toe, Pong, or Snake).
4. **Instagram Notes**:
   - Add a lightweight Status Note bar above the DM conversation list in `/messages` (GET/POST `/api/messages/notes` to publish notes that disappear or display for other users).
5. **WhatsApp Flows**:
   - Inside chat window message bubble, support rendering structured interactive forms, checkbox selections, and submit confirmations sent in messages.
6. **WhatsApp Ads**:
   - Display ad placements (using `/api/ads/serve` with target matching) inside Status and Channel update tabs.
7. **Telegram Mini Apps / WebApps**:
   - Allow embedding mini web apps (e.g. mock widgets like weather, calculator, or Tic-Tac-Toe) inside a chat message, launching them in a modal webview directly from the chat bubbles.
8. **Discord Activities**:
   - Support launching social activities (in-channel games or screenshare simulations) inside chat panels/channels.
   - Show active member avatars joining the activity in the channel.
9. **Kick Bounties (`/bounties` page)**:
   - Build a `/bounties` creator page listing active incentives (e.g. "Stream for 5 hours", "Get 100 followers") with task goal trackers, payout amounts, and claims logs.
10. **BeReal BTS**:
    - Update `CreatePostModal.tsx` to allow recording/uploading a short 3-second Behind-The-Scenes video snippet attached to a post, displaying a BTS playback icon on the feed post.
11. **Bluesky Labelers**:
    - Update the `/admin/moderation` page to support custom moderation label creation (e.g., "NSFW", "Clickbait", "Misinformation") and let admins attach labels to posts, filtering feed posts if labels match user preferences.
12. **Threads Highlighter**:
    - In the explore/feed pages, spotlight trending threads with a distinct highlighted ring or background glow.
13. **TikTok Green Screen Kit**:
    - Enhance `CreatePostModal` media uploader to act as an asset feeder, allowing users to combine background templates/images with active uploads.

### 3. Corrections / Adjustments:

- **Apaya/Publer (AI Content Scheduling & Automation)**:
  - Add a **Content Scheduling & Automation Dashboard** under a `/scheduling` route or in the Creator section:
    - AI content generation (input brand voice prompts, generate post copy using mock LLM endpoint).
    - Multi-platform scheduling calendar displaying scheduled slots.
    - Automatic posting logic processing posts when `scheduledAt <= now`.
- **Buz**: Keep to push-to-talk audio messaging, async playback, and simple file sharing. Omit any unverified extra features.
- **Lemon8 & BAND**: Keep to standard identity lifestyle template feeds, group files directories, and group chat.

## 2026-06-30T13:54:57Z

You are teamwork_preview_worker. Your working directory is C:\Users\Kingr\OneDrive\Documents\wakkawakka-local.
Your role is to remediate the Batch 6 implementation based on the Reviewer's findings.

Please execute these changes carefully:

1. **Database Schema & Chat Persistence**:
   - Update `prisma/schema.prisma` to add a new `LiveStreamChatMessage` model:
     ```prisma
     model LiveStreamChatMessage {
       id           String     @id @default(cuid())
       liveStreamId String
       liveStream   LiveStream @relation("StreamChatMessages", fields: [liveStreamId], references: [id], onDelete: Cascade)
       userId       String
       user         User       @relation("UserChatMessages", fields: [userId], references: [id], onDelete: Cascade)
       message      String
       type         String     @default("COMMENT") // COMMENT | GIFT | SYSTEM
       giftAmount   Float?
       createdAt    DateTime   @default(now())

       @@index([liveStreamId])
       @@index([userId])
       @@index([createdAt])
     }
     ```
   - Connect it to `LiveStream` (e.g. `chatMessages LiveStreamChatMessage[] @relation("StreamChatMessages")`) and `User` (e.g. `chatMessages LiveStreamChatMessage[] @relation("UserChatMessages")`).
   - Run `npx prisma db push` and `npx prisma generate` to apply.

2. **API route fixes**:
   - **Chat (`/api/live/streams/[id]/chat`)**: Remove the volatile in-memory map. Read and write comments using the new `LiveStreamChatMessage` model.
   - **Gifts (`/api/live/streams/[id]/gifts`)**: Fix the typo where the response returns the user's points balance under the `displayName` field instead of the actual display name. Persist the gift comment in the `LiveStreamChatMessage` model as type `GIFT`.
   - **Co-host (`/api/live/streams/[id]/cohost`)**:
     - Query user to verify target `userId` exists, returning a clean 400 response if not.
     - Enforce authorization: only allow `ACCEPT` if the user has a pending invitation. Avoid showing co-host visual split-screen overlays until they have actually accepted.
   - **Predictions (`/api/live/streams/[id]/predictions`)**: Ensure all payout distributions (resolving and cancelling) are wrapped inside a single atomic `prisma.$transaction` block.

3. **Frontend UI Fixes (`src/app/(main)/live/page.tsx`)**:
   - **Tabs**: Implement active state tab switching in the sidebar (e.g., toggle between "Chat & Interactive" and "Clips & VODs") instead of hardcoding static mockup tabs with all sections vertically stacked.
   - **Accessibility**: Restore focus visible styles, add ARIA roles, and include `aria-live` on chat logs.
   - **Responsiveness**: Set mobile viewport height constraints on the sidebar container (e.g. `max-h-[50vh] lg:max-h-none overflow-y-auto`).

4. **Verification**:
   - Update `tests/e2e_runner.js` to ensure the E2E verification tests cover the new model and persistence.
   - Run `npm run type-check`, `npm run lint`, and `npm run build`.
   - Run `node tests/e2e_runner.js`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Provide a handoff.md detailing your changes and the build/test outcomes.

## 2026-06-30T14:14:55Z

**Context**: Batch 6 (Live Streaming & Video Platform) Remediation
**Content**: The Challenger and Forensic Auditor have completed their analyses and found 3 additional security/business logic vulnerabilities that MUST be addressed in your remediation work:

1. **Negative Gift Amount Exploit**: The gift endpoint `/api/live/streams/[id]/gifts` allows negative amount/quantity, which results in artificially incrementing user points balance. Add a check to enforce `amount > 0` and `quantity > 0` in the backend API validation.
2. **Floating-point Bets**: The prediction bet endpoint allows float values (e.g. 10.5), which gets truncated by SQLite. Ensure the bet amount is an integer (`Number.isInteger(points)`) in the backend validation.
3. **Concurrent Double Betting**: When a user submits two concurrent bets, the database throws a unique constraint error resulting in a 500 response. Catch the Prisma unique constraint violation (P2002) and return a clean 400 response with an appropriate message.
   **Action**: Please implement fixes for these 3 issues in your remediation changes, and make sure all E2E tests and builds pass.
