# Project: Wakka Wakka Feature Expansion (Batches 6-13)

## Architecture

Wakka Wakka is a Next.js 14 full-stack social media application using:

- **Database**: SQLite (development) with Prisma ORM.
- **Frontend**: Next.js App Router, Radix UI primitives, Tailwind CSS.
- **State Management**: Zustand stores.
- **Real-Time**: Socket.IO for interactive notifications and chat channels.
- **Testing**: Opaque-box E2E integration runner in Node.js.

## Code Layout

- `prisma/schema.prisma` - DB Models
- `src/app/api/` - REST APIs
- `src/app/(main)/` - UI Pages/Routes
- `src/components/` - Shared UI components
- `src/store/` - Zustand State stores
- `tests/e2e_runner.js` - Test Suite

## Milestones

| #   | Name                                 | Scope                                                                                                 | Dependencies | Status  |
| --- | ------------------------------------ | ----------------------------------------------------------------------------------------------------- | ------------ | ------- |
| M6  | Live Streaming & Video Platform      | Twitch/Kick style streams, chat, gifts, predictions, clips, VODs, category browse                     | None         | DONE    |
| M7  | Server/Channel Architecture          | Discord-style servers, role permissions, text/voice/forum/stage channels, boosts                      | M6           | DONE    |
| M8  | Professional & Jobs                  | LinkedIn-style profiles, job posting & search, company pages, InMail, learning, articles              | None         | DONE    |
| M9  | Forum & Voting                       | Reddit-style sub-communities, upvote/downvote/karma, awards, crosspost, AMA, moderation               | None         | PLANNED |
| M10 | Camera & AR                          | Snapchat/BeReal-style camera capture, mobile-only AR lenses, disappearing messages, memories, streaks | None         | PLANNED |
| M11 | Advanced Messaging                   | Telegram/WhatsApp-style bot framework, supergroups, sticker packs, broadlists, chat catalog/checkout  | None         | PLANNED |
| M12 | Content Management & Scheduling      | Content calendar dashboard, AI content copy generation, post recycling, queue, approvals              | None         | PLANNED |
| M13 | Remaining Improvements & Innovations | 100 innovations, mobile responsiveness polish, accessibility, performance audit                       | M6-M12       | PLANNED |

## Interface Contracts & Guidelines

- All new database models must be integrated into `prisma/schema.prisma` and applied via `prisma db push` / `prisma generate`.
- API endpoints must authenticate requests (using auth session/token patterns established in `src/app/api/auth`).
- No fake simulation panels that bypass DB/UI logic. All inputs must save to SQLite.
- AR lenses must be hidden/gated on desktop and show a mobile-only message.
