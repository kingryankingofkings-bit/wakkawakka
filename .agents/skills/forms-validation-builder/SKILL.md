---
name: forms-validation-builder
description: Use when building forms with validation, creating input components, handling form submission, or implementing client-side and server-side validation. Triggers on requests like "create a form", "form validation", "contact form", "signup form", "input validation", "form errors", "react hook form", "zod validation", or when any user input collection is needed. Produces accessible forms with robust validation, error handling, and submission states. Framework-aware for React, Vue, Svelte form libraries.
---

# Forms and Validation Builder

## Goal
Build accessible, well-validated forms with clear error handling and submission feedback.

## Do Not Use When
- No user input is needed
- Using a third-party form service (Typeform, etc.)
- Form is already built and working

## Required Inputs To Inspect
- Form fields and types
- Validation rules per field
- Server-side validation schema
- Submission behavior (API endpoint, email, etc.)
- Accessibility requirements

## Workflow

1. **Choose form library**: React Hook Form (React), FormKit (Vue), Felte (Svelte)
2. **Choose validation**: Zod, Yup, Joi, or Valibot — match to schema
3. **Structure the form**: Group related fields, logical order
4. **Implement fields**: Each with label, input, error message, help text
5. **Add validation**: Client-side first, server-side always
6. **Handle submission**: Loading state, success, error feedback
7. **Add accessibility**: Labels, aria-describedby, error announcements
8. **Handle edge cases**: Empty submissions, network errors, rate limiting

## Pattern

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters'),
});

export function LoginForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" {...register('email')} />
        {errors.email && <span role="alert">{errors.email.message}</span>}
      </div>
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
```

## Quality Checks
- [ ] Every input has a label
- [ ] Validation errors are clear and specific
- [ ] Form is keyboard navigable
- [ ] Loading state during submission
- [ ] Success/error feedback after submission
- [ ] Server errors are displayed
- [ ] No data loss on validation failure

## Safety Rules
- Never trust client-side validation alone — always validate server-side
- Sanitize all user inputs
- Don't log sensitive form data
- Handle CSRF protection

## Coordinates With
- `accessibility-builder` — accessible forms
- `backend-api-architect` — for submission endpoints
- `security-audit-reviewer` — for form security
