---
name: server-actions-and-api-routes
description: Use when implementing server-side logic in fullstack frameworks like Next.js, Nuxt, SvelteKit, or Remix. Triggers on requests like "create API route", "server action", "Next.js API", "form action", "server function", "POST handler", "data mutation", or when implementing backend logic within a frontend framework. Distinguishes between API routes and server actions, advises on the right pattern for each use case.
---

# Server Actions and API Routes

## Goal
Implement server-side logic using the appropriate pattern for the framework and use case.

## Do Not Use When
- Using a separate backend service
- Framework doesn't support server actions (pure SPA)

## Required Inputs To Inspect
- Framework (Next.js, Nuxt, SvelteKit, Remix)
- Data mutation needs
- Form submission requirements
- Authentication context
- Caching strategy

## Decision: API Route vs Server Action

| Factor | API Route | Server Action |
|--------|-----------|---------------|
| Called from | Any client | Server components, forms |
| Caching | HTTP cacheable | Not directly cacheable |
| Flexibility | Full HTTP control | Simplified calling |
| Use case | Public API, mobile clients | Form submissions, mutations |

## Workflow

1. **Identify the pattern**: API route or server action
2. **Validate input**: Use Zod or similar
3. **Authenticate**: Check session/token
4. **Authorize**: Verify permissions
5. **Execute**: Database operation, external API call
6. **Revalidate cache**: For Next.js, `revalidatePath()` or `revalidateTag()`
7. **Return response**: Structured, with error handling
8. **Handle errors**: Try/catch, structured error responses

## Next.js Server Action Example

```tsx
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const schema = z.object({ name: z.string().min(1) });

export async function createTodo(formData: FormData) {
  const data = schema.parse(Object.fromEntries(formData));
  await db.todo.create({ data });
  revalidatePath('/todos');
}
```

## Quality Checks
- [ ] Input validated
- [ ] Auth checked
- [ ] Errors handled
- [ ] Cache invalidated after mutations
- [ ] No sensitive data leaked

## Safety Rules
- Never trust client input
- Always check auth in server actions
- Don't expose internal errors
- Revalidate cache after mutations

## Coordinates With
- `backend-api-architect` — for API design
- `forms-validation-builder` — for form submissions
- `cache-and-data-fetching-strategy` — for caching
