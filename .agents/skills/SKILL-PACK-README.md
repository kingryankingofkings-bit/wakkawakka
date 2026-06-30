# Antigravity Web Savant Pack — Complete Skill Pack Strategy

## A. Skill Pack Architecture

### Grouping Philosophy

The 61 skills are organized into 7 categories based on the web development lifecycle. This grouping prevents context bloat through Progressive Disclosure: only the metadata (name + description) of all skills loads initially; the full SKILL.md body loads only when a skill triggers. Heavy reference material lives in `references/` folders, loaded only when explicitly needed.

### Category Design

| Category | Count | Purpose |
|----------|-------|---------|
| Planning and Product | 7 | Discovery, architecture, requirements, task breakdown |
| Frontend | 11 | UI construction, accessibility, state, forms, animation |
| Backend and Data | 10 | APIs, databases, auth, caching, background jobs |
| Integration and Specialized | 8 | CMS, payments, analytics, SEO, admin, roles |
| Debugging, Testing, Review | 12 | Bug hunting, testing, code review, audits |
| Deployment and Operations | 8 | CI/CD, hosting, monitoring, backups, docs |
| Research and Anti-Hallucination | 5 | Doc verification, version checking, API contracts |

### Global vs Project Scope

**Global skills** (install to `~/.gemini/antigravity/skills/`):
- `current-docs-researcher`
- `package-version-verifier`
- `code-reviewer`
- `refactor-safety-planner`
- `bug-reproduction-debugger`
- `dependency-conflict-resolver`
- `build-error-fixer`

These are reusable across all projects regardless of tech stack.

**Project skills** (install to `<project-root>/.agents/skills/`):
- All planning skills (specific to the project)
- All frontend/backend/integration skills (specific to the stack)
- All deployment skills (specific to the infrastructure)

### Skill Coordination During Builds

Skills coordinate through:
1. **Document handoffs**: One skill produces a document (e.g., `project-brief.md`) that the next skill consumes
2. **Trigger chaining**: Completing one task naturally triggers another skill (e.g., after `web-project-discovery`, `information-architecture-planner` activates)
3. **Explicit coordinates**: Each skill's `Coordinates With` section specifies related skills

### Routing Conflict Prevention

- **Unique descriptions**: Each skill description is unique and precisely describes its trigger conditions
- **Do Not Use When**: Every skill includes explicit non-trigger conditions
- **No overlap**: Skills are designed to be mutually exclusive in their primary use cases
- **Hierarchical routing**: Planning skills trigger first; implementation skills trigger after planning completes

---

## B. Skill Inventory Table

