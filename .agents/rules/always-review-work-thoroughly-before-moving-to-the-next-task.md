---
trigger: always_on
---

1. Treat the user request as the binding task contract.
2. Treat repository files, docs, configs, schemas, tests, and code as truth.
3. Never invent files, APIs, routes, components, env vars, configs, tests, screenshots, or results.
4. Inspect before editing. Search before assuming. Verify before claiming.
5. Prefer small correct patches over broad rewrites.
6. Never alter unrelated behavior, style, structure, copy, dependencies, or config.
7. Preserve architecture unless the task requires architectural change.
8. Tie each change to a requirement, bug, failing check, or repo pattern.
9. Complete one coherent unit before starting another.
10. Leave no TODOs, placeholders, fake data, debug logs, unused code, or dead paths.
11. Never claim completion before implementation, review, and validation.
12. If incomplete, state what is done, what remains, and why.

## Anti-Drift
13. Re-read the request before planning, coding, review, and final response.
14. Convert the task into a checklist and resolve every item.
15. Never expand scope because a related idea seems useful.
16. Never replace the requested solution with a different product idea.
17. Preserve exact names, labels, URLs, numbers, routes, colors, copy, and limits.
18. Priority: user request, project rules, repo docs, existing code, best practice.
19. Classify new issues as blocking, related, or unrelated. Fix only blocking or related issues.
20. Do not refactor during feature work unless required.
21. Do not rename, relocate, redesign, or restyle unless requested.
22. Never silently drop a requirement.
23. Mark each requirement done, blocked, impossible, or out of scope.
24. Review each batch before moving to the next.
25. Avoid formatting churn outside touched code.
26. Do not clean unrelated files.

## Anti-Hallucination
27. Verify framework, language, package manager, router, state, styling, tests, and deployment.
28. Verify dependencies in package files and imports before use.
29. Verify schemas in models, migrations, validators, generated types, and contracts.
30. Verify endpoints, hooks, helpers, services, and components by repo search.
31. Verify env vars in configs, examples, docs, and runtime usage.
32. Never invent credentials, keys, IDs, events, migrations, or provider behavior.
33. Never say tests passed unless the command ran and passed.
34. Never say UI was verified unless rendered, tested, or checked against real code.
35. If validation cannot run, say why and list static checks.
36. Use exact file names, commands, routes, functions, and components in reports.
37. When uncertain, inspect more rather than guessing.
38. Distinguish confirmed facts from assumptions.

## Repo Inspection
39. Read README, scripts, configs, docs, and relevant source before edits.
40. Search for similar features and follow their patterns.
41. Reuse existing components, hooks, utilities, services, types, constants, and schemas first.
42. Inspect callers and callees before changing shared code.
43. Trace data from UI to state, validation, API, server, database, response, and render.
44. Before deleting code, confirm no references depend on it.
45. Before renaming code, update every reference.
46. Never duplicate utilities, components, types, styles, or data-access logic.
47. Never edit generated files unless the repo expects it.
48. Never create new folders when an existing convention fits.
49. Never assume a file path. Confirm it exists.
50. Check import aliases, module boundaries, and barrel exports before imports.

## Planning
51. Write a short plan for tasks touching multiple files, flows, or checks.
52. Define success criteria before editing.
53. For bugs, reproduce or trace the failure before patching.
54. For features, map user flow, data flow, permissions, edge states, and validation.
55. For refactors, preserve behavior and prove equivalence.
56. Split large work into types, data, API, UI, integration, validation, and cleanup.
57. Do not start coding without target files and affected paths.
58. Handle risky changes in small reversible steps.

## Code Quality
59. Match repo style, naming, import order, formatting, and organization.
60. Write clear maintainable code.
61. Use strict types.
62. Avoid careless any, broad casts, ignored errors, and unsafe narrowing.
63. Keep functions and components focused.
64. Avoid side effects in renders, selectors, computed values, and hooks.
65. Never mutate UI state directly.
66. Handle loading, success, empty, error, and permission states for async UI.
67. Use constants for meaningful repeated values.
68. Keep business logic out of presentation when repo patterns support it.
69. Avoid global state unless the repo already uses it for the same concern.
70. Remove unused imports, variables, files, logs, comments, and dead code.
71. Never disable lint, typecheck, validation, auth, or tests to pass.
72. Comment only intent, constraints, or non-obvious choices.
73. Do not hide broken logic behind broad try/catch.
74. Do not swallow errors silently.
75. Do not over-abstract before a pattern repeats.
76. Keep public function signatures stable unless callers are updated.

## Frontend UI
77. Match components, tokens, spacing, typography, colors, radii, shadows, breakpoints, and icons.
78. Never introduce a new visual language unless requested.
79. Use semantic HTML before generic containers.
80. Buttons perform actions. Links navigate.
81. Interactive elements need keyboard, focus, disabled, hover, active, and screen-reader behavior.
82. Forms need labels, validation, errors, required states, and sane keyboard flow.
83. Modals, drawers, popovers, menus, and tooltips must follow existing focus and close behavior.
84. Build responsive states for mobile, tablet, desktop, and wide screens.
85. Never hide broken layouts with overflow hacks.
86. Avoid layout shift; reserve space for async content when practical.
87. Empty states must explain what happened and what action exists.
88. Error states must be useful and must not leak internals.
89. Respect dark mode, themes, reduced motion, localization, and brand variants.
90. Do not add animation that harms usability, accessibility, or performance.
91. New UI must cover relevant loading, empty, error, success, disabled, and unauthorized states.
92. Do not render private data before permission checks resolve.
93. Maintain consistent navigation, breadcrumbs, tabs, filters, and active states.

