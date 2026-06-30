## 2026-06-30T22:30:44Z

Implement Milestone 2 (UI, Sockets & Testing) for Batch 11 (Audio & Voice).

Your identity: worker_b11_m2
Working directory: C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\.agents\worker_b11_m2

Tasks:
1. Modify `src/app/(main)/audio-rooms/page.tsx`:
   - Replace the mock lists `MOCK_AUDIO_ROOMS` and `MOCK_USERS` with API requests to `/api/audio-rooms` (GET) and other endpoints.
   - When creating a room, fetch `/api/audio-rooms` (POST).
   - When joining a room, fetch `/api/audio-rooms/[id]/speakers` (POST) if host, otherwise `/api/audio-rooms/[id]/listeners` (POST).
   - When leaving a room, fetch `/api/audio-rooms/[id]/speakers` or `/api/audio-rooms/[id]/listeners` (DELETE) and emit `audio-leave` or `leave-audio-room` socket events.
   - Support raising hands (fetching `/api/audio-rooms/[id]/hand` PATCH) and muting (fetching `/api/audio-rooms/[id]/speakers` PATCH).
   - Listen for Socket.IO messages (`audio-user-joined`, `audio-user-left`, `audio-state-changed`) to update speaker, listener, and hand raise lists dynamically in the room in real-time.
2. Modify `server.ts` (or the Socket.IO setup):
   - Hook up server-side Socket.IO room handlers to manage room channels (`join-audio-room` joins room channel `audio:roomId`) and broadcast state mutations:
     - `audio-join` broadcasts `audio-user-joined` (userId, user metadata, isSpeaker).
     - `audio-leave` broadcasts `audio-user-left` (userId).
     - `audio-state-update` broadcasts `audio-state-changed` (userId, isMuted, handRaised, isSpeaker).
3. Create a verification script `tests/audio_voice_test.js` using the draft code provided in the explorer handoff (or extend the existing `e2e_runner.js`) to test the integration flow (room creation, joins, hand raising, speaker promotion, soundboard sound deletion, Spotify search).
4. Run Next.js build compilation (`npm run build`), typescript safety check (`npm run type-check`), and linter (`npm run lint`) to confirm zero compilation/linting errors.
5. Execute the test scripts to verify everything is 100% functional.
6. Write a handoff report in C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\.agents\worker_b11_m2\handoff.md.
