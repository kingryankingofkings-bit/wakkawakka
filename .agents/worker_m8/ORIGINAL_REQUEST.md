## 2026-06-30T13:44:17Z

You are teamwork_preview_worker. Your working directory is C:\Users\Kingr\OneDrive\Documents\wakkawakka-local.
Your role is to implement Batch 6 (Live Streaming & Video Platform) features into the Wakka Wakka application.

Here is the scope and requirements based on the explorers' reports:

1. **Prisma Schema Updates**:
   - Update `prisma/schema.prisma` to add:
     - `channelPoints Int @default(0)` to the `User` model.
     - `Prediction` model: `id`, `liveStreamId`, `liveStream`, `title`, `status` (ACTIVE | LOCKED | RESOLVED | CANCELLED), `winningOptionId`, `createdAt`, `updatedAt`, `options`, `bets`.
     - `PredictionOption` model: `id`, `predictionId`, `prediction`, `text`, `totalPoints`, `bets`.
     - `PredictionBet` model: `id`, `predictionId`, `prediction`, `optionId`, `option`, `userId`, `user`, `points`, `createdAt`. With a unique constraint on `[predictionId, userId]` so users can make only one bet per prediction.
     - `Clip` model: `id`, `title`, `videoUrl`, `thumbnailUrl`, `duration` (Int), `viewsCount` (Int @default(0)), `creatorId`, `creator`, `liveStreamId`, `liveStream`, `createdAt`.
   - Update `LiveStream` model:
     - Add `predictions Prediction[]` and `clips Clip[]` relations.

2. **Database Push & Seeding**:
   - Run `npx prisma db push` and `npx prisma generate` to apply schema changes to the local SQLite database.
   - Update the database seeder `prisma/seed.ts` to populate users with some channelPoints, add some scheduled or completed streams, VOD records, and sample clips. Run `npm run db:seed`.

3. **Backend API Endpoints**:
   - Implement the following REST API endpoints in `src/app/api/live`:
     - `/api/live/streams`: POST to create/schedule a stream; GET to list streams (accepting `status` and `category` filters).
     - `/api/live/streams/[id]`: GET to retrieve details; PATCH to update details or end a stream (converts active stream to VOD by setting `isActive = false`, `isRecorded = true` and setting a `recordingUrl`).
     - `/api/live/streams/[id]/cohost`: POST to join/leave/invite co-hosts.
     - `/api/live/streams/[id]/chat`: GET to get chat history; POST to send comments and commands (`/raid [user]` and `/host [user]`). When a raid is initiated, update the viewer counts and redirect users via Socket.IO.
     - `/api/live/streams/[id]/gifts`: POST to send a gift. Deducts points/wallet balance from user's `channelPoints` and increments `giftTotal` on stream in a single transaction.
     - `/api/live/streams/[id]/predictions`: GET to fetch active prediction; POST to handle:
       - `CREATE` prediction with options (Host only)
       - `BET` channel points on an option (User only)
       - `RESOLVE` prediction and distribute payouts to winners using the odds payout logic (Host only)
       - `CANCEL` prediction and refund points to all bettors.
     - `/api/live/streams/[id]/clips`: POST to create a clip; GET to list clips.

4. **Frontend Integration**:
   - Update `src/app/(main)/live/page.tsx` to remove any simulated mock arrays (`MOCK_LIVE_STREAMS`, etc.) and connect the UI directly to the new database API endpoints.
   - Connect the stream interactive chat to Socket.IO.
   - Implement browse by categories, scheduling, stream chat, virtual gifts sending, co-hosting overlay, channel points prediction panel, clips creation, and watch VOD archive.
   - Make sure all UI state is stored and retrieved from the actual database/API.

5. **E2E Test Case Integration**:
   - Add new E2E test cases to `tests/e2e_runner.js` to cover all Batch 6 features (creating streams, sending gifts, predictions creation, placing bets, resolving bets, VOD queries, clips creation, commands).
   - Ensure the e2e test suite runs and all tests pass (run `node tests/e2e_runner.js`).

6. **Static Checks & Build verification**:
   - Run `npm run type-check`, `npm run lint`, and `npm run build` to verify the build passes.
