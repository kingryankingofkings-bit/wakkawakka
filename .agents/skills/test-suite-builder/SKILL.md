---
name: test-suite-builder
description: Use when setting up testing frameworks, writing unit tests, integration tests, end-to-end tests, or establishing testing conventions. Triggers on requests like "add tests", "test setup", "Jest", "Vitest", "Playwright", "Cypress", "testing library", "unit test", "e2e test", "test coverage", or when establishing testing practices for a project. Framework-aware for React Testing Library, Vue Test Utils, Playwright, Cypress.
---

# Test Suite Builder

## Goal

Implement comprehensive testing with unit, integration, and e2e tests for critical paths.

## Do Not Use When

- Tests already exist and pass
- The project is a quick prototype

## Required Inputs To Inspect

- Framework and test tools available
- Critical user paths
- Component complexity
- API endpoints
- Test environment setup

## Workflow

1. **Set up framework**: Vitest (Vite), Jest (general), Playwright (e2e)
2. **Configure**: Test script in package.json, config file
3. **Write unit tests**: Pure functions, utilities, hooks
4. **Write component tests**: Render, interact, assert (Testing Library)
5. **Write integration tests**: API + frontend together
6. **Write e2e tests**: Critical user journeys (Playwright/Cypress)
7. **Add coverage**: Set minimum threshold (80%)
8. **CI integration**: Run on every PR

## Test Pyramid

```
    /\
   /  \     E2E (few) — Critical paths
  /____\
 /      \   Integration (some) — Feature flows
/________\
           Unit (many) — Functions, components
```

## Component Test Example

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "./Button";

test("calls onClick when clicked", () => {
  const handleClick = vi.fn();
  render(<Button onClick={handleClick}>Click me</Button>);
  fireEvent.click(screen.getByText("Click me"));
  expect(handleClick).toHaveBeenCalled();
});
```

## Quality Checks

- [ ] Unit tests for pure functions
- [ ] Component tests for user interactions
- [ ] E2E tests for critical paths
- [ ] Coverage report generated
- [ ] Tests run in CI

## Safety Rules

- Test behavior, not implementation
- Use `screen` queries (not `container`)
- Clean up after each test
- Mock external APIs

## Coordinates With

- `frontend-scaffold-builder` — for test setup
- `bug-reproduction-debugger` — for regression tests
