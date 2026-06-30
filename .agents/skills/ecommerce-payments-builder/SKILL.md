---
name: ecommerce-payments-builder
description: Use when building ecommerce functionality, integrating payment processors, implementing shopping carts, checkout flows, order management, or product catalogs. Triggers on requests like "add payments", "Stripe integration", "PayPal", "shopping cart", "checkout", "product page", "order management", "ecommerce", "subscription billing", "payment gateway", or when any buying/selling functionality is needed. Provides secure payment patterns with PCI compliance awareness.
---

# Ecommerce and Payments Builder

## Goal

Implement secure ecommerce functionality with proper payment processing, cart management, and order tracking.

## Do Not Use When

- No payment processing needed
- Using a full ecommerce platform (Shopify, etc.)

## Required Inputs To Inspect

- Payment processor (Stripe, PayPal, Square)
- Product types (physical, digital, subscription)
- Cart requirements (guest checkout, persistent cart)
- Tax calculation needs
- Shipping integration needs

## Workflow

1. **Set up payment account**: Stripe account, API keys
2. **Implement products**: Product catalog with variants, pricing
3. **Build cart**: Add, remove, update quantity, persist (localStorage + server)
4. **Create checkout**: Stripe Checkout hosted or Elements embedded
5. **Handle webhooks**: payment_intent.succeeded, payment_intent.failed
6. **Process orders**: Save order, update inventory, send confirmation
7. **Implement refunds**: Admin interface or API
8. **Add subscriptions**: For recurring billing (Stripe Billing)
9. **Handle taxes**: Tax calculation service (Stripe Tax, TaxJar)
10. **Secure implementation**: Never trust client-side totals

## Security Rules

- Always calculate totals server-side
- Verify webhook signatures
- Use Stripe Checkout for PCI compliance
- Log all payment events
- Handle idempotency (prevent duplicate charges)

## Quality Checks

- [ ] Payment flows work end-to-end
- [ ] Webhooks handled correctly
- [ ] Orders saved after payment
- [ ] Inventory updated
- [ ] Confirmation emails sent
- [ ] Error states handled gracefully
- [ ] Refund process documented

## Coordinates With

- `backend-api-architect` — for order API
- `database-schema-designer` — for order/product tables
- `email-notification-builder` — for confirmations
- `third-party-api-integration` — for Stripe/PayPal APIs
