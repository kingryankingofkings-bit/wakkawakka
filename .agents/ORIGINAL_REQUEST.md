# Original User Request

## Initial Request — 2026-06-30T04:33:13Z

Implement all 1,082 features, 1,082 improvement proposals, and 100 innovative ideas from `social_media_feature_bible.md` into the Wakka social media platform — a Next.js 14 full-stack web application with Prisma ORM, Zustand state management, Radix UI components, Tailwind CSS, Socket.IO real-time messaging, and Firebase integration.

Working directory: C:\Users\Kingr\OneDrive\Documents\wakkawakka-local

Integrity mode: development

## Existing Codebase Architecture

The Wakka platform already has a substantial foundation:

**Stack**: Next.js 14 (App Router) · TypeScript · Prisma (PostgreSQL) · Zustand · Radix UI · Tailwind CSS · Socket.IO · Firebase · Framer Motion · React Query · Zod · react-hook-form

**Existing Routes** (18 main sections): feed, profile, messages, notifications, explore, communities, events, marketplace, shop, bookmarks, friends, analytics, audio-rooms, live, memories, pages, reels, settings

**Existing API Routes** (14 endpoints): admin, albums, communities, events, friends, marketplace, memories, notifications, pages, polls, posts, search, socket, users

**Existing State Stores**: authStore, cartStore, feedStore, messageStore, notificationStore, uiStore

**Existing Components**: commerce, feed, layout, messaging, profile, ui

**Database Schema**: Prisma schema at 43KB — already has substantial models

**Custom Workspace Skills**: 62 development skills available in `.agents/skills/` covering planning, frontend, backend, integration, debugging, testing, deployment, and research. Read the SKILL-PACK-README.md for a full inventory. For every batch, consult and use relevant skills by reading their SKILL.md files.

## Requirements

### R1. Full Feature Implementation from Feature Bible

Read and implement all 1,082 unique features documented in `social_media_feature_bible.md` Section 3 (Master Combined Feature List). Each feature must be usable, not merely present as dead code. Features span: content creation, feeds/algorithms, messaging/DMs, stories/ephemeral content, live streaming, monetization, creator tools, analytics, advertising, e-commerce, settings/toggles, accessibility, moderation/safety, verification, privacy controls, notifications, search/discovery, profile customization, groups/communities, audio, AI features, reactions/engagement, media editing, and third-party integrations.

### R2. Feature Improvement Integration

Implement all 1,082 improvement proposals from Section 4 (Feature Improvement Proposals). Each proposal specifies how Wakka Wakka's implementation should be superior to existing platforms. These improvements define the differentiated behavior of each feature.

### R3. Innovative Feature Ideas

Implement all 100 unique innovative feature ideas from Section 5 (100+ Unique Innovations). Each innovation includes a name, description, category, and impact rating (High/Medium/Low). Prioritize High-impact innovations in earlier batches.

### R4. Infrastructure and Architecture

Extend the existing Prisma schema, API routes, Zustand stores, React components, and Socket.IO handlers as needed. Create new database models, API endpoints, state management, UI components, and server-side logic required by the features. Preserve existing project conventions (file naming, component patterns, styling approach). Do not duplicate existing systems.

### R5. Batch-Based Implementation with Quality Gates

Work in logical batches grouped by feature domain (e.g., Authentication → Profiles → Content Creation → Feeds → Messaging → etc.). Build foundational systems before dependent features. After each batch, run type checking (`npm run type-check`), linting (`npm run lint`), and build verification (`npm run build`). Fix all issues before proceeding to the next batch.

### R6. Workspace Skills Utilization

For every batch, consult and use the relevant workspace skills from `.agents/skills/`. Skills include: `database-schema-designer`, `backend-api-architect`, `frontend-state-management`, `component-system-builder`, `authentication-authorization-builder`, `search-filter-sort-builder`, `file-upload-media-handler`, `accessibility-builder`, `responsive-layout-builder`, `performance-audit-optimizer`, `security-audit-reviewer`, `test-suite-builder`, and others. Re-assess which skills to utilize at the start of each batch.

