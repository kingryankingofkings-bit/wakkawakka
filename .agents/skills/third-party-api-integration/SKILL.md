---
name: third-party-api-integration
description: Use when integrating external APIs, webhooks, SDKs, or third-party services into web applications. Triggers on requests like "integrate with", "API integration", "webhook", "Stripe API", "SendGrid API", "AWS S3", "Google Maps API", "OAuth", "API client", or when connecting to any external service. Provides patterns for API clients, error handling, rate limiting, and webhook verification.
---

# Third-Party API Integration

## Goal

Integrate external APIs with proper error handling, retries, rate limiting, and security.

## Do Not Use When

- No external APIs needed
- Integration is already complete

## Required Inputs To Inspect

- API documentation and endpoints
- Authentication method (API key, OAuth, JWT)
- Rate limits
- Webhook requirements
- Error scenarios

## Workflow

1. **Read docs**: Current API documentation (verify against latest)
2. **Set up client**: SDK or fetch/axios with base URL
3. **Configure auth**: API keys in env vars, never client-side
4. **Implement endpoints**: One function per endpoint
5. **Add error handling**: Try/catch, structured errors, fallbacks
6. **Add retries**: Exponential backoff for transient failures
7. **Respect rate limits**: Implement throttling if needed
8. **Verify webhooks**: Signature verification for webhooks
9. **Add timeouts**: Prevent hanging requests
10. **Monitor**: Track error rates and latency

## Error Handling Pattern

```typescript
class ApiClient {
  async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: { ...this.authHeaders, ...options?.headers },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new ApiError(response.status, error.message || "Request failed");
      }

      return response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(0, "Network error");
    }
  }
}
```

## Quality Checks

- [ ] All errors handled gracefully
- [ ] Retries for transient failures
- [ ] Rate limits respected
- [ ] Webhooks verified
- [ ] Timeouts configured
- [ ] No secrets in client-side code

## Safety Rules

- Never expose API keys client-side
- Always verify webhook signatures
- Sanitize all API inputs
- Handle API downtime gracefully

## Coordinates With

- `backend-api-architect` — for internal API design
- `security-audit-reviewer` — for security review
- `current-docs-researcher` — for up-to-date API docs