| # | Skill Name | Directory | Category | Purpose | Trigger Description | Best Scope | Optional Assets | Related Skills |
|---|-----------|-----------|----------|---------|-------------------|------------|-----------------|----------------|
| 1 | web-project-discovery | planning-skills/web-project-discovery | Planning | Extract requirements from vague ideas | Starting new projects, unclear requirements | Project | project-brief template | requirements-to-build-plan, information-architecture-planner |
| 2 | requirements-to-build-plan | planning-skills/requirements-to-build-plan | Planning | Convert requirements to phased build plans | Requirements exist, need development plan | Project | build-plan template | web-project-discovery, task-breakdown-and-agent-handoff |
| 3 | information-architecture-planner | planning-skills/information-architecture-planner | Planning | Design site structure, navigation, URLs | Planning site structure, sitemap needed | Project | IA patterns, nav patterns | user-flow-and-conversion-planner, frontend-routing-navigation |
| 4 | user-flow-and-conversion-planner | planning-skills/user-flow-and-conversion-planner | Planning | Design user journeys and conversion funnels | Conversion goals, onboarding, funnels | Project | user-flows.md | information-architecture-planner, forms-validation-builder |
| 5 | stack-selection-advisor | planning-skills/stack-selection-advisor | Planning | Recommend tech stacks based on requirements | Choosing frameworks, databases, hosting | Project | stack-comparison-matrix.md | technical-architecture-planner |
| 6 | technical-architecture-planner | planning-skills/technical-architecture-planner | Planning | Design system architecture and data flow | System design, component communication | Project | architecture.md template | stack-selection-advisor, database-schema-designer |
| 7 | task-breakdown-and-agent-handoff | planning-skills/task-breakdown-and-agent-handoff | Planning | Decompose projects into assignable tasks | Parallel workstreams, agent coordination | Project | task-breakdown.md | requirements-to-build-plan |
| 8 | frontend-scaffold-builder | frontend-skills/frontend-scaffold-builder | Frontend | Initialize frontend projects with proper structure | New project setup, framework initialization | Project | framework commands ref | design-system-enforcer, responsive-layout-builder |
| 9 | responsive-layout-builder | frontend-skills/responsive-layout-builder | Frontend | Build mobile-first responsive layouts | Responsive design, breakpoint handling | Project | — | frontend-scaffold-builder, component-system-builder |
| 10 | component-system-builder | frontend-skills/component-system-builder | Frontend | Create reusable component hierarchies | Repeated UI patterns, component libraries | Project | — | design-system-enforcer, accessibility-builder |
| 11 | design-system-enforcer | frontend-skills/design-system-enforcer | Frontend | Establish token-based design systems | Consistent styling, brand colors, typography | Project | token-structure.md | component-system-builder, css-styling-architecture |
| 12 | css-styling-architecture | frontend-skills/css-styling-architecture | Frontend | Choose and configure CSS architecture | CSS approach decisions, styling conflicts | Project | — | design-system-enforcer, frontend-scaffold-builder |
| 13 | accessibility-builder | frontend-skills/accessibility-builder | Frontend | Implement WCAG-compliant accessible markup | ARIA, keyboard nav, screen reader support | Project | — | component-system-builder, forms-validation-builder |
| 14 | frontend-state-management | frontend-skills/frontend-state-management | Frontend | Design state architecture (server vs client) | Global state, data fetching, React Query/Zustand | Project | — | forms-validation-builder, frontend-scaffold-builder |
| 15 | frontend-routing-navigation | frontend-skills/frontend-routing-navigation | Frontend | Implement client-side routing and navigation | Page routing, dynamic routes, route guards | Project | — | information-architecture-planner, authentication-authorization-builder |
| 16 | forms-validation-builder | frontend-skills/forms-validation-builder | Frontend | Build validated, accessible forms | Form creation, input validation, submission | Project | — | accessibility-builder, backend-api-architect |
| 17 | animation-interaction-builder | frontend-skills/animation-interaction-builder | Frontend | Implement performant animations and interactions | Animations, transitions, scroll effects | Project | — | component-system-builder, performance-audit-optimizer |
| 18 | browser-compatibility-checker | frontend-skills/browser-compatibility-checker | Frontend | Test and fix cross-browser issues | Safari issues, mobile browsers, compatibility | Project | — | frontend-scaffold-builder, bug-reproduction-debugger |
| 19 | backend-api-architect | backend-skills/backend-api-architect | Backend | Design REST/GraphQL APIs with validation | API design, endpoints, request/response shapes | Project | — | database-schema-designer, authentication-authorization-builder |
| 20 | database-schema-designer | backend-skills/database-schema-designer | Backend | Design normalized database schemas | Data models, relationships, ORM schemas | Project | — | backend-api-architect, database-migration-safety |
| 21 | database-migration-safety | backend-skills/database-migration-safety | Backend | Execute safe schema changes with rollback | Schema changes, production migrations | Project | — | database-schema-designer, backup-rollback-planner |
| 22 | authentication-authorization-builder | backend-skills/authentication-authorization-builder | Backend | Implement auth, sessions, RBAC | Login, signup, OAuth, roles, permissions | Project | — | backend-api-architect, security-audit-reviewer |
| 23 | server-actions-and-api-routes | backend-skills/server-actions-and-api-routes | Backend | Implement server logic in fullstack frameworks | Next.js/Nuxt/SvelteKit server functions | Project | — | backend-api-architect, cache-and-data-fetching-strategy |
| 24 | file-upload-media-handler | backend-skills/file-upload-media-handler | Backend | Handle file uploads, image processing, storage | Uploads, images, S3/Cloudinary, media | Project | — | third-party-api-integration, backend-api-architect |
| 25 | email-notification-builder | backend-skills/email-notification-builder | Backend | Implement email delivery and notifications | Transactional emails, SendGrid/Resend, templates | Project | — | third-party-api-integration, background-jobs-and-queues |
| 26 | search-filter-sort-builder | backend-skills/search-filter-sort-builder | Backend | Implement search, filtering, sorting, pagination | Search bars, filters, query builders | Project | — | backend-api-architect, database-schema-designer |
| 27 | background-jobs-and-queues | backend-skills/background-jobs-and-queues | Backend | Implement async job processing | Queues, workers, scheduled jobs, retries | Project | — | email-notification-builder, monitoring-logging-setup |
| 28 | cache-and-data-fetching-strategy | backend-skills/cache-and-data-fetching-strategy | Backend | Design caching and data fetching optimization | React Query, Redis, CDN, SWR | Project | — | backend-api-architect, performance-audit-optimizer |
| 29 | cms-integration-builder | integration-skills/cms-integration-builder | Integration | Connect headless CMS platforms | Contentful, Sanity, Strapi, content editing | Project | — | third-party-api-integration, cache-and-data-fetching-strategy |
| 30 | ecommerce-payments-builder | integration-skills/ecommerce-payments-builder | Integration | Implement payments, carts, checkout | Stripe, PayPal, shopping, subscriptions | Project | — | third-party-api-integration, database-schema-designer |
| 31 | analytics-tracking-installer | integration-skills/analytics-tracking-installer | Integration | Install analytics with privacy compliance | GA4, Plausible, event tracking, GDPR | Project | — | frontend-routing-navigation |
| 32 | seo-structured-data-builder | integration-skills/seo-structured-data-builder | Integration | Implement SEO and structured data | Meta tags, JSON-LD, sitemaps, Open Graph | Project | — | information-architecture-planner, performance-audit-optimizer |
| 33 | third-party-api-integration | integration-skills/third-party-api-integration | Integration | Integrate external APIs and webhooks | API clients, SDKs, error handling, retries | Project | — | backend-api-architect, security-audit-reviewer |
| 34 | admin-dashboard-builder | integration-skills/admin-dashboard-builder | Integration | Build admin panels and data management UIs | Admin interfaces, data tables, CRUD | Project | — | role-permission-system-builder, search-filter-sort-builder |
| 35 | role-permission-system-builder | integration-skills/role-permission-system-builder | Integration | Implement RBAC and access control | User roles, permissions, feature flags | Project | — | authentication-authorization-builder, admin-dashboard-builder |
| 36 | maps-location-integrations | integration-skills/maps-location-integrations | Integration | Integrate maps and geolocation services | Google Maps, Mapbox, location features | Project | — | third-party-api-integration |
| 37 | bug-reproduction-debugger | debugging-skills/bug-reproduction-debugger | Debugging | Systematically reproduce and fix bugs | Bug reports, "not working", investigation | Global | — | console-network-error-diagnoser, test-suite-builder |
| 38 | console-network-error-diagnoser | debugging-skills/console-network-error-diagnoser | Debugging | Diagnose browser console and network errors | HTTP errors, CORS, 404, 500, failed requests | Global | — | bug-reproduction-debugger, security-audit-reviewer |
| 39 | test-suite-builder | debugging-skills/test-suite-builder | Debugging | Set up testing frameworks and write tests | Unit tests, e2e, Testing Library, coverage | Project | — | bug-reproduction-debugger, code-reviewer |
| 40 | visual-regression-reviewer | debugging-skills/visual-regression-reviewer | Debugging | Detect unintended visual changes | Layout shifts, CSS regressions, pixel check | Project | — | component-system-builder, css-styling-architecture |
| 41 | code-reviewer | debugging-skills/code-reviewer | Debugging | Review code for quality and issues | PR review, code quality assessment | Global | — | refactor-safety-planner, security-audit-reviewer |
| 42 | refactor-safety-planner | debugging-skills/refactor-safety-planner | Debugging | Plan safe refactoring with tests | Restructure, clean up, tech debt | Global | — | test-suite-builder, code-reviewer |
| 43 | dependency-conflict-resolver | debugging-skills/dependency-conflict-resolver | Debugging | Resolve npm dependency conflicts | Peer deps, version mismatch, install failures | Global | — | build-error-fixer, maintenance-update-planner |
| 44 | build-error-fixer | debugging-skills/build-error-fixer | Debugging | Fix build and compilation failures | Build failed, TypeScript errors, bundler issues | Global | — | dependency-conflict-resolver, typescript-type-debugger |
| 45 | security-audit-reviewer | debugging-skills/security-audit-reviewer | Debugging | Audit for security vulnerabilities | XSS, CSRF, SQL injection, hardening | Global | — | authentication-authorization-builder, deployment-preflight-checker |
| 46 | accessibility-audit-reviewer | debugging-skills/accessibility-audit-reviewer | Debugging | Audit for WCAG accessibility compliance | Screen reader testing, keyboard nav, contrast | Project | — | accessibility-builder, design-system-enforcer |
| 47 | performance-audit-optimizer | debugging-skills/performance-audit-optimizer | Debugging | Audit and optimize performance | Core Web Vitals, bundle size, lazy loading | Project | — | frontend-scaffold-builder, animation-interaction-builder |
| 48 | seo-audit-reviewer | debugging-skills/seo-audit-reviewer | Debugging | Audit technical SEO issues | Indexing, meta tags, structured data | Project | — | seo-structured-data-builder, performance-audit-optimizer |
| 49 | environment-config-manager | deployment-skills/environment-config-manager | Deployment | Manage env vars and secrets | .env setup, config validation, secrets | Project | — | deployment-preflight-checker, security-audit-reviewer |
| 50 | deployment-preflight-checker | deployment-skills/deployment-preflight-checker | Deployment | Verify readiness before production deploy | Go-live checklist, pre-deploy verification | Project | — | environment-config-manager, hosting-platform-deployer |
| 51 | ci-cd-pipeline-builder | deployment-skills/ci-cd-pipeline-builder | Deployment | Set up automated CI/CD pipelines | GitHub Actions, automated tests, deploy | Project | — | test-suite-builder, hosting-platform-deployer |
| 52 | hosting-platform-deployer | deployment-skills/hosting-platform-deployer | Deployment | Deploy to hosting platforms | Vercel, Netlify, Cloudflare, Railway | Project | platform-guides.md | deployment-preflight-checker, monitoring-logging-setup |
| 53 | monitoring-logging-setup | deployment-skills/monitoring-logging-setup | Deployment | Set up production monitoring and alerts | Error tracking, uptime, health checks | Project | — | hosting-platform-deployer, backup-rollback-planner |
| 54 | backup-rollback-planner | deployment-skills/backup-rollback-planner | Deployment | Plan backups and rollback procedures | Disaster recovery, data protection | Project | — | database-migration-safety, monitoring-logging-setup |
| 55 | maintenance-update-planner | deployment-skills/maintenance-update-planner | Deployment | Plan safe dependency updates | npm update, security patches, upgrades | Project | — | dependency-conflict-resolver, security-audit-reviewer |
| 56 | documentation-handoff-writer | deployment-skills/documentation-handoff-writer | Deployment | Write project documentation and handoff notes | README, API docs, developer guides | Project | — | technical-architecture-planner |
| 57 | current-docs-researcher | research-skills/current-docs-researcher | Research | Research current library/framework documentation | Verify APIs, check breaking changes | Global | docs sources list | package-version-verifier, all implementation skills |
| 58 | package-version-verifier | research-skills/package-version-verifier | Research | Verify package versions and compatibility | Version checking, peer deps, latest versions | Global | — | dependency-conflict-resolver, current-docs-researcher |
| 59 | api-contract-verifier | research-skills/api-contract-verifier | Research | Verify frontend-backend API contracts | Endpoint shapes, request/response validation | Project | — | backend-api-architect, bug-reproduction-debugger |
| 60 | framework-migration-researcher | research-skills/framework-migration-researcher | Research | Research framework migration paths | Version upgrades, framework switches | Global | — | refactor-safety-planner, compatibility-matrix-builder |
| 61 | compatibility-matrix-builder | research-skills/compatibility-matrix-builder | Research | Build dependency compatibility matrices | Peer deps, version combinations | Global | — | package-version-verifier, framework-migration-researcher |

