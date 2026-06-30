---
name: background-jobs-and-queues
description: Use when implementing background job processing, task queues, scheduled jobs, async processing, or offloading work from the request cycle. Triggers on requests like "background job", "task queue", "schedule tasks", "cron job", "async processing", "send email later", "process queue", "Bull MQ", "Redis queue", "delayed job", or when operations need to happen outside the user request. Provides patterns for job queues, workers, retries, and monitoring.
---

# Background Jobs and Queues

## Goal
Implement reliable background job processing with proper retry logic, monitoring, and error handling.

## Do Not Use When
- All operations are synchronous and fast (< 200ms)
- Using a serverless platform with built-in async (Vercel, etc.)

## Required Inputs To Inspect
- Jobs to run (email sending, image processing, reports)
- Frequency (one-time, recurring, event-driven)
- Execution time estimates
- Retry requirements
- Infrastructure (Redis available?)

## Workflow

1. **Identify async work**: Anything > 500ms or external API call
2. **Choose queue**: In-memory (Bull), Redis (Bull/BullMQ), or cloud (SQS, Pub/Sub)
3. **Define jobs**: Name, payload, priority
4. **Implement workers**: Job processing functions
5. **Add retry logic**: Exponential backoff, max attempts
6. **Handle failures**: Dead letter queue, alerting
7. **Monitor**: Job duration, failure rate, queue depth
8. **Schedule recurring**: Cron pattern for regular jobs

## Job Types

| Type | Example | Trigger |
|------|---------|---------|
| Immediate | Send welcome email | User registration |
| Delayed | Send reminder | 24 hours after signup |
| Recurring | Daily report | Cron: `0 9 * * *` |
| Batch | Process CSV import | Admin upload |

## Quality Checks
- [ ] Jobs have idempotency keys
- [ ] Retry with exponential backoff
- [ ] Failed jobs go to dead letter queue
- [ ] Workers are monitored
- [ ] No job loss on worker restart

## Safety Rules
- Make jobs idempotent (safe to run multiple times)
- Set reasonable timeouts
- Limit concurrent workers
- Alert on high failure rates

## Coordinates With
- `email-notification-builder` — for email jobs
- `file-upload-media-handler` — for processing jobs
- `monitoring-logging-setup` — for job monitoring
