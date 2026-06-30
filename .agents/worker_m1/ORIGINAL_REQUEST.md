## 2026-06-30T08:17:25Z

You are teamwork_preview_worker. Your working directory is C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\.agents\worker_m1.
Your task is to:

1. Delete the following fake mockup components and their data files:
   - src/components/settings/FeatureRegistry.tsx
   - src/components/settings/featuresData.ts
   - src/components/profile/ProfileCommunityConsole.tsx
   - src/components/profile/featuresBatch2Data.ts
   - src/components/feed/ContentFeedConsole.tsx
   - src/components/feed/batch3Data.ts
   - src/components/messaging/MessagingFeaturesConsole.tsx
   - src/components/messaging/batch4Data.ts
   - src/components/commerce/CommerceToolsConsole.tsx
   - src/components/commerce/batch5Data.ts
2. Edit all files that import or render these fake components to remove the imports and rendering. Refer to the list below:
   - src/app/(main)/analytics/page.tsx (remove CommerceToolsConsole import/render)
   - src/app/(main)/shop/page.tsx (remove CommerceToolsConsole import/render)
   - src/app/(main)/communities/page.tsx (remove ProfileCommunityConsole import/render)
   - src/components/profile/EditProfileModal.tsx (remove ProfileCommunityConsole import/render)
   - src/app/(main)/explore/page.tsx (remove ContentFeedConsole import/render)
   - src/app/(main)/feed/page.tsx (remove ContentFeedConsole import/render)
   - src/app/(main)/messages/page.tsx (remove MessagingFeaturesConsole import/render)
   - src/components/messaging/ChatWindow.tsx (remove MessagingFeaturesConsole import/render)
   - src/app/(main)/settings/page.tsx (remove FeatureRegistry import/render)
3. Modify the test in `tests/e2e_runner.js` (around line 93-97) to allow features in `implementation_tracker.md` to have status 'Not Started' or 'In Progress' as well as 'Implemented', so that our regression tests pass when we reset statuses for the real features.
4. Run `npm run type-check`, `npm run lint`, and `node tests/e2e_runner.js` to ensure the codebase compiles cleanly and all existing tests pass after the cleanup.
5. Create `integration_inventory.md` in the project root workspace directory (`C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\integration_inventory.md`). In this inventory, list the real features we are going to build in Batch 1:
   - Post & Message Reactions (incorporating DB persistence using Like and MessageReaction models)
   - Real Voice Messages (recording, upload, message save, playback UI)
   - Content Moderation & Reporting (report endpoint, admin moderation queue UI)
     Set status of these Batch 1 items in the inventory to "Not Started".
6. Write a handoff report in `C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\.agents\worker_m1\handoff.md` and message us when done.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT
hardcode test results, create dummy/facade implementations, or
circumvent the intended task. A Forensic Auditor will independently
verify your work. Integrity violations WILL be detected and your
work WILL be rejected.
