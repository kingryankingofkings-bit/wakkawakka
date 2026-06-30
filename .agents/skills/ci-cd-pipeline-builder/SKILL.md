---
name: ci-cd-pipeline-builder
description: Use when setting up continuous integration and deployment pipelines, configuring GitHub Actions, GitLab CI, or other CI/CD systems, automating tests on pull requests, or creating deployment workflows. Triggers on requests like "CI/CD", "GitHub Actions", "pipeline", "automated tests", "deploy on push", "build workflow", "test on PR", or when automating the build-test-deploy cycle.
---

# CI/CD Pipeline Builder

## Goal
Implement automated CI/CD pipelines that test, build, and deploy on code changes.

## Do Not Use When
- CI/CD is already configured
- Manual deployment is preferred

## Required Inputs To Inspect
- Git platform (GitHub, GitLab, Bitbucket)
- Deployment platform
- Test commands
- Build commands
- Environment requirements

## Workflow

1. **Trigger**: On push to main, on PR
2. **Install**: Checkout code, install dependencies
3. **Lint**: Run ESLint, Prettier check
4. **Test**: Run unit and integration tests
5. **Build**: Build production bundle
6. **Deploy**: Deploy to staging/production
7. **Notify**: Report status

## GitHub Actions Example

```yaml
name: CI/CD
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build
      - name: Deploy
        run: # deployment command
```

## Quality Checks
- [ ] Pipeline runs on PR
- [ ] Failed tests block deployment
- [ ] Deployment is automated
- [ ] Rollback is possible

## Coordinates With
- `test-suite-builder` — for test configuration
- `hosting-platform-deployer` — for deploy steps
