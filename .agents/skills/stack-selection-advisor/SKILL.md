---
name: stack-selection-advisor
description: Use when choosing technology stacks for web projects, evaluating frameworks, or making architectural technology decisions. Triggers on questions like "what stack should I use", "React or Vue", "Next.js or Astro", "which database", "hosting recommendations", or when starting a new project where technology choices are undecided. Provides framework-aware recommendations based on project requirements, team skills, and constraints. Not for debugging specific framework issues.
---

# Stack Selection Advisor

## Goal

Recommend optimal technology stacks based on project requirements, constraints, and team context.

## Do Not Use When

- Stack is already decided and implemented
- The question is about a specific framework's syntax or API
- The project is constrained to an existing tech stack

## Required Inputs To Inspect

- `project-brief.md` for requirements
- Team experience and preferences
- Performance requirements (latency, throughput)
- Scaling needs (users, data, traffic)
- Budget constraints
- Hosting/deployment constraints
- Integration requirements (third-party APIs)

## Workflow

1. **Identify project type**: Static site, SPA, SSR app, full-stack, API-only
2. **List must-have capabilities**: Real-time, SEO, CMS, auth, payments, etc.
3. **Evaluate frontend options**: Match capabilities to framework strengths
4. **Evaluate backend options**: Match to data model, scale, team skills
5. **Evaluate database options**: Relational vs document vs both
6. **Evaluate hosting options**: Serverless, VPS, container, edge
7. **Check ecosystem maturity**: Package availability, community, docs
8. **Assess team fit**: Learning curve vs existing skills
9. **Present 2-3 options**: With tradeoffs, not a single recommendation

See `references/stack-comparison-matrix.md` for detailed comparisons.

## Output Format

Produce `stack-recommendation.md`:

```markdown
# Stack Recommendation: [Project]

## Requirements Summary

- Type: [SPA/SSR/Static/Full-stack]
- Key capabilities: [List]
- Scale: [Users/traffic estimate]

## Option 1: [Name] — Recommended

**Frontend**: [Framework]
**Backend**: [Framework]
**Database**: [Database]
**Hosting**: [Platform]

### Pros

- Benefit 1
- Benefit 2

### Cons

- Tradeoff 1

### Best For

[Scenario description]

## Option 2: [Name] — Alternative

...

## Option 3: [Name] — Conservative

...

## Recommendation

[Primary recommendation with reasoning]

## Migration Path

If needs change: [how to migrate between options]
```

## Safety Rules

- Never recommend bleeding-edge tech for production-critical features
- Always mention the learning curve
- Include migration considerations
- Note hosting cost implications

## Coordinates With

- `web-project-discovery` — for requirements
- `technical-architecture-planner` — for detailed architecture
- `compatibility-matrix-builder` — for version verification
