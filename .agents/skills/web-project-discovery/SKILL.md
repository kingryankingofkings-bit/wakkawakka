---
name: web-project-discovery
description: Use when starting any new web project, receiving vague website requests, or when the user has an idea but no clear technical plan. Triggers on phrases like "I want a website", "build me a site", "I need a web app", or when requirements are unclear, incomplete, or high-level. Extracts goals, audience, features, constraints, and success criteria to produce a structured project brief. Always run this before proposing technical solutions or writing code.
---

# Web Project Discovery

## Goal

Transform vague or high-level website ideas into structured, actionable project briefs with clear requirements, constraints, and success criteria.

## Do Not Use When

- Requirements are already documented and approved
- User explicitly provided a detailed specification
- The task is purely technical (debugging, refactoring, adding a specific feature)

## Required Inputs To Inspect

- User's stated goals and desired outcomes
- Any existing documents, notes, or references provided
- Target audience hints (industry, demographics, use case)
- Competitor or reference websites mentioned
- Budget or timeline constraints mentioned
- Technical preferences (if any)

## Workflow

1. **Clarify the core goal**: Ask "What does success look like?" — a visitor signing up, buying, reading, or managing data?
2. **Identify the audience**: Who will use this? What are their needs and technical literacy?
3. **List must-have features**: Extract from user's description. Ask "If you could only have 3 features, what would they be?"
4. **List nice-to-have features**: Separate from must-haves for prioritization.
5. **Determine constraints**: Budget, timeline, team size, hosting preferences, compliance needs.
6. **Identify reference sites**: "What sites do you like and why?" for aesthetic and functional alignment.
7. **Check for existing assets**: Logo, brand colors, content, domain name, hosting account.
8. **Define success metrics**: How will we know this is working? (conversions, traffic, engagement)
9. **Assess technical readiness**: Does the user have a domain? Hosting? Content ready?
10. **Document assumptions**: Explicitly state what you're assuming and ask for confirmation.

## Output Format

Produce a `project-brief.md` file with these sections:

```markdown
# Project Brief: [Project Name]

## 1. Goal Statement

One-sentence purpose.

## 2. Target Audience

- Primary:
- Secondary:

## 3. Must-Have Features

- [ ] Feature 1
- [ ] Feature 2

## 4. Nice-to-Have Features

- [ ] Feature A

## 5. Constraints & Requirements

- Budget:
- Timeline:
- Compliance:

## 6. Reference Sites

- [Site](url) - liked for: ...

## 7. Existing Assets

- [ ] Logo
- [ ] Brand colors
- [ ] Content
- [ ] Domain

## 8. Success Metrics

- Metric 1

## 9. Assumptions

- Assumption 1 (pending confirmation)

## 10. Recommended Next Steps

1. Approve this brief
2. Move to information architecture
```

## Quality Checks

- [ ] Brief is under 2 pages
- [ ] Every must-have is testable
- [ ] Audience is specific, not "everyone"
- [ ] Assumptions are listed and confirmed

## Safety Rules

- Do NOT propose technical solutions before understanding the problem
- Do NOT estimate timelines without knowing scope
- Do NOT assume the user wants a specific framework

## Failure Handling

If the user cannot answer discovery questions, document assumptions prominently and proceed with lowest-risk defaults. Flag high-risk assumptions for early validation.

## Examples That Should Trigger

- "I want a website for my business"
- "Build me a portfolio site"
- "I need a web app like Airbnb but for pets"
- "I have an idea for a SaaS product"

## Examples That Should Not Trigger

- "Fix the login button color"
- "Add a contact form to the footer"
- "Debug why the API returns 500"
- "Refactor the user dashboard component"

## Coordinates With

- `requirements-to-build-plan` — hand off the approved brief
- `information-architecture-planner` — once goals are clear
- `stack-selection-advisor` — for technical planning