---

## C. Master Workflow Recipes

### Recipe 1: Build a Simple Landing Page
**Skills**: web-project-discovery → stack-selection-advisor → frontend-scaffold-builder → responsive-layout-builder → design-system-enforcer → component-system-builder → seo-structured-data-builder → deployment-preflight-checker → hosting-platform-deployer
**Order**: Discovery → Stack → Scaffold → Layout → Styles → Components → SEO → Preflight → Deploy
**Checkpoints**: User approves design, User reviews staging
**Acceptance**: Loads fast, responsive, SEO-friendly

### Recipe 2: Build a Portfolio Website
**Skills**: web-project-discovery → information-architecture-planner → stack-selection-advisor → frontend-scaffold-builder → responsive-layout-builder → animation-interaction-builder → seo-structured-data-builder → hosting-platform-deployer
**Checkpoints**: User approves IA, User approves design, User reviews on staging

### Recipe 3: Build a Business Service Website
**Skills**: web-project-discovery → information-architecture-planner → user-flow-and-conversion-planner → stack-selection-advisor → frontend-scaffold-builder → design-system-enforcer → forms-validation-builder → seo-structured-data-builder → analytics-tracking-installer → hosting-platform-deployer
**Checkpoints**: User approves IA and flows, Contact form tested, Analytics verified

