---
name: analytics-tracking-installer
description: Use when integrating analytics platforms, setting up tracking, implementing event measurement, or configuring privacy-compliant analytics. Triggers on requests like "add Google Analytics", "set up tracking", "analytics", "events", "conversion tracking", "privacy-friendly analytics", "Plausible", "Fathom", "Meta Pixel", "tag manager", or when user behavior measurement is needed. Provides GDPR/privacy-compliant installation patterns.
---

# Analytics and Tracking Installer

## Goal
Implement analytics tracking that respects user privacy and provides actionable insights.

## Do Not Use When
- No analytics needed
- Analytics is already installed and working

## Required Inputs To Inspect
- Analytics platform (Google Analytics 4, Plausible, Fathom, Mixpanel)
- Privacy requirements (GDPR, CCPA)
- Events to track (page views, conversions, custom events)
- Cookie consent requirements
- SPA vs MPA routing

## Workflow

1. **Choose platform**: GA4 (free, comprehensive), Plausible/Fathom (privacy-first)
2. **Implement consent**: Cookie consent banner if required
3. **Install tracking**: Script tag or npm package
4. **Track page views**: Handle SPA route changes
5. **Track events**: Clicks, form submissions, conversions
6. **Set up goals**: Define conversion events
7. **Test**: Verify events fire correctly in debug mode
8. **Document**: What each event means, naming convention

## Privacy Checklist
- [ ] Cookie consent implemented (if required)
- [ ] IP anonymization enabled (if needed)
- [ ] Data processing agreement signed (GDPR)
- [ ] Users can opt out
- [ ] No PII in event data

## Quality Checks
- [ ] Page views tracked on all routes
- [ ] Custom events fire correctly
- [ ] No tracking in development
- [ ] Consent respected before tracking

## Coordinates With
- `frontend-routing-navigation` — for SPA route tracking
- `seo-structured-data-builder` — for search analytics
