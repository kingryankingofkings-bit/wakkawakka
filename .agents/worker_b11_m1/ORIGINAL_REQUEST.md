## 2026-06-30T22:22:32Z
Implement Milestone 1 (DB Schema & REST API endpoints) for Batch 11 (Audio & Voice).

Your identity: worker_b11_m1
Working directory: C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\.agents\worker_b11_m1

Tasks:
1. Update `prisma/schema.prisma`:
   - Add boolean `handRaised` field to `AudioRoomListener` model (with default false).
   - Add `Podcast` model (id, title, description, coverUrl, authorId, author, category, episodes, createdAt, updatedAt).
   - Add `PodcastEpisode` model (id, podcastId, podcast, title, description, audioUrl, duration, publishedAt, createdAt, updatedAt).
   - Add `AudioPlaylist` model (id, name, description, coverUrl, userId, user, tracks, createdAt, updatedAt).
   - Add `AudioPlaylistTrack` model (id, playlistId, playlist, title, artist, audioUrl, duration, position, createdAt).
   - Add `AudioRoomTranscript` model (id, audioRoomId, audioRoom, fullText, createdAt, updatedAt).
   - Add `AudioRoomTranscriptSegment` model (id, audioRoomId, userId, user, text, timestamp).
   - Add matching relations on the `User` model: `podcasts`, `playlists`, and `transcriptSegments`.
2. Run database migration/push commands (`npx prisma db push` or similar) to apply these updates to the local SQLite database, and regenerate the Prisma client (`npx prisma generate`).
3. Implement the REST API routes:
   - `src/app/api/audio-rooms/route.ts`: GET to list active audio rooms, POST to create a room.
   - `src/app/api/audio-rooms/[id]/speakers/route.ts`: POST to promote, PATCH to mute/unmute, DELETE to demote/remove speaker. Include host authorization checks.
   - `src/app/api/audio-rooms/[id]/listeners/route.ts`: POST to join as listener, DELETE to leave/remove listener.
   - `src/app/api/audio-rooms/[id]/hand/route.ts`: PATCH to raise/lower hand.
   - `src/app/api/servers/[id]/soundboard/[soundId]/route.ts`: DELETE to remove a soundboard sound. Ensure only the sound uploader or server owner can delete it.
   - `src/app/api/spotify/search/route.ts`: Enhance to check search params, call the Spotify client credentials token API and track search API if keys are present in env, otherwise fallback to local mock track searches.
4. Verify that TypeScript compilation (`npm run type-check`) compiles with no errors.
5. Write a handoff report in C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\.agents\worker_b11_m1\handoff.md.

MANDATORY INTEGRITY WARNING:
> DO NOT CHEAT. All implementations must be genuine. DO NOT
> hardcode test results, create dummy/facade implementations, or
> circumvent the intended task. A Forensic Auditor will independently
> verify your work. Integrity violations WILL be detected and your
> work WILL be rejected.