### Recipe 4: Build a SaaS Marketing Site
**Skills**: web-project-discovery → information-architecture-planner → user-flow-and-conversion-planner → stack-selection-advisor → frontend-scaffold-builder → design-system-enforcer → component-system-builder → forms-validation-builder → seo-structured-data-builder → analytics-tracking-installer → deployment-preflight-checker → hosting-platform-deployer
**Checkpoints**: User approves conversion flows, Pricing page reviewed, Signup flow tested

### Recipe 5: Build a Full-Stack App
**Skills**: web-project-discovery → requirements-to-build-plan → information-architecture-planner → stack-selection-advisor → technical-architecture-planner → database-schema-designer → frontend-scaffold-builder → backend-api-architect → authentication-authorization-builder → forms-validation-builder → test-suite-builder → deployment-preflight-checker → hosting-platform-deployer → monitoring-logging-setup
**Checkpoints**: Architecture approved, Schema approved, API contract verified, Auth working, Tests passing
**Acceptance**: End-to-end flows work, Auth secure, Tests pass, Monitoring active

### Recipe 6: Build an Ecommerce Site
**Skills**: web-project-discovery → information-architecture-planner → stack-selection-advisor → technical-architecture-planner → database-schema-designer → frontend-scaffold-builder → backend-api-architect → authentication-authorization-builder → ecommerce-payments-builder → forms-validation-builder → seo-structured-data-builder → analytics-tracking-installer → hosting-platform-deployer → monitoring-logging-setup
**Checkpoints**: Product catalog approved, Payment flow tested end-to-end, Order confirmation works
**Acceptance**: Purchase flow complete, Payments process, Orders tracked

