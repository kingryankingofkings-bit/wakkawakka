---
name: security-audit-reviewer
description: Use when conducting security audits, reviewing code for vulnerabilities, implementing security best practices, or hardening web applications. Triggers on requests like "security audit", "security review", "vulnerability check", "secure this", "XSS prevention", "CSRF protection", "SQL injection", "security headers", "penetration test", "harden the app", or when security concerns are raised. Provides comprehensive security checklists for common web vulnerabilities.
---

# Security Audit Reviewer

## Goal
Identify and fix security vulnerabilities across the application stack.

## Do Not Use When
- The request is for a specific known fix
- A professional penetration test is needed (this is a checklist, not a pentest)

## Required Inputs To Inspect
- Full codebase
- Dependencies and versions
- Authentication implementation
- API endpoints
- Environment configuration
- Deployment setup

## Security Checklist

### Authentication & Authorization
- [ ] Passwords hashed with bcrypt/argon2
- [ ] Brute force protection (rate limiting)
- [ ] Session tokens are secure (HttpOnly, Secure, SameSite)
- [ ] JWT has short expiry + refresh tokens
- [ ] Role checks on every protected endpoint
- [ ] CORS properly configured (whitelist, not wildcard)

### Input & Output
- [ ] All inputs validated (Zod, Joi)
- [ ] SQL injection prevented (parameterized queries)
- [ ] XSS prevented (output encoding, CSP headers)
- [ ] CSRF tokens on state-changing requests
- [ ] File upload validated (type, size, content)

### Infrastructure
- [ ] HTTPS only in production
- [ ] Security headers set (HSTS, X-Frame-Options, CSP)
- [ ] Secrets in environment variables (not code)
- [ ] Dependencies scanned for vulnerabilities (`npm audit`)
- [ ] Error messages don't leak stack traces

### Severity Labels

| Severity | Description | Response |
|----------|-------------|----------|
| Critical | Remote code execution, auth bypass | Fix immediately |
| High | SQL injection, XSS, data exposure | Fix within 24h |
| Medium | CSRF, info disclosure | Fix within a week |
| Low | Missing headers, verbose errors | Fix in next sprint |

## Coordinates With
- `authentication-authorization-builder` — for auth fixes
- `backend-api-architect` — for API security
- `deployment-preflight-checker` — for infra security
