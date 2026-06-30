---
name: requirements-to-build-plan
description: Use when a project brief or requirements document exists and needs to be converted into a structured build plan with milestones, task sequencing, and effort estimates. Triggers when the user says "create a plan", "how should we build this", "what are the steps", or when moving from discovery to implementation. Produces a phased development roadmap with clear milestones and dependencies.
---

# Requirements to Build Plan

## Goal
Convert approved requirements into a sequenced, phased build plan with milestones, dependencies, and effort estimates.

## Do Not Use When
- No requirements or brief exists (use `web-project-discovery` first)
- The task is a single small change
- User explicitly provided a task list

## Required Inputs To Inspect
- `project-brief.md` or equivalent requirements document
- Any existing codebase or project structure
- Team constraints (solo, team size)
- Deadline or timeline constraints

## Workflow

1. **Group requirements by phase**: Foundation → Core Features → Polish → Launch
2. **Identify dependencies**: What must be built before other things?
3. **Estimate effort per task**: Use T-shirt sizes (S/M/L/XL) or story points
4. **Sequence tasks**: Order by dependency and priority
5. **Define milestones**: Clear deliverables at each phase end
6. **Identify risks**: Flag tasks with uncertainty or external dependencies
7. **Set review checkpoints**: Where should the user review?

## Output Format

Produce a `build-plan.md`:

```markdown
# Build Plan: [Project Name]

## Phase 1: Foundation (Week 1)
| Task | Effort | Dependencies | Deliverable |
|------|--------|--------------|-------------|
| Setup project scaffold | S | None | Repo + dev env |
| Design database schema | M | None | Schema diagram |
| Implement auth | L | Schema | Login/signup working |

**Milestone**: [Description of done state]
**Review Checkpoint**: User reviews [specific thing]

## Phase 2: Core Features (Weeks 2-3)
...

## Risk Register
| Risk | Impact | Mitigation |
|------|--------|------------|
| Third-party API unavailable | High | Mock early, integrate late |

## Next Action
- [ ] Task to start immediately
```

## Quality Checks
- [ ] Every requirement maps to at least one task
- [ ] No orphan tasks without a phase
- [ ] Dependencies form a DAG (no circular)
- [ ] Each phase has a clear "definition of done"

## Safety Rules
- Never promise specific dates without explicit user confirmation
- Always flag external dependencies as risks
- Include buffer time for unknowns

## Failure Handling
If requirements are incomplete, build the plan for known requirements and append a "Requirements Gap" section with questions.

## Examples That Should Trigger
- "Create a build plan for this"
- "How should we approach this project?"
- "What are the steps to build this?"
- "Plan out the development"

## Examples That Should Not Trigger
- "Fix this bug"
- "Add a button here"
- "How do I center a div"

## Coordinates With
- `web-project-discovery` — receives the brief
- `information-architecture-planner` — parallel for IA work
- `stack-selection-advisor` — for tech stack decisions
