# Handoff Report: Batch 6 Live Streaming & Video Platform Design

## 1. Observation

- `PROJECT.md` specifies Wakka Wakka is a Next.js 14 full-stack app using SQLite with Prisma ORM, Zustand stores, and Socket.IO (`PROJECT.md` lines 4-9).
- `prisma/schema.prisma` contains the existing models including `User` (lines 42-159) and `LiveStream` (lines 556-588) with some co-hosting and gift structures (`LiveStreamCoHost` and `LiveStreamGift`).
- `src/app/(main)/live/page.tsx` contains a client-side mock page simulating chat comments, hearts, and gift pickers using client-side mock lists (lines 1-335).
- `server.ts` is configured with Socket.IO socket listeners for live events: `join-live`, `live-comment`, and `live-gift` (lines 93-103).
- `SCOPE.md` outlines the required models (predictions, prediction options, prediction bets, clips, and user channel points) and API routes (`/api/live/streams`, `/api/live/streams/[id]`, `/api/live/streams/[id]/chat`, `/api/live/streams/[id]/gifts`, `/api/live/streams/[id]/predictions`, and `/api/live/streams/[id]/clips`).

## 2. Logic Chain

1. Based on the requirements in `SCOPE.md` and the existing `User` model, we need to introduce user-level point balances (`channelPoints` in `User`) and models to handle multi-option prediction markets (`Prediction`, `PredictionOption`, `PredictionBet`).
2. Based on the clips requirements in `SCOPE.md`, we need a `Clip` model referencing both `User` (the creator) and `LiveStream` (the source stream).
3. The existing Socket.IO listeners in `server.ts` provide room joins (`live:${streamId}`) and comment/gift broadcasts. We can build upon these to add real-time events for prediction states (starts, locks, resolutions) and raid redirects.
4. The existing `src/app/(main)/live/page.tsx` relies entirely on static client-side simulations. To satisfy the requirement of database-persisted API endpoint interaction (no fake simulation registers), we designed state handlers connecting directly to the proposed REST APIs.

## 3. Caveats

- Since SQLite does not support native enums, the `status` fields in `Prediction` and `PredictionOption` are modeled as Strings and must be validated at the application layer, aligning with the existing patterns in `prisma/schema.prisma` (lines 18-22).
- The Socket.IO real-time delivery relies on the websocket gateway; if a client disconnects, they will sync current state on reconnect by performing a GET request to `/api/live/streams/[id]/predictions`.

## 4. Conclusion

We have completed the architectural design, proposed Prisma model updates, REST API route contracts, and detailed frontend component/state flow designs. The proposals are saved in `.agents/explorer_b6_1/analysis.md` and are fully ready to be implemented.

## 5. Verification Method

- **Schema compilation check**: Once the Prisma schema changes are applied to `prisma/schema.prisma`, verify by running:
  `npx prisma validate`
  `npx prisma db push --accept-data-loss` (or similar command to push schema changes)
  `npx prisma generate`
- **Frontend layout validation**: Check `src/app/(main)/live/page.tsx` after implementation. Ensure clicking "Clip That!", betting on predictions, and sending gifts trigger the respective API calls and show in database tables.
