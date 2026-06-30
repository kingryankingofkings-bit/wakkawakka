---
name: authentication-authorization-builder
description: Use when implementing user authentication (login, signup, password reset), session management, JWT handling, OAuth integration, or role-based access control. Triggers on requests like "add login", "authentication", "OAuth setup", "Google login", "password reset", "JWT tokens", "session management", "role-based access", "protected routes", "auth middleware", or when any user identity or permission system is needed.
---

# Authentication and Authorization Builder

## Goal
Implement secure authentication and authorization with proper session/token management and role-based access control.

## Do Not Use When
- No user accounts needed
- Using a third-party auth service exclusively (Auth0, Clerk, etc.)
- Auth is already implemented

## Required Inputs To Inspect
- Auth requirements (email/password, social, SSO)
- Role/permission structure
- Session strategy (stateful vs JWT)
- Security requirements
- Frontend auth flow needs

## Workflow

1. **Choose strategy**: Sessions (stateful) vs JWT (stateless) vs OAuth
2. **Implement registration**: Email validation, password hashing (bcrypt/argon2)
3. **Implement login**: Credential verification, session/token creation
4. **Implement logout**: Token invalidation or session destruction
5. **Add password reset**: Secure token via email, expiration
6. **Implement roles**: Role-based access control (RBAC) or attribute-based (ABAC)
7. **Add middleware**: Route protection, role checks
8. **Secure tokens**: HttpOnly cookies, CSRF protection, short expiry
9. **Add refresh tokens**: For JWT-based auth
10. **Audit log**: Track auth events (login, logout, failed attempts)

## Auth Flow

```
Register → Validate email → Hash password → Store user
Login → Verify password → Create session/token → Return to client
Protected request → Verify token/session → Check permissions → Serve
```

## Security Checklist
- [ ] Passwords hashed with bcrypt (cost >= 10) or argon2id
- [ ] Tokens stored in HttpOnly cookies (not localStorage)
- [ ] CSRF protection for cookie-based auth
- [ ] Rate limiting on login attempts (5 tries, then lockout)
- [ ] Secure password reset (random token, expires in 1 hour)
- [ ] Input validation on all auth endpoints
- [ ] No sensitive data in JWT payload
- [ ] HTTPS only in production

## Coordinates With
- `backend-api-architect` — for auth endpoints
- `database-schema-designer` — for user/role tables
- `frontend-routing-navigation` — for protected routes
- `security-audit-reviewer` — for security review
