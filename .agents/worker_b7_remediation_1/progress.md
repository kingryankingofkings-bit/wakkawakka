# Progress — Worker 2 Batch 7 Remediation

Last visited: 2026-06-30T15:50:20-07:00

## Status

- [x] Zustand Store Fixes: Updated actions to accept/use actual userId; updated hooks to pass actual userId.
- [x] Radix Dialog & Accessibility: Refactored ServerListSidebar and ChannelListSidebar custom overlays to use standard Modal component. Added aria-labels to ActiveChannelPanel.tsx and ChannelListSidebar.tsx.
- [x] Image Optimization: Replaced standard img with Next.js Image in ServerListSidebar.tsx.
- [x] React Hook Dependencies: Resolved all missing useEffect dependency warnings across hooks and components.
- [x] Database Transaction safety: Wrapped role updates in prisma.$transaction in members API.
- [x] Permissions & Hierarchy Gaps: Updated checkPermission to support channel-level overrides; enforced role position hierarchy in members API for patch (roles) and delete (kicks).
- [ ] E2E REST API Testing: Added HTTP REST API fetch tests to e2e_runner.js (spawning server, testing auth, hierarchy blocks).
- [ ] Verify all checks: Production build compilation and E2E test runs in progress.
