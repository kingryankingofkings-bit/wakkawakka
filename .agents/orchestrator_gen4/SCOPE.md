# Scope: Batch 6 (Live Streaming & Video Platform)

## Architecture & Requirements

We are implementing a full live streaming platform containing:

1. **Prisma Schema updates**:
   - Add predictions, prediction options, prediction bets, and clips models.
   - Add `channelPoints` balance to the `User` model.
2. **API Routes**:
   - `/api/live/streams`: Create/List active streams, handle stream scheduling.
   - `/api/live/streams/[id]`: Retrieve/Update stream details, handle ending a stream, and co-hosting registration.
   - `/api/live/streams/[id]/chat`: Handle chat comments, custom emojis/emotes, simulated raids, and hosting commands.
   - `/api/live/streams/[id]/gifts`: Processing tips, bits, and streaming gift interactions.
   - `/api/live/streams/[id]/predictions`: Create prediction events, bet channel points, and resolve predictions.
   - `/api/live/streams/[id]/clips`: Create stream clips from live playback.
3. **Frontend Changes**:
   - Integrate all streaming functionalities into `src/app/(main)/live/page.tsx`.
   - Implement category browse, streaming scheduler, live chat, co-hosting overlay, gift sender, predictions widget, clips capture, and VOD watch archive.
   - All state transitions must interact with the new database-persisted API endpoints. No fake simulation registers.

## Interface Contracts

- See `C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\PROJECT.md`.
