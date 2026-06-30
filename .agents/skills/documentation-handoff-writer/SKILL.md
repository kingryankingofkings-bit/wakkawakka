---
name: documentation-handoff-writer
description: Use when writing project documentation, creating README files, API documentation, developer handoff notes, or user guides for web projects. Triggers on requests like "write documentation", "README", "API docs", "developer guide", "project handoff", "documentation", "how to run this", "onboarding docs", or when knowledge needs to be captured for team members or future maintainers. Produces clear, maintainable documentation.
---

# Documentation and Handoff Writer

## Goal

Create clear, useful documentation that enables others to understand, run, and maintain the project.

## Do Not Use When

- Documentation already exists and is current
- The project is personal and won't be shared

## Required Inputs To Inspect

- Project structure and tech stack
- Environment variables
- API endpoints
- Setup instructions
- Deployment process
- Architecture decisions

## Documentation Structure

````markdown
# Project Name

## Overview

What this project does, who built it, why.

## Tech Stack

- Frontend:
- Backend:
- Database:
- Hosting:

## Getting Started

### Prerequisites

- Node.js version
- Database
- API keys

### Installation

```bash
git clone <repo>
cd project
npm install
cp .env.example .env
# Fill in environment variables
npm run dev
```
````

## Environment Variables

| Variable     | Description                  | Required |
| ------------ | ---------------------------- | -------- |
| DATABASE_URL | PostgreSQL connection string | Yes      |

## API Documentation

See `/docs/api.md` or OpenAPI spec.

## Deployment

See `/docs/deployment.md`.

## Architecture

See `/docs/architecture.md`.

```

## Quality Checks
- [ ] New developer can set up in < 30 minutes
- [ ] All env vars documented
- [ ] API endpoints documented
- [ ] Architecture decisions explained (ADRs)

## Coordinates With
- `technical-architecture-planner` — for architecture docs
- `hosting-platform-deployer` — for deployment docs
```
