---
name: monitoring-logging-setup
description: Use when setting up application monitoring, error tracking, log aggregation, uptime monitoring, or alerting for production websites. Triggers on requests like "add monitoring", "error tracking", "Sentry", "Datadog", "logs", "alerts", "uptime check", "health check", "performance monitoring", "production monitoring", or when production observability needs to be established. Provides patterns for error tracking, logging, metrics, and alerting.
---

# Monitoring and Logging Setup

## Goal

Implement production monitoring with error tracking, logging, and alerting.

## Do Not Use When

- Monitoring is already configured
- This is a development environment only

## Required Inputs To Inspect

- Monitoring tools preference
- Alert channels (email, Slack, PagerDuty)
- Critical metrics to track
- Error tracking needs
- Log retention requirements

## Workflow

1. **Error tracking**: Sentry, Rollbar, or LogRocket
2. **Uptime monitoring**: UptimeRobot, Pingdom
3. **Logging**: Structured logs (JSON format)
4. **Metrics**: Response time, error rate, throughput
5. **Health check**: `/health` endpoint
6. **Alerting**: Configure thresholds and channels
7. **Dashboard**: Overview of system health

## Error Tracking Setup (Sentry)

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

## Health Check Endpoint

```typescript
// app/api/health/route.ts
export async function GET() {
  // Check database connectivity
  // Check external services
  return Response.json({ status: "ok", timestamp: new Date().toISOString() });
}
```

## Quality Checks

- [ ] Errors are captured and reported
- [ ] Alerts fire on issues
- [ ] Health check responds correctly
- [ ] Logs are structured and searchable

## Coordinates With

- `hosting-platform-deployer` — for platform monitoring
- `backup-rollback-planner` — for incident response
