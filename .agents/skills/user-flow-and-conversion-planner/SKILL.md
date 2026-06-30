---
name: user-flow-and-conversion-planner
description: Use when designing user journeys, conversion funnels, onboarding flows, or critical path optimization for websites and web apps. Triggers on requests like "design the user flow", "plan the onboarding", "optimize conversions", "map the customer journey", or when building sites with specific action goals (signup, purchase, contact). Produces flow diagrams, funnel definitions, and optimization checklists.
---

# User Flow and Conversion Planner

## Goal

Design user journeys that guide visitors toward key actions with minimal friction and maximum clarity.

## Do Not Use When

- The site has no conversion goals (purely informational)
- User flow is already documented
- The task is visual/UI design only

## Required Inputs To Inspect

- `project-brief.md` with stated goals
- `information-architecture.md` for page structure
- Target audience descriptions
- Current analytics (if improving existing site)
- Competitor flow references

## Workflow

1. **Define conversion goals**: What specific actions = success?
2. **Map entry points**: Where do users come from? (organic, ads, social, direct)
3. **Design primary flows**: Entry → Action → Success for each goal
4. **Identify friction points**: Where might users drop off?
5. **Plan micro-conversions**: Smaller commitments leading to main goal
6. **Design error recovery**: How do users recover from mistakes?
7. **Plan for returning users**: Different flow than first-time visitors
8. **Define success metrics**: How do we measure flow effectiveness?

## Output Format

Produce `user-flows.md`:

```markdown
# User Flows: [Project]

## Conversion Goals

1. Primary: [Goal] — Target: [X]%
2. Secondary: [Goal] — Target: [Y]%

## Primary Flow: [Goal Name]
```

Landing Page → Value Prop → CTA Click → Form → Confirmation

```
**Entry Points**: Google Ads, Organic search
**Success Metric**: Form completion rate
**Friction Points**: Form length, trust signals

## Micro-Conversions
1. Scroll depth on landing page
2. Time on page > 30s
3. Click to pricing page

## Error Recovery
- Form validation: inline, clear messages
- Payment failure: save cart, retry with different method
- 404: suggest related content, search

## Returning User Flow
1. Recognize returning user
2. Show personalized content
3. Reduce friction (pre-fill data)

## Metrics Dashboard
- Conversion rate by channel
- Drop-off by step
- Time to convert
```

## Quality Checks

- [ ] Every flow has a clear start and end
- [ ] Each step has a defined success criteria
- [ ] Error states are planned, not ignored
- [ ] Mobile flows are specified
- [ ] Flows account for different user types

## Safety Rules

- Never design flows that manipulate or deceive users
- Always provide clear exit paths
- Respect user data — no forced registration before value delivery

## Coordinates With

- `information-architecture-planner` — page structure
- `frontend-scaffold-builder` — flow implementation
- `forms-validation-builder` — form design in flows