### R7. Implementation Tracker

Maintain a live implementation tracker file (`implementation_tracker.md`) in the working directory. The tracker must list every feature/improvement/innovation with: ID, source section, assigned batch, status (Not Started / In Progress / Implemented / Tested / Blocked / Deferred), files changed, and notes. No item should disappear from the tracker.

### R8. GitHub Rules

Only commit and push to the `wakkawakka` repository (NOT the `moji` repository — that belongs to a different project and must never be touched). Use clear commit messages. Do not push until all planned batches are completed and verified.

## Acceptance Criteria

### Completeness

- [ ] All 1,082 features from Section 3 have been implemented or have a documented blocker/deferral reason
- [ ] All 1,082 improvements from Section 4 are reflected in the corresponding feature implementations
- [ ] All 100 innovations from Section 5 have been implemented or have a documented blocker/deferral reason
- [ ] The implementation tracker accounts for every single item with no gaps

### Code Quality

- [ ] `npm run type-check` passes with zero errors
- [ ] `npm run lint` passes with zero errors (or only pre-existing warnings)
- [ ] `npm run build` completes successfully
- [ ] No broken imports, dead code, or unused components introduced
- [ ] Existing functionality is not regressed

### Architecture

- [ ] Prisma schema changes are consistent and properly related
- [ ] API routes follow existing REST conventions
- [ ] Zustand stores follow existing patterns
- [ ] Components use Radix UI primitives and Tailwind CSS consistently
- [ ] Real-time features use the existing Socket.IO infrastructure

### Security and Safety

- [ ] Authentication and authorization are enforced on all protected routes and APIs
- [ ] User input is validated with Zod schemas
- [ ] Content moderation and safety features are functional
- [ ] Privacy controls respect user settings

### User Experience

- [ ] All new UI is responsive across desktop, tablet, and mobile
- [ ] Accessibility basics are met (keyboard navigation, ARIA labels, contrast)
- [ ] Navigation to all new features is discoverable from the main layout

### Repository

- [ ] All commits go to the `wakkawakka` repository only
- [ ] Commit messages clearly describe the changes
- [ ] No commits to the `moji` repository under any circumstances

## Follow-up — 2026-06-30T04:45:27Z

URGENT: The user reports the agents appear stuck. The orchestrator has completed planning (PROJECT.md is done) but hasn't spawned any workers yet. Stop deliberating and START EXECUTING immediately:

1. Spawn workers NOW for Milestone 1 (Baseline Verification & Tracker Setup)
2. Begin actual code implementation — the planning phase is done
3. Report back with concrete file changes, not just status updates

## Follow-up — 2026-06-30T07:42:35Z

You are an expert autonomous full-stack engineering agent. Your mission is to efficiently, safely, and seamlessly integrate hundreds of catalog features, catalog elements, catalog UI components, catalog workflows, and related improvements into the existing Wakka social media platform without breaking the current website/application.

Working directory: C:\Users\Kingr\OneDrive\Documents\wakkawakka-local

Integrity mode: development

## CRITICAL CONTEXT

The previous implementation attempt FAILED because it created fake "feature registry" and "console" components that simply listed features with "Implemented" badges instead of actually building real, functional, integrated features. Those components (FeatureRegistry.tsx, ProfileCommunityConsole.tsx, ContentFeedConsole.tsx, MessagingFeaturesConsole.tsx, CommerceToolsConsole.tsx, and their batch data files) are GARBAGE and must be REPLACED with real working features integrated into the actual site UI/UX.

Real implementation means:

- A "Reactions" feature = actual reaction buttons on posts that persist to the database
- A "Voice Messages" feature = an actual record button in chat that captures and sends audio
- A "Content Moderation" feature = actual report flows, review queues, and automated filters
- NOT a page that says "Voice Messages — Implemented"

## EXISTING CODEBASE

**Stack**: Next.js 14 (App Router) · TypeScript · Prisma (PostgreSQL) · Zustand · Radix UI · Tailwind CSS · Socket.IO · Firebase · Framer Motion · React Query · Zod · react-hook-form