### Recipe 7: Debug a Broken Website
**Skills**: bug-reproduction-debugger → console-network-error-diagnoser → (visual-regression-reviewer if visual) → test-suite-builder (add regression test)
**Order**: Reproduce → Check console/network → Fix → Verify → Add test
**Checkpoints**: Bug reproduced before fix, Verified after fix

### Recipe 8: Improve an Existing Website
**Skills**: performance-audit-optimizer → accessibility-audit-reviewer → seo-audit-reviewer → code-reviewer → refactor-safety-planner
**Order**: Audit → Review → Plan improvements → Refactor safely
**Checkpoints**: Audit results presented, User prioritizes improvements

### Recipe 9: Audit Accessibility
**Skills**: accessibility-audit-reviewer
**Output**: Audit report with severity labels and fix recommendations

### Recipe 10: Audit SEO
**Skills**: seo-audit-reviewer
**Output**: Technical SEO report with fix list

### Recipe 11: Audit Performance
**Skills**: performance-audit-optimizer
**Output**: Lighthouse scores, Core Web Vitals, optimization plan

### Recipe 12: Prepare for Production Deployment
**Skills**: deployment-preflight-checker → security-audit-reviewer → environment-config-manager
**Output**: Deployment readiness report

### Recipe 13: Migrate from One Stack to Another
**Skills**: framework-migration-researcher → requirements-to-build-plan → stack-selection-advisor → refactor-safety-planner → test-suite-builder
**Checkpoints**: Migration path approved, Phased plan reviewed, Rollback tested

