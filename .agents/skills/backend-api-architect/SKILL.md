---
name: backend-api-architect
description: Use when designing or implementing RESTful or GraphQL APIs, planning endpoint structure, defining request/response schemas, or building server-side API layers. Triggers on requests like "design the API", "create endpoints", "REST API", "GraphQL schema", "API structure", "endpoint design", "request validation", "API versioning", or when building backend services that serve frontend clients. Produces well-structured APIs with consistent patterns, validation, error handling, and documentation.
---

# Backend API Architect

## Goal

Design and implement consistent, versioned APIs with proper validation, error handling, and documentation.

## Do Not Use When

- No backend is needed (static site)
- API is already designed and implemented
- Using a backend-as-a-service exclusively (Supabase, Firebase)

## Required Inputs To Inspect

- `technical-architecture.md` for API boundaries
- Frontend data requirements
- Authentication strategy
- Performance requirements

## Workflow

1. **Choose API style**: REST (resource-based) or GraphQL (query-based)
2. **Define resources**: Nouns (users, posts, orders), not verbs
3. **Design endpoints**: HTTP method + path = action
4. **Define request/response schemas**: Zod, Joi, or TypeScript DTOs
5. **Implement validation**: Request body, query params, path params
6. **Add error handling**: Consistent error format, appropriate status codes
7. **Add authentication**: Middleware for protected routes
8. **Add rate limiting**: Prevent abuse
9. **Version the API**: `/api/v1/` prefix
10. **Document**: OpenAPI/Swagger spec or README

## REST Endpoint Pattern

```
GET    /api/v1/resources       → List (paginated)
GET    /api/v1/resources/:id   → Get one
POST   /api/v1/resources       → Create
PUT    /api/v1/resources/:id   → Full update
PATCH  /api/v1/resources/:id   → Partial update
DELETE /api/v1/resources/:id   → Remove
```

## Error Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [{ "field": "email", "message": "Invalid email format" }]
  }
}
```

## Quality Checks

- [ ] All endpoints return consistent response shapes
- [ ] Validation on all inputs
- [ ] Proper HTTP status codes
- [ ] Error responses include actionable messages
- [ ] Rate limiting implemented
- [ ] Authentication middleware on protected routes
- [ ] API is documented

## Safety Rules

- Never expose stack traces in production errors
- Validate all inputs — never trust the client
- Use HTTPS only in production
- Sanitize all outputs to prevent XSS

## Coordinates With

- `technical-architecture-planner` — for API boundaries
- `database-schema-designer` — for data models
- `authentication-authorization-builder` — for auth
