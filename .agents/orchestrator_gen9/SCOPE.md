# Scope: Batch 11 (Audio & Voice, Clubhouse/Spotify-style)

## Architecture & Requirements
We are implementing real, database-persisted functionality for Batch 11 (Audio & Voice), connecting live audio rooms, soundboards, and Spotify anthem widgets to actual database queries and real-time Socket.IO synchronization.

## Interface Contracts & Guidelines
- All new database models must be integrated into `prisma/schema.prisma` and applied via `npx prisma db push` or equivalent schema migrations.
- API endpoints must authenticate requests and verify permissions.
- Socket.IO server stubs in `server.ts` must be extended to sync speakers, mute states, and hand raises.
- No mocks in the final UI components. All structures should sync with actual SQLite database tables.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | DB Schema & APIs | Update schema.prisma with Podcast/Playlist/Transcript models and listener handRaised column. Add API routes for audio-rooms, speakers, listeners, hand raising, soundboard sound deletion, and Spotify search. | None | PLANNED |
| 2 | UI, Sockets & Testing | Integrate React UI pages with the new APIs, hook up real-time voice/coordination sockets in `server.ts`, write the integration test suite in `tests/audio_voice_test.js`, and verify the build. | M1 | PLANNED |

## Interface Contracts
- **Audio Rooms**: `/api/audio-rooms` (GET/POST), `/api/audio-rooms/[id]/speakers` (POST/PATCH/DELETE), `/api/audio-rooms/[id]/listeners` (POST/DELETE), `/api/audio-rooms/[id]/hand` (PATCH)
- **Soundboards**: `/api/servers/[id]/soundboard/[soundId]` (DELETE)
- **Spotify**: `/api/spotify/search` (GET)
