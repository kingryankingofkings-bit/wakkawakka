# BRIEFING — 2026-06-30T15:20:06-07:00

## Mission
Explore and analyze references, models, hooks, and stubs related to Audio & Voice features (live audio rooms, soundboards, Spotify integration, etc.) and design a detailed implementation plan.

## 🔒 My Identity
- Archetype: Teamwork explorer
- Roles: Explorer, Investigator, Planner
- Working directory: C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\.agents\explorer_b11_1
- Original parent: 581a0694-537b-43e9-a9c3-4ff3d55486da (Conversation ID: 3c38a74a-c8ee-4510-a211-34d292a3c6ad)
- Milestone: Batch 11 - Audio & Voice Exploration

## 🔒 Key Constraints
- Read-only investigation — do NOT implement / modify source code or tests directly.
- Code only network mode (no external website access, no curl/wget/etc. to external URLs).
- Output implementation plan and analysis to C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\.agents\explorer_b11_1\handoff.md.

## Current Parent
- Conversation ID: 3c38a74a-c8ee-4510-a211-34d292a3c6ad (Caller: 581a0694-537b-43e9-a9c3-4ff3d55486da)
- Updated: 2026-06-30T15:20:06-07:00

## Investigation State
- **Explored paths**:
  * `prisma/schema.prisma`
  * `src/app/(main)/audio-rooms/page.tsx`
  * `src/app/api/servers/[id]/soundboard/route.ts`
  * `src/hooks/useVoice.ts`
  * `src/store/serverStore.ts`
  * `src/components/profile/ProfileSoundtrack.tsx`
  * `src/app/api/spotify/search/route.ts`
  * `server.ts`
  * `src/app/api/users/[id]/route.ts`
- **Key findings**:
  * Standalone global Live Audio Rooms (Clubhouse-style) are modeled via `AudioRoom`, `AudioRoomSpeaker`, and `AudioRoomListener` in Prisma.
  * Server Soundboards are modeled via `SoundboardSound` in Prisma, with `GET` and `POST` API routes established but `DELETE` missing.
  * Spotify Integration/Profile Anthems are supported by fields in the `User` model (`profileSoundtrack`, `profileSoundtrackVisible`) and are already integrated into the profile edit/header client flow.
  * Hand raising needs a boolean flag `handRaised` added to `AudioRoomListener`.
  * Podcasts, playlists, and transcripts do not exist in the DB schema or stubs. Propose new models `Podcast`, `PodcastEpisode`, `AudioPlaylist`, `AudioPlaylistTrack`, `AudioRoomTranscript`, `AudioRoomTranscriptSegment`.
  * Persistent background audio can be achieved by rendering a global `<audio>` wrapper in Next.js layout (`src/app/(main)/layout.tsx`) powered by a Zustand store.
- **Unexplored areas**: None.

## Key Decisions Made
- Wrote detailed implementation plan with database schema updates, Next.js REST routes, Socket.IO client-server events, and a draft integration test to `C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\.agents\explorer_b11_1\handoff.md`.

## Artifact Index
- C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\.agents\explorer_b11_1\handoff.md — Detailed analysis and implementation plan report.
