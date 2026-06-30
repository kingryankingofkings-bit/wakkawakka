---
name: task-breakdown-and-agent-handoff
description: Use when breaking large web development projects into discrete, assignable tasks and coordinating work between multiple agents or team members. Triggers on requests like "break this into tasks", "create tickets", "assign the work", "what should each agent do", or when managing parallel workstreams in complex builds. Produces task definitions with acceptance criteria, dependencies, and handoff specifications for agent coordination.
---

# Task Breakdown and Agent Handoff

## Goal

Decompose large projects into discrete, independently executable tasks with clear acceptance criteria and handoff protocols.

## Do Not Use When

- The task is already small and specific
- Working solo with sequential execution
- No coordination between agents is needed

## Required Inputs To Inspect

- `build-plan.md` for phased structure
- `technical-architecture.md` for component boundaries
- Available agents/team members and their capabilities
- Task dependencies from the build plan

## Workflow

1. **Identify workstreams**: Frontend, backend, design, DevOps, content
2. **Break phases into tasks**: Each task should be independently completable
3. **Define acceptance criteria**: What does "done" mean for each task?
4. **Assign dependencies**: Which tasks block others?
5. **Estimate effort**: S/M/L/XL for each task
6. **Define handoff protocol**: What does the next task need from this one?
7. **Identify integration points**: Where do workstreams merge?
8. **Set review gates**: What needs human review before proceeding?

## Output Format

Produce `task-breakdown.md`:

```markdown
# Task Breakdown: [Project]

## Workstream: Frontend

### Task F1: Project Scaffold

**Effort**: S
**Assignee**: Frontend agent
**Acceptance Criteria**:

- [ ] Repo initialized with chosen framework
- [ ] Dev server runs
- [ ] Folder structure follows conventions
      **Handoff to F2**: Clean repo with README

### Task F2: Design System Setup

**Effort**: M
**Dependencies**: F1
**Acceptance Criteria**:

- [ ] Tailwind configured with brand colors
- [ ] Base components created (Button, Input, Card)
- [ ] Storybook running (optional)
      **Handoff to F3**: Component library ready

## Workstream: Backend

### Task B1: Database Setup

**Effort**: S
**Dependencies**: None
**Acceptance Criteria**:

- [ ] Schema created
- [ ] Migrations runnable
- [ ] Seed data available
      **Handoff to B2**: Database accessible

## Integration Points

- F3 (Pages) ↔ B2 (API): Frontend pages call backend APIs
- F4 (Auth UI) ↔ B3 (Auth API): Login flow end-to-end

## Review Gates

- [ ] After F2: Design system review
- [ ] After B3: API contract review
- [ ] Before deploy: Full integration test
```

## Quality Checks

- [ ] Every task has clear acceptance criteria
- [ ] Dependencies form a DAG
- [ ] Handoff artifacts are specified
- [ ] No task is larger than one day's work
- [ ] Integration points are explicit

## Safety Rules

- Never parallelize tasks with hidden dependencies
- Always specify the handoff artifact
- Include rollback plan for integration failures

## Coordinates With

- `requirements-to-build-plan` — for phase structure
- `frontend-scaffold-builder` — for frontend tasks
- `backend-api-architect` — for backend tasks
