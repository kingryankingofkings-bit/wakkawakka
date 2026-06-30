## 2026-06-30T16:23:17Z
You are the Worker Agent for Batch 8: Professional & Jobs (LinkedIn-style).
Objective: Implement the full LinkedIn-style professional networking features, database schema updates, APIs, custom hooks, Socket.IO updates, and responsive frontend UI, then verify the changes.
Working directory: C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\.agents\worker_batch8_1
Workspace: inherit

Input Materials:
- PROJECT.md at project root
- prisma/schema.prisma
- SCOPE.md at C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\.agents\orchestrator_gen5\SCOPE.md
- Explorer 1 Handoff (DB & API): C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\.agents\explorer_batch8_1\handoff.md
- Explorer 2 Handoff (State & Socket): C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\.agents\explorer_batch8_2\handoff.md
- Explorer 3 Handoff (UI & Test): C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\.agents\explorer_batch8_3\handoff.md

Tasks to execute:
1. Update prisma/schema.prisma to support professional profiles on the User model (headline, workHistory, education, skills) and add models: Company, CompanyMember, CompanyFollower, Job, JobApplication, InMailMessage, Endorsement, Recommendation, LearningCourse, LearningEnrollment, and Article, with correct relations.
2. Sync SQLite database: run 'npx prisma db push' and run client generation 'npx prisma generate'.
3. Implement backend REST API endpoints under src/app/api/professional/ matching the routes detailed in Explorer 1's report (profile, companies, jobs, inmail, endorsements, recommendations, learning, and articles). Include appropriate authorization and transaction logic.
4. Implement Zustand state stores at src/store/professionalStore.ts (managing profile data, jobs, courses, and InMails) as designed in Explorer 2's report.
5. Update server.ts with Socket.IO event registrations for InMail messaging, real-time message sync, and alert synchronization for endorsements and job applications.
6. Create frontend pages under src/app/(main)/ (e.g. jobs, companies/[slug], learning, articles) and update user profile tabs to display work history, education, skills, endorsements list, and recommendations. Implement components using accessible Radix/Modal structures.
7. Update src/components/layout/Sidebar.tsx to add 'Jobs' and 'Learning' links.
8. Add Tier 2, Tier 3, and Tier 4 E2E integration tests to tests/e2e_runner.js that execute real HTTP fetch requests on a spawned server (to verify job application creations, premium InMail status restrictions, and course completion badges).
9. Verify implementation: run type-checking ('npm run type-check'), linting ('npm run lint'), compile next.js production build ('npm run build'), and run the E2E tests ('node tests/e2e_runner.js'). Verify all tests pass with exit code 0.
10. Write a detailed handoff report outlining all modified files, schema changes, API routes created, UI component layout, test output logs, and any caveats to C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\.agents\worker_batch8_1\handoff.md.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Completion Criteria: All features implemented, Next.js build compiles without type/lint errors, E2E tests pass successfully, handoff.md is written, and message is sent back to the parent orchestrator (84de5cfe-bdcd-4bed-88e9-289ce528f772).