**Existing Routes** (18 main sections): feed, profile, messages, notifications, explore, communities, events, marketplace, shop, bookmarks, friends, analytics, audio-rooms, live, memories, pages, reels, settings

**Existing API Routes** (14 endpoints): admin, albums, communities, events, friends, marketplace, memories, notifications, pages, polls, posts, search, socket, users

**Existing State Stores**: authStore, cartStore, feedStore, messageStore, notificationStore, uiStore

**Database Schema**: Prisma schema at `prisma/schema.prisma` (43KB)

**Custom Workspace Skills**: 62 development skills in `.agents/skills/` — READ the `SKILL-PACK-README.md` for full inventory. Use relevant skills for each batch.

**Feature Bible**: `social_media_feature_bible.md` (1.69MB) contains all 1,082 features, 1,082 improvements, and 100 innovations to implement.

## PRIMARY OBJECTIVE

Integrate all features from `social_media_feature_bible.md` into the existing project as REAL, FUNCTIONAL, INTEGRATED features. The integration must be complete, efficient, modular, maintainable, scalable, responsive, accessible, performance-conscious, consistent with the current codebase, and safe to deploy.

The final result should feel like these features were designed as part of the original product, not bolted on afterward.

## REQUIRED SOURCE REVIEW BEFORE CODING

Before writing or modifying code:

1. Read the existing codebase structure, components, API routes, Prisma schema, stores, types, and hooks
2. Read `social_media_feature_bible.md` to understand every feature that needs integration
3. Identify what already exists vs what needs to be built
4. Remove the fake catalog/registry components from the previous failed attempt

## BUILD A MASTER INTEGRATION INVENTORY

Create `integration_inventory.md` in the working directory. For each feature, record: ID, name, source section, description, user-facing behavior, required frontend/backend/schema/API changes, dependencies, complexity, risk, test requirements, acceptance criteria, status.

## DEPENDENCY-FIRST IMPLEMENTATION ORDER

1. Clean up fake catalog components from previous attempt
2. Analyze existing architecture thoroughly
3. Create integration inventory
4. Define shared types/interfaces/constants
5. Update Prisma schema for new data models needed
6. Implement backend API endpoints
7. Implement frontend data layer/hooks/state management
8. Implement core UI components integrated into existing pages
9. Implement navigation and routing changes
10. Implement search, filter, sort, pagination improvements
11. Implement detail pages and item-specific elements
12. Implement user interaction features (reactions, saves, shares, etc.)
13. Implement admin/moderation tools
14. Add loading, empty, and error states
15. Add accessibility, responsive, and performance fixes
16. Add/update tests
17. Run full regression review
18. Prepare final report
19. Commit only after final review passes

## BATCH WORKFLOW

Work in controlled batches. Each batch must contain a coherent set of features with shared dependencies. For every batch:

1. List exact inventory items included
2. Identify dependencies
3. Implement only that batch
4. Run type-check, lint, build
5. Review for missed requirements
6. Fix errors before continuing
7. Update inventory status
8. Summarize completed work

Do not move to next batch while current-batch blocking issues remain.

## CODE QUALITY RULES

- Use existing project patterns and conventions
- Prefer small reusable components over giant files
- Keep data logic separate from display logic
- No duplicate implementations
- No hardcoded values when constants/config are better
- Preserve existing routes, styling, auth patterns
- Use existing error/loading patterns
- Do not introduce unnecessary dependencies
- Do not rewrite unrelated code
- Do not break existing functionality

## WHAT "IMPLEMENTED" ACTUALLY MEANS

A feature is implemented when:

- The UI element exists in the correct page/component where users would naturally find it
- It has real interactivity (click handlers, form submissions, state changes)
- It persists data where appropriate (API calls, database writes)
- It reads and displays real data
- It handles loading, error, and empty states
- It works on mobile and desktop
- It respects permissions/auth where needed

A feature is NOT implemented if:

- It only exists in a registry/catalog listing
- It shows a badge saying "Implemented" without actual functionality
- It's just a type definition with no UI or API
- It's dead code that nothing references

