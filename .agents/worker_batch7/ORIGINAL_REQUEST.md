## 2026-06-30T15:01:21Z

<USER_REQUEST>
You are the Worker Agent for Batch 7: Server/Channel Architecture.
Objective: Implement the full Discord-style Server/Channel Architecture feature set, verify the implementation, and report results.
Working directory: C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\.agents\worker_batch7
Workspace: inherit

Input Materials:

- PROJECT.md at project root
- prisma/schema.prisma
- SCOPE.md at C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\.agents\orchestrator_gen5\SCOPE.md
- Explorer 1 Handoff: C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\.agents\explorer_batch7_1\handoff.md
- Explorer 2 Handoff: C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\.agents\explorer_batch7_2\handoff.md
- Explorer 3 Handoff: C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\.agents\explorer_batch7_3\handoff.md

Tasks to execute:

1. Update prisma/schema.prisma with the Server, ServerMember, ServerRole, ServerChannel, ServerMessage, ServerBoost, SoundboardSound, CustomEmoji, and ServerChannelStageSpeaker models, plus relations on the User model.
2. Synchronize SQLite database schema: run 'npx prisma db push' and run client generation 'npx prisma generate'.
3. Implement backend REST API endpoints under src/app/api/servers/[id]/... (and related routes) matching the routes in Explorer 1's report. Enforce permission checking (e.g. using a checkPermission utility in API route handlers).
4. Implement Zustand store 'src/store/serverStore.ts' as outlined in Explorer 2's report.
5. Update 'server.ts' with Socket.IO listeners and broadcasts for server, channel message, voice state, soundboard, and stage queues.
6. Implement frontend pages at '/servers', '/servers/[id]', '/servers/[id]/[channelId]' using dynamic routing. Create components for ServerListSidebar, ChannelListSidebar, ActiveChannelPanel (with sub-views for TEXT, VOICE, FORUM, and STAGE channels), and MemberListSidebar. Ensure proper responsive drawer sheets for mobile views.
7. Update 'src/app/(main)/layout.tsx' to bypass max-w-2xl constraints and hide RightPanel for server paths. Update 'src/components/layout/Sidebar.tsx' to add 'Servers' link.
8. Append Tier 2, Tier 3, and Tier 4 E2E integration tests to 'tests/e2e_runner.js' as outlined in Explorer 3's report.
9. Verify implementation: run type-checking ('npm run type-check'), linting ('npm run lint'), compile next.js production build ('npm run build'), and run the E2E tests ('node tests/e2e_runner.js'). Verify all tests pass with exit code 0.
10. Write a detailed handoff report outlining all modified files, schema changes, API routes created, UI component layout, test output logs, and any caveats to C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\.agents\worker_batch7\handoff.md.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Completion Criteria: All features implemented, Next.js build compiles without type/lint errors, E2E tests pass successfully, handoff.md is written, and message is sent back to the parent orchestrator (84de5cfe-bdcd-4bed-88e9-289ce528f772).
</USER_REQUEST>
