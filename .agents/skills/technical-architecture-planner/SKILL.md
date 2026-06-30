---
name: technical-architecture-planner
description: Use when designing the technical architecture of web applications, planning system components, defining data flow, or making structural decisions about how pieces fit together. Triggers on requests like "design the architecture", "plan the system", "how should the components communicate", "design the data flow", or after stack selection when planning implementation structure. Produces architecture diagrams, component definitions, and integration specifications.
---

# Technical Architecture Planner

## Goal

Design robust, scalable technical architecture with clear component boundaries, data flow, and integration patterns.

## Do Not Use When

- Architecture is already defined
- The project is a simple static site
- Making technology choices (use `stack-selection-advisor` first)

## Required Inputs To Inspect

- `project-brief.md` for requirements
- `stack-recommendation.md` for chosen stack
- `information-architecture.md` for page structure
- Performance and scaling requirements
- Security and compliance requirements

## Workflow

1. **Define system boundaries**: What's in scope? What's external?
2. **Identify components**: Frontend, backend, database, cache, storage, external services
3. **Design data flow**: How does data move between components?
4. **Define APIs**: Internal and external API contracts
5. **Plan state management**: Where does state live? How is it synchronized?
6. **Design authentication flow**: Sessions, JWT, OAuth — which pattern?
7. **Plan for security**: Auth, authorization, input validation, CORS, CSP
8. **Plan for scaling**: Caching, CDN, database scaling, horizontal scaling
9. **Define deployment units**: What deploys together? What separately?
10. **Document decisions**: Why each decision was made

## Output Format

Produce `technical-architecture.md`:

```markdown
# Technical Architecture: [Project]

## System Overview

[High-level description with component diagram in ASCII or Mermaid]

## Components

### Frontend

- Framework:
- Key libraries:
- State management:

### Backend

- Framework:
- API style:
- Key endpoints:

### Database

- Primary:
- Cache:
- File storage:

### External Services

- Auth provider:
- Payment processor:
- Email service:

## Data Flow
```

User → CDN → Frontend → API → Database
↓
External Services

```

## API Design
### Auth
- POST /api/auth/login
- POST /api/auth/register

### Core Resources
- GET /api/resources
- POST /api/resources

## State Management
- Server state: React Query / SWR
- Client state: Zustand / Context
- Form state: React Hook Form

## Security
- Auth: JWT with httpOnly cookies
- Authorization: RBAC
- Input validation: Zod
- CORS: Whitelist origins

## Scaling Strategy
- Database: Read replicas, connection pooling
- Static assets: CDN
- API: Serverless auto-scaling
- Cache: Redis for sessions and hot data

## Deployment
- Frontend: [Platform]
- Backend: [Platform]
- Database: [Platform]
```

## Quality Checks

- [ ] Every component has a clear responsibility
- [ ] Data flow has no circular dependencies
- [ ] Security is addressed at every layer
- [ ] Failure modes are considered
- [ ] Scaling bottlenecks are identified

## Safety Rules

- Do not over-engineer for hypothetical scale
- Do not ignore security fundamentals
- Prefer simple architectures that can evolve

## Coordinates With

- `stack-selection-advisor` — for technology choices
- `database-schema-designer` — for data model details
- `backend-api-architect` — for API implementation