## GIT AND COMMIT RULES

- Only commit and push to the `wakkawakka` repository
- NEVER touch or push to the `moji` repository
- Do not commit until all batches are implemented, tested, and reviewed
- Review the diff before committing
- Use clear commit messages

## FINAL REPORT

Provide: executive summary, total items identified/implemented/tested/blocked, batch summaries, files created/modified, schema changes, API changes, UI changes, tests added, commands run, known risks, recommended next steps.

## START NOW

Begin by inspecting the repository and all catalog materials. Then produce:

1. A concise codebase architecture summary
2. A master integration inventory
3. A dependency map
4. A batch implementation plan
5. The first implementation batch

## Follow-up — 2026-06-30T10:44:04Z

IMPORTANT: New requirements from the user's independent platform audit. You must account for these in your remaining batches:

## 13 Feature Gaps to Add

These real platform capabilities are NOT in the feature bible but MUST be implemented:

1. **Facebook Dating** — Secret Crush, Dating profile, Dating-specific Events → Needs its own /dating site section with swipe/match UI (combine with Bumble's matching system)
2. **Facebook Fundraisers** — Charitable fundraising with goal tracking and donation processing
3. **Facebook Gaming** — Gaming tab, instant games, tournaments
4. **Instagram Notes** — Lightweight text status above the DM inbox
5. **WhatsApp Flows** — Structured in-chat business workflows (forms, selections, confirmations within chat)
6. **WhatsApp ads in Status/Channels** — Monetization in update surfaces
7. **Telegram Mini Apps / WebApps** — Full app runtime embedded in chat (unique capability)
8. **Discord Activities** — Embedded multiplayer/social apps within channels (unique capability)
9. **Kick Bounties** — Viewer/creator/developer incentive/reward programs
10. **BeReal BTS** — Behind The Scenes clips showing seconds before daily capture
11. **Bluesky Labelers** — Modular third-party moderation and labeling system
12. **Threads Highlighter** — Spotlighting perspectives in trending conversations
13. **TikTok Green Screen Kit** — External apps feeding assets into content creation

## Apaya Correction

The Apaya research was WRONG. Apaya is an AI-powered social media management/automation platform. Real features:

- AI Brand Voice Learning (analyzes website for tone/colors/logo)
- AI Content Generation (captions, hashtags, branded graphics, carousels, videos)
- Bulk content production (full month of posts at once)
- Multi-platform scheduling (IG, FB, LinkedIn, X, TikTok, YouTube)
- Automated publishing
- Performance analytics
- Content calendar dashboard

This means Wakka needs a **Content Scheduling & Automation** section that covers both Apaya and Publer capabilities.

## Inflated Platform Notes

- Buz Voice Connects: Only verifiable features are push-to-talk, async playback, text/picture sharing. Don't build features that aren't real.
- Lemon8: Core identity (lifestyle content, templates, categories) is correct but some specific features may be over-specified.
- BAND: Core is correct (groups, posts, chat, calendar, polls, files) but some features may be unverifiable.

Add these gaps and corrections to your remaining batch plans. Do NOT skip them.

## Follow-up — 2026-06-30T13:40:39Z

You are continuing the real feature integration of the Wakka social media platform. Batches 1-5 are complete and committed (commit 84ae593). Your job is to continue from Batch 6 onwards.

Working directory: C:\Users\Kingr\OneDrive\Documents\wakkawakka-local

## WHAT'S ALREADY DONE (Batches 1-5)

- Batch 1: Database-backed reactions, voice messages, content moderation
- Batch 2: Private profiles, follow requests, communities, events, RSVP
- Batch 3: Ephemeral stories, feed ranking, nested comments, reels, hashtags, trending
- Batch 4: DMs, real-time typing/presence, E2E encryption, chat management
- Batch 5: Shopping cart/checkout, creator analytics, sponsored ads, webhooks, dating, fundraisers, gaming, scheduling, bounties, Instagram Notes, Bluesky Labelers, Threads Highlighter, BeReal BTS, TikTok Green Screen, WhatsApp Flows, Telegram Mini Apps, Discord Activities

## WHAT'S REMAINING

The feature bible at `social_media_feature_bible.md` has 1,082 features + 1,082 improvements + 100 innovations. The integration tracker at `integration_inventory.md` has ~620 entries mapped. You need to continue implementing the remaining features. Major areas still needed:

### Batch 6: Live Streaming & Video Platform

- Full live streaming infrastructure (Twitch/Kick/YouTube Live style)
- Stream chat with emotes, raids, hosts
- Bits/Cheers/Tips during streams
- Channel points and predictions
- Clips creation from live streams
- VODs (Video on Demand) archive
- Stream scheduling and go-live notifications
- Categories/browse for live content
- Co-streaming and multi-guest

### Batch 7: Server/Channel Architecture (Discord-style)

- Server creation with customizable settings
- Text, voice, and forum channels
- Role-based permissions system
- Server discovery/browse
- Thread channels within text channels
- Stage channels for presentations
- Server boosts and perks
- Custom emojis and soundboard per server

### Batch 8: Professional & Jobs (LinkedIn-style)

- Professional profile fields (work history, education, skills, endorsements)
- Job posting creation and search
- Company/organization pages
- Professional networking (InMail-style messaging)
- Endorsements and recommendations
- LinkedIn Learning-style content section
- Professional events and webinars
- Newsletter/article publishing

### Batch 9: Forum & Voting (Reddit-style)

- Subreddit-style topic communities with custom rules
- Upvote/downvote system with karma
- Post flairs and user flairs
- Award/gift system
- Wiki pages per community
- Crossposting between communities
- AMA (Ask Me Anything) format
- Mod tools: automod rules, mod queue, mod mail

### Batch 10: Camera & AR (Snapchat/BeReal-style)

- Camera-first capture experience
- AR lenses and face filters
- Snap Map / location sharing
- Disappearing content (view-once messages)
- Dual camera simultaneous capture
- Memory/archive vault
- Streaks tracking between friends
- Geofilters

### Batch 11: Advanced Messaging (Telegram/WhatsApp)

- Telegram-style bot framework (create, deploy, interact)
- Supergroup management (up to 200K members)
- Secret/disappearing chats
- Sticker packs (create, share, install)
- File sharing (large files)
- Broadcast lists
- Business profiles and catalogs in chat
- Payments/money transfer in chat

### Batch 12: Content Management & Scheduling (Publer/Apaya)

- Multi-platform content scheduling dashboard
- AI-powered content generation with brand voice
- Visual content calendar with drag-and-drop
- Bulk CSV upload for scheduled posts
- RSS-to-social automation
- Post recycling/evergreen queue
- Analytics per scheduled post
- Team approval workflows
- Competitor tracking

### Batch 13: Remaining Improvements & Innovations

- The 100 innovations from the bible
- Performance improvements across all features
- Accessibility improvements
- Mobile responsiveness polish
- SEO optimization
- Error handling standardization
- Loading/empty/error states for all features

## RULES

1. Read the existing codebase before coding. Understand what exists.
2. Each batch: analyze → code → verify (type-check, lint, build, E2E tests) → audit → next batch
3. Use real Prisma database integration. No mocks, no fake registries.
4. Features must be integrated into the actual site UI, not standalone pages that list features.
5. Do NOT commit or push. The main agent handles git.
6. Do NOT touch the moji repository.
7. Use existing project patterns and conventions.
8. No duplicate implementations.
9. Report progress after each batch completes.

## START

Begin with Batch 6 (Live Streaming & Video Platform). Read the codebase, plan, then implement.

## Follow-up — 2026-06-30T13:41:49Z

DESIGN REQUIREMENT: AR lenses and face filters (Batch 10 - Camera & AR) must be a MOBILE-ONLY feature. On desktop/web, the AR lens UI should either be hidden entirely or show a "Available on mobile" message directing users to the mobile app. Do not render the camera/AR capture interface on desktop viewports. Use responsive detection (e.g., screen width breakpoints or user-agent detection) to gate this feature to mobile devices only.