## Styling
94. Use the repository styling system only.
95. Never mix styling systems without precedent.
96. Prefer design tokens over hardcoded colors, spacing, radii, shadows, fonts, and z-index values.
97. Avoid !important unless overriding third-party code with no clean option.
98. Maintain accessible contrast.
99. Avoid brittle absolute positioning unless layout truly requires it.
100. Do not create one-off CSS when a shared component, token, utility, or variant exists.
101. Keep responsive rules consistent with existing breakpoints.

## Backend and API
102. Validate all inputs at the server boundary.
103. Never trust client validation alone.
104. Preserve API contracts unless explicitly changing them.
105. Update every caller when changing a contract.
106. Check auth, ownership, role, tenant, and permission before protected reads or writes.
107. Use existing error patterns and meaningful status codes.
108. Never leak secrets, tokens, stack traces, internal IDs, or sensitive data.
109. Make writes atomic when partial failure could corrupt state.
110. Avoid N+1 queries.
111. Paginate unbounded lists.
112. Sanitize or escape user content where rendering requires it.
113. Keep server-only code out of client bundles.
114. Never call private APIs from the browser.
115. Never place network calls in hot render paths.
116. Cache only when invalidation is clear.
117. Match migration style before adding migrations.
118. Treat webhooks as hostile and verify signatures.
119. Do not weaken CORS, CSP, cookies, CSRF, auth, or permissions.

## State and Routing
120. Identify the single source of truth for each state value.
121. Never duplicate server state locally unless necessary.
122. Keep shareable filter, pagination, tab, and search state in the URL when appropriate.
123. Keep form state local unless shared state is required.
124. Reset state on user, route, tenant, workspace, or permission changes.
125. Guard against async race conditions and stale responses.
126. Cancel, ignore, or reconcile outdated requests.
127. Handle optimistic updates with rollback.
128. Never persist secrets or sensitive data in browser storage.
129. Never preserve unsafe state across logout.
130. Follow existing router and route conventions.
131. Never invent route paths.
132. Validate route params.
133. Protect private routes on client and server where applicable.
134. Handle not-found, unauthorized, loading, redirect, metadata, breadcrumbs, and active nav states.

## Forms and Accessibility
135. Validate required fields, formats, types, min/max limits, and cross-field rules.
136. Prevent duplicate submissions.
137. Preserve input after recoverable errors.
138. Clear form state only after confirmed success.
139. Never send fields the API does not expect.
140. Use existing form libraries, schemas, and validation patterns.
141. Show field-level errors where possible.
142. Handle server validation errors without losing user input.
143. Use semantic landmarks, headings, labels, and roles correctly.
144. Keep heading order logical.
145. Ensure controls are keyboard reachable with visible focus.
146. Use ARIA only when semantic HTML is insufficient.
147. Never rely on color alone for meaning.
148. Respect screen readers and reduced-motion preferences.
149. Test interactive flows without a mouse when possible.

## Performance and Dependencies
150. Avoid unnecessary client rendering when server or static rendering fits.
151. Never load large libraries for small jobs.
152. Avoid large synchronous main-thread work.
153. Avoid re-render storms from unstable props, broad context, or careless subscriptions.
154. Use pagination, virtualization, streaming, memoization, or chunking for large data when appropriate.
155. Add dependencies only when existing code cannot reasonably solve the problem.
156. Check license, maintenance, bundle cost, compatibility, and overlap first.
157. Use the repository package manager and lockfile.
158. Never update unrelated dependencies.

## Testing and Completion
159. Add or update tests for new logic, bug fixes, critical UI behavior, and changed contracts.
160. Use existing test tools and patterns.
161. Test behavior, not implementation details.
162. Cover success, failure, empty, permission, and edge cases where relevant.
163. Add regression tests for bugs when practical.
164. Never delete failing tests unless obsolete and explained.
165. Never loosen assertions just to pass.
166. Run smallest relevant tests first, then broader checks.
167. Run typecheck, lint, unit tests, integration tests, and build when relevant.
168. If failures are pre-existing, prove separation and report clearly.
169. If checks cannot run, report exact command, failure, and limitation.
170. Read full errors before fixing.
171. Identify root cause, not symptom.
172. Use temporary logs only to diagnose; remove them before final.
173. Never patch around a failing invariant. Fix the invariant.
174. Review every edited file and remove accidental edits.
175. Confirm imports resolve, types match data, UI states exist, errors are handled, and security holds.
176. Confirm no debug logs, fake data, placeholders, commented-out code, or unrelated files remain.
177. State what changed, what was validated, what is incomplete, and blockers.
178. If the user required a format, obey it exactly.
179. Agent will review work, even small edits, to ensure completion and functionality before claiming it is finished. 
180. Never prioritize speed over correctness, verification, security, accessibility, or user-specified