## 2026-06-30T15:37:20Z

You are the Server/Channel Remediation Specialist (Worker 2) for Batch 7.
Objective: Address the quality, safety, and security findings identified by the reviewers to finalize the implementation of the Discord-style Server/Channel Architecture.
Working directory: C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\.agents\worker_b7_remediation_1
Workspace: inherit

Input Materials:

- PROJECT.md at project root
- prisma/schema.prisma
- SCOPE.md at C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\.agents\orchestrator_gen5\SCOPE.md
- Worker Handoff: C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\.agents\worker_batch7\handoff.md
- Reviewer 1 Handoff (Code & API): C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\.agents\reviewer_batch7_1\handoff.md
- Reviewer 2 Handoff (UI & State): C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\.agents\reviewer_batch7_2\handoff.md

Tasks to execute:

1. **Zustand Store Fixes**: In 'src/store/serverStore.ts', update actions 'joinVoice' and 'joinStage' to accept and use the actual 'userId' of the current user, rather than hardcoding 'current-user-id'. Update hooks like 'useVoice' and 'useStage' to pass the actual 'userId' when joining.
2. **Radix Dialog & Accessibility**: In 'src/components/servers/ServerListSidebar.tsx' and 'src/components/servers/ChannelListSidebar.tsx', refactor custom overlays to use Radix UI Dialog primitives or the project's standard 'Modal' component ('src/components/ui/Modal.tsx'). Add descriptive 'aria-label' attributes to the menu toggles and icon-only buttons in 'ActiveChannelPanel.tsx'.
3. **Image Optimization**: Replace standard '<img>' tags in 'ServerListSidebar.tsx' with Next.js '<Image>' or the project's custom 'Avatar' component.
4. **React Hook Dependencies**: Fix all missing useEffect hook dependency warnings across 'ActiveChannelPanel.tsx', 'useChannel.ts', 'useServer.ts', 'useStage.ts', 'useVoice.ts'.
5. **Database Transaction safety**: Wrap the member role deletion and creation calls inside 'src/app/api/servers/[id]/members/route.ts' in a 'prisma.$transaction' to avoid partial role assignment states.
6. **Permissions & Hierarchy Gaps**:
   - Update 'src/lib/serverPermissions.ts' to optionally accept a 'channelId' parameter and evaluate channel-specific 'permissionOverwrites' overrides, merging them with the server-wide roles.
   - Enforce hierarchy validation in the members API:
     - In 'DELETE /api/servers/[id]/members' (kicking/banning), prevent kicking the server owner and prevent kicking members with higher or equal role positions compared to the requester.
     - In 'PATCH /api/servers/[id]/members' (role assignment), prevent assigning roles that are higher or equal in position to the requester's highest role.
7. **E2E REST API Testing**: Expand the E2E tests in 'tests/e2e_runner.js' to make actual HTTP requests (using fetch or an equivalent library) against the API endpoints to verify route authentication, parameter parsing, and role permissions boundaries, rather than just querying the database directly.
8. **Verify all checks**: Run type-checking ('npm run type-check'), linting ('npm run lint'), compile next.js production build ('npm run build'), and run the E2E tests ('node tests/e2e_runner.js'). Verify all tests pass cleanly. (Note: if you hit a Windows/OneDrive rename lock on 500.html, verify that the static compilation step itself succeeds without errors, and double check that the other compilation/type errors are resolved).
9. Write a detailed handoff report outlining all changes, file paths, API/UX improvements, and test logs to C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\.agents\worker_b7_remediation_1\handoff.md.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Completion Criteria: All remediation tasks completed, builds and lints compile cleanly, E2E tests pass, handoff.md is written, and message is sent back to the parent orchestrator (84de5cfe-bdcd-4bed-88e9-289ce528f772).