### Recipe 14: Add Authentication to an Existing Project
**Skills**: authentication-authorization-builder → forms-validation-builder → frontend-routing-navigation (route guards) → test-suite-builder
**Checkpoints**: Auth flow tested, Protected routes verified

### Recipe 15: Add Payments to an Existing Project
**Skills**: ecommerce-payments-builder → backend-api-architect (webhooks) → test-suite-builder
**Checkpoints**: Payment flow tested with test cards, Webhooks verified

### Recipe 16: Add CMS/Admin Editing
**Skills**: cms-integration-builder → admin-dashboard-builder → role-permission-system-builder
**Checkpoints**: Content editing works, Admin access controlled

### Recipe 17: Convert Rough User Notes into a Working Website
**Skills**: web-project-discovery → requirements-to-build-plan → (remaining skills from appropriate recipe)
**Approach**: Treat notes as discovery input, produce structured brief first

### Recipe 18: Turn a Figma/Design Reference into Production Code
**Skills**: design-system-enforcer (extract tokens) → component-system-builder → responsive-layout-builder → animation-interaction-builder
**Approach**: Extract design tokens first, then build component system, then pages

---

## D. Validation Rubric

Score each criterion 1-5. Target average >= 4.0.

| Criterion | 1 (Poor) | 3 (Acceptable) | 5 (Excellent) |
|-----------|----------|----------------|---------------|
| **Routing Clarity** | Vague descriptions, frequent misfires | Most skills trigger correctly | Every skill triggers precisely, never misfires |
| **Coverage** | Major gaps in lifecycle | Covers main phases | Complete lifecycle coverage, no gaps |
| **Non-Overlap** | Multiple skills trigger for same task | Some overlap, manageable | Clean boundaries, no redundant triggers |
| **Concision** | Bloated SKILL.md files | Under 500 lines each | Lean, reference-heavy, optimal token usage |
| **Implementation Usefulness** | Generic advice only | Some concrete steps | Exact commands, file paths, patterns |
| **Safety** | No safety rules | Basic warnings | Comprehensive safety, rollback, checkpoints |
| **Debugging Depth** | Surface-level only | Common issues covered | Systematic diagnosis, common errors catalogued |
| **Production Readiness** | Toy/demo quality | Basic production checks | Comprehensive preflight, monitoring, backups |
| **Framework Neutrality** | Locked to one stack | Major frameworks covered | 10+ frameworks with specific guidance |
| **Modern Stack Support** | Outdated patterns | Current major versions | Latest stable versions, cutting-edge where appropriate |
| **Anti-Hallucination** | No verification steps | Some doc references | Mandatory research gates, version verification |
| **Agentic Workflow Quality** | Single-step tasks only | Some multi-step flows | Full pipeline orchestration, handoff documents |
| **Maintainability** | Hard to update | Structured, somewhat maintainable | Clear templates, easy to extend and version |

