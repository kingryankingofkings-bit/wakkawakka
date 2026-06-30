---
name: deployment-preflight-checker
description: Use before deploying websites to production, creating deployment checklists, verifying deployment readiness, or ensuring all prerequisites are met before going live. Triggers on requests like "ready to deploy", "deployment checklist", "go live", "production check", "pre-deployment", "deploy review", or before any production deployment. Provides comprehensive checks for security, performance, functionality, and configuration before deployment.
---

# Deployment Preflight Checker

## Goal

Verify all prerequisites are met before production deployment to prevent outages and issues.

## Do Not Use When

- Deployment is already in progress
- This is a development/staging deployment only

## Required Inputs To Inspect

- Deployment target (Vercel, Netlify, etc.)
- Environment variables configured
- Database migrations status
- Build output
- Test results

## Preflight Checklist

### Build

- [ ] `npm run build` succeeds
- [ ] No TypeScript errors
- [ ] Linting passes
- [ ] Tests pass

### Configuration

- [ ] Environment variables set in production
- [ ] Database connection configured
- [ ] API keys are production keys
- [ ] Domain configured

### Security

- [ ] No secrets in code
- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] Auth working in production

### Data

- [ ] Database migrations ready
- [ ] Seed data prepared (if needed)
- [ ] Backup strategy in place

### Monitoring

- [ ] Error tracking configured
- [ ] Analytics installed
- [ ] Health check endpoint works

## Output Format

```markdown
## Deployment Readiness Report

**Status**: ✅ Ready / ⚠️ Conditional / ❌ Not Ready

### Passed

- Build succeeds
- Tests pass

### Blockers

- [ ] SSL certificate not configured

### Warnings

- [ ] No error tracking configured
```

## Coordinates With

- `environment-config-manager` — for env checks
- `security-audit-reviewer` — for security checks
- `hosting-platform-deployer` — for actual deployment
