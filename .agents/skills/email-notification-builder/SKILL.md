---
name: email-notification-builder
description: Use when implementing email sending, notification systems, transactional emails, email templates, or multi-channel notifications. Triggers on requests like "send email", "email verification", "welcome email", "notification system", "password reset email", "email template", "Resend", "SendGrid", "postmark", or when any email communication is needed from the application.
---

# Email and Notification Builder

## Goal
Implement reliable email delivery with templated emails, fallback handling, and delivery tracking.

## Do Not Use When
- No email functionality needed
- Using a third-party service with built-in templates (Clerk, etc.)

## Required Inputs To Inspect
- Email types needed (transactional, marketing, notification)
- Email service provider (Resend, SendGrid, Postmark, AWS SES)
- Template design requirements
- Rate limiting needs
- Deliverability requirements

## Workflow

1. **Choose provider**: Resend (modern, simple), SendGrid (full-featured), AWS SES (cost-effective)
2. **Set up DNS**: SPF, DKIM, DMARC for deliverability
3. **Create templates**: HTML + plain text versions
4. **Implement sending**: API integration with retry logic
5. **Add queue**: For high volume, queue emails (background job)
6. **Track delivery**: Bounces, opens, clicks
7. **Handle errors**: Retry failed sends, alert on persistent failures
8. **Unsubscribe**: Include unsubscribe links in marketing emails

## Email Types

| Type | Examples | Priority |
|------|----------|----------|
| Transactional | Password reset, welcome, receipt | High |
| Notification | New message, alert, reminder | Medium |
| Marketing | Newsletter, promotion | Low |

## Quality Checks
- [ ] HTML and plain text versions
- [ ] Tested in major email clients
- [ ] Unsubscribe link in marketing emails
- [ ] Images have alt text
- [ ] Links are absolute URLs
- [ ] Responsive design
- [ ] SPF/DKIM configured

## Safety Rules
- Never expose BCC lists
- Rate limit email sending
- Validate email addresses before sending
- Don't send emails in request cycle for high volume (use queue)

## Coordinates With
- `authentication-authorization-builder` — for auth emails
- `background-jobs-and-queues` — for queued sending
- `third-party-api-integration` — for email provider APIs
