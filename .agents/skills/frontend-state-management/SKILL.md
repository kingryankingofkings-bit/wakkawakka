---
name: frontend-state-management
description: Use when designing or implementing state management for frontend applications, choosing state libraries, structuring state, or debugging state-related bugs. Triggers on requests like "state management", "global state", "Redux or Zustand", "React Context", "share state between components", "state architecture", "data fetching state", or when components need to share data. Framework-aware for React, Vue, Svelte state patterns. Distinguishes server state from client state.
---

# Frontend State Management

## Goal

Design clear, predictable state management that distinguishes server state from client state and minimizes re-renders.

## Do Not Use When

- The app has no shared state (completely static)
- State is already well-managed
- The issue is purely data fetching (not state structure)

## Required Inputs To Inspect

- Component tree and data flow
- State that needs to be shared vs local
- Server data requirements
- Form state complexity
- Update frequency requirements

## Workflow

1. **Categorize state**:
   - **Server state**: Fetched from API (use React Query/SWR/TanStack Query)
   - **Client state**: UI state, form data (use Zustand/Context/Vuex/Pinia)
   - **URL state**: Filters, pagination (use URL params)
   - **Form state**: Use React Hook Form / FormKit / similar
2. **Never put server state in global state**: Use dedicated data-fetching libraries
3. **Keep state close to where it's used**: Lift only when necessary
4. **Normalize state shape**: Flat structures over nested
5. **Use selectors**: Derive computed values, don't duplicate
6. **Handle async**: Loading, error, success states for all async operations

## Decision Tree

```
Is it fetched from API?
├─ Yes → React Query / SWR / TanStack Query
└─ No → Is it shared across routes?
    ├─ Yes → Zustand / Pinia / Vuex
    └─ No → useState / useReducer / ref
```

## Quality Checks

- [ ] Server state uses a data-fetching library
- [ ] No prop drilling beyond 2 levels
- [ ] State updates don't cause unnecessary re-renders
- [ ] Loading and error states handled
- [ ] State shape is normalized

## Safety Rules

- Don't put form state in global state
- Don't mutate state directly (immer or spread)
- Keep state minimal — derive, don't duplicate

## Coordinates With

- `frontend-scaffold-builder` — for library setup
- `forms-validation-builder` — for form state
- `bug-reproduction-debugger` — for state bugs