---

## E. Packaging Instructions

### Installation

**Global installation** (skills available across all projects):
```bash
# Copy each skill folder to global skills directory
cp -r planning-skills/web-project-discovery ~/.gemini/antigravity/skills/
cp -r frontend-skills/frontend-scaffold-builder ~/.gemini/antigravity/skills/
# ... repeat for all desired skills
```

**Project installation** (skills specific to one project):
```bash
mkdir -p .agents/skills
cp -r planning-skills/web-project-discovery .agents/skills/
# ... copy relevant skills for the project
```

### Testing Routing

After installation, test that skills activate correctly:

1. Start a new conversation in Antigravity
2. Ask: "I want to build a website for my business" → Should trigger `web-project-discovery`
3. Ask: "What stack should I use?" → Should trigger `stack-selection-advisor`
4. Ask: "Make this responsive" → Should trigger `responsive-layout-builder`
5. Ask: "Add login" → Should trigger `authentication-authorization-builder`
6. Ask: "Fix this bug" → Should trigger `bug-reproduction-debugger`

If a skill doesn't trigger, refine its description field for better semantic matching.

### Update/Versioning Strategy

1. **Version the pack**: Tag releases (v1.0.0, v1.1.0)
2. **Document changes**: Keep a CHANGELOG at the pack level
3. **Test before updating**: Verify updated skills trigger correctly
4. **Gradual rollout**: Update skills one category at a time
5. **Feedback loop**: Note which skills trigger correctly and which need description tuning

### Preventing Stale Behavior

1. **Research gates**: Implementation skills require doc verification
2. **Version verification**: `package-version-verifier` checks installed versions
3. **Compatibility checks**: `compatibility-matrix-builder` verifies combinations
4. **Changelog monitoring**: `current-docs-researcher` checks for breaking changes
5. **Scheduled audits**: Use `maintenance-update-planner` for periodic reviews

---

## F. Skill Pack Directory Structure

