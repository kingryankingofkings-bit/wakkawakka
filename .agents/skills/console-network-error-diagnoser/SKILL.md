---
name: console-network-error-diagnoser
description: Use when diagnosing browser console errors, network request failures, API errors, CORS issues, 404/500 errors, or failed resource loading. Triggers on requests like "console error", "network error", "CORS issue", "404 error", "500 error", "API failed", "request failed", "failed to load", or when investigating any browser devtools errors. Provides systematic diagnosis of HTTP errors, CORS problems, asset loading failures, and JavaScript runtime errors.
---

# Console and Network Error Diagnoser

## Goal

Diagnose browser console and network errors with systematic troubleshooting steps.

## Do Not Use When

- The error is clearly described with a known fix
- The issue is purely visual (not console/network)

## Required Inputs To Inspect

- Exact error message from console
- Network tab entries (status, headers, response)
- Request URL and method
- Environment (local, staging, production)
- Recent code changes

## Workflow

1. **Open DevTools**: F12 → Console + Network tabs
2. **Capture the error**: Screenshot or copy exact message
3. **Check Network tab**: Status codes, response body, timing
4. **Check request details**: URL, headers, payload
5. **Check response**: Error message, stack trace
6. **Identify error type**: 4xx (client), 5xx (server), CORS, JS runtime
7. **Trace the source**: Which file, which line, which commit introduced it
8. **Implement fix**: Address root cause
9. **Verify**: Reload, confirm error gone

## Common Errors and Fixes

| Error           | Likely Cause                 | Fix                               |
| --------------- | ---------------------------- | --------------------------------- |
| 404             | Wrong path or file missing   | Check path, ensure file exists    |
| 500             | Server error                 | Check server logs                 |
| CORS            | Cross-origin headers missing | Add CORS middleware               |
| 401/403         | Auth issue                   | Check token, permissions          |
| TypeError       | Code bug (null reference)    | Add null checks                   |
| SyntaxError     | Invalid JS/JSON              | Check for typos, missing brackets |
| Failed to fetch | Network or CORS              | Check URL, CORS, connectivity     |

## Quality Checks

- [ ] Exact error captured
- [ ] Root cause identified
- [ ] Fix addresses cause not symptom
- [ ] Error resolved in target environment

## Coordinates With

- `bug-reproduction-debugger` — for bug investigation
- `security-audit-reviewer` — for auth errors
