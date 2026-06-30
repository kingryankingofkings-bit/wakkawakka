---
name: information-architecture-planner
description: Use when planning the structure, navigation, and content organization of a website. Triggers on requests like "plan the site structure", "organize the pages", "design the navigation", "create a sitemap", or when moving from requirements to page-level planning. Produces a complete sitemap, navigation schema, and URL structure. Essential before any page design or frontend scaffolding begins.
---

# Information Architecture Planner

## Goal
Design clear, user-centered site structure, navigation, and URL organization that supports user goals and business objectives.

## Do Not Use When
- The site is a single page
- Structure is already defined and agreed upon
- The task is purely visual design

## Required Inputs To Inspect
- `project-brief.md` or requirements
- Reference sites and competitor structures
- User personas or audience descriptions
- SEO requirements (if any)
- Content inventory (if it exists)

## Workflow

1. **Identify top-level sections**: Based on user goals and audience needs
2. **Map page hierarchy**: Parent/child relationships
3. **Design navigation**: Primary, secondary, footer, utility nav
4. **Define URL structure**: Semantic, SEO-friendly paths
5. **Plan content types**: What content appears on each page type
6. **Map user flows**: Entry points → key actions → conversion
7. **Identify cross-links**: Related content connections
8. **Plan for scale**: How will this structure grow?

See `references/ia-patterns.md` for common IA patterns and `references/navigation-patterns.md` for navigation schemas.

## Output Format

Produce `information-architecture.md`:

```markdown
# Information Architecture: [Project]

## Sitemap
```
Home
├── About
│   ├── Team
│   └── Careers
├── Services
│   ├── Service A
│   └── Service B
└── Contact
```

## URL Structure
| Page | URL | Template |
|------|-----|----------|
| Home | / | home |
| About | /about | content-page |

## Navigation Schema
**Primary**: Home, About, Services, Contact
**Footer**: Privacy, Terms, Social links
**Utility**: Login, Language switcher

## User Flows
1. Landing → Service page → Contact form → Thank you
2. Home → About → Team member → Contact

## Content Types
- Landing page: Hero, features, CTA, testimonials
- Service page: Hero, description, features, pricing, CTA

## Cross-Links
- Service pages link to related services
- Team members link to relevant case studies
```

## Quality Checks
- [ ] Every page has a clear purpose
- [ ] Maximum 7 primary nav items
- [ ] URL structure is semantic and shallow (max 3 levels)
- [ ] User can reach any page in 3 clicks
- [ ] Mobile navigation is accounted for

## Safety Rules
- Do not create pages without a clear user purpose
- Avoid deep nesting (>3 levels)
- Never orphan pages (no way to navigate to them)

## Failure Handling
If content inventory is incomplete, design the IA for known content and flag gaps.

## Coordinates With
- `web-project-discovery` — for requirements
- `user-flow-and-conversion-planner` — for flow design
- `frontend-scaffold-builder` — to implement structure