```
antigravity-web-savant-pack/
├── SKILL-PACK-README.md          (this document)
├── planning-skills/
│   ├── web-project-discovery/
│   │   └── SKILL.md
│   ├── requirements-to-build-plan/
│   │   └── SKILL.md
│   ├── information-architecture-planner/
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── ia-patterns.md
│   │       └── navigation-patterns.md
│   ├── user-flow-and-conversion-planner/
│   │   └── SKILL.md
│   ├── stack-selection-advisor/
│   │   ├── SKILL.md
│   │   └── references/
│   │       └── stack-comparison-matrix.md
│   ├── technical-architecture-planner/
│   │   └── SKILL.md
│   └── task-breakdown-and-agent-handoff/
│       └── SKILL.md
├── frontend-skills/
│   ├── frontend-scaffold-builder/
│   │   ├── SKILL.md
│   │   └── references/
│   │       └── framework-scaffold-commands.md
│   ├── responsive-layout-builder/
│   │   └── SKILL.md
│   ├── component-system-builder/
│   │   └── SKILL.md
│   ├── design-system-enforcer/
│   │   ├── SKILL.md
│   │   └── references/
│   │       └── token-structure.md
│   ├── css-styling-architecture/
│   │   └── SKILL.md
│   ├── accessibility-builder/
│   │   └── SKILL.md
│   ├── frontend-state-management/
│   │   └── SKILL.md
│   ├── frontend-routing-navigation/
│   │   └── SKILL.md
│   ├── forms-validation-builder/
│   │   └── SKILL.md
│   ├── animation-interaction-builder/
│   │   └── SKILL.md
│   └── browser-compatibility-checker/
│       └── SKILL.md
├── backend-skills/
│   ├── backend-api-architect/
│   │   └── SKILL.md
│   ├── database-schema-designer/
│   │   └── SKILL.md
│   ├── database-migration-safety/
│   │   └── SKILL.md
│   ├── authentication-authorization-builder/
│   │   └── SKILL.md
│   ├── server-actions-and-api-routes/
│   │   └── SKILL.md
│   ├── file-upload-media-handler/
│   │   └── SKILL.md
│   ├── email-notification-builder/
│   │   └── SKILL.md
│   ├── search-filter-sort-builder/
│   │   └── SKILL.md
│   ├── background-jobs-and-queues/
│   │   └── SKILL.md
│   └── cache-and-data-fetching-strategy/
│       └── SKILL.md
├── integration-skills/
│   ├── cms-integration-builder/
│   │   └── SKILL.md
│   ├── ecommerce-payments-builder/
│   │   └── SKILL.md
│   ├── analytics-tracking-installer/
│   │   └── SKILL.md
│   ├── seo-structured-data-builder/
│   │   └── SKILL.md
│   ├── third-party-api-integration/
│   │   └── SKILL.md
│   ├── admin-dashboard-builder/
│   │   └── SKILL.md
│   ├── role-permission-system-builder/
│   │   └── SKILL.md
│   └── maps-location-integrations/
│       └── SKILL.md
├── debugging-skills/
│   ├── bug-reproduction-debugger/
│   │   └── SKILL.md
│   ├── console-network-error-diagnoser/
│   │   └── SKILL.md
│   ├── test-suite-builder/
│   │   └── SKILL.md
│   ├── visual-regression-reviewer/
│   │   └── SKILL.md
│   ├── code-reviewer/
│   │   └── SKILL.md
│   ├── refactor-safety-planner/
│   │   └── SKILL.md
│   ├── dependency-conflict-resolver/
│   │   └── SKILL.md
│   ├── build-error-fixer/
│   │   └── SKILL.md
│   ├── security-audit-reviewer/
│   │   └── SKILL.md
│   ├── accessibility-audit-reviewer/
│   │   └── SKILL.md
│   ├── performance-audit-optimizer/
│   │   └── SKILL.md
│   └── seo-audit-reviewer/
│       └── SKILL.md
├── deployment-skills/
│   ├── environment-config-manager/
│   │   └── SKILL.md
│   ├── deployment-preflight-checker/
│   │   └── SKILL.md
│   ├── ci-cd-pipeline-builder/
│   │   └── SKILL.md
│   ├── hosting-platform-deployer/
│   │   ├── SKILL.md
│   │   └── references/
│   │       └── platform-guides.md
│   ├── monitoring-logging-setup/
│   │   └── SKILL.md
│   ├── backup-rollback-planner/
│   │   └── SKILL.md
│   ├── maintenance-update-planner/
│   │   └── SKILL.md
│   └── documentation-handoff-writer/
│       └── SKILL.md
└── research-skills/
    ├── current-docs-researcher/
    │   └── SKILL.md
    ├── package-version-verifier/
    │   └── SKILL.md
    ├── api-contract-verifier/
    │   └── SKILL.md
    ├── framework-migration-researcher/
    │   └── SKILL.md
    └── compatibility-matrix-builder/
        └── SKILL.md
```

---

*Generated for Google Antigravity 2.0 Agent Skills. Verify format against latest Antigravity documentation before installation.*
