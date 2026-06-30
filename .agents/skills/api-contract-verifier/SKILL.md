---
name: api-contract-verifier
description: Use when verifying API contracts between frontend and backend, checking request/response shapes, validating endpoint behavior, or ensuring API consistency. Triggers on requests like "check the API", "verify endpoint", "API contract", "request shape", "response format", "is the API correct", or when integrating frontend with backend and needing to confirm data shapes match. Prevents integration mismatches from incorrect assumptions about API behavior.
---

# API Contract Verifier

## Goal
Verify that frontend and backend agree on API contracts — endpoints, methods, request bodies, response shapes, and error formats.

## Do Not Use When
- API is already documented and verified
- Using a type-safe RPC framework (tRPC, GraphQL with codegen)

## Required Inputs To Inspect
- Backend route definitions
- Frontend API client code
- TypeScript types for requests/responses
- Documentation or OpenAPI spec

## Workflow

1. **List all endpoints**: GET/POST/PUT/DELETE paths
2. **Verify request shape**: Body params, query params, headers
3. **Verify response shape**: Status codes, response body structure
4. **Check error format**: Error response structure
5. **Check types match**: Frontend types match backend responses
6. **Document discrepancies**: List any mismatches

## Verification Template

```markdown
## Endpoint: GET /api/users/:id

### Request
- Method: GET
- Params: id (string, UUID)

### Expected Response (200)
```json
{ "id": "string", "name": "string", "email": "string" }
```

### Actual Response
[Fill after testing]

### Status: ✅ Match / ❌ Mismatch
```

## Safety Rules
- Never assume the API shape — verify with actual requests
- Check error responses, not just success
- Document any contract changes needed

## Coordinates With
- `backend-api-architect` — for API design
- `bug-reproduction-debugger` — for integration bugs
