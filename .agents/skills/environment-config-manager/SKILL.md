---
name: environment-config-manager
description: Use when managing environment variables, configuring deployment environments, setting up secrets management, or handling configuration across development, staging, and production. Triggers on requests like "environment variables", ".env setup", "config management", "secrets", "staging config", "production env", "API keys", "database URL", or when configuring application settings for different environments. Provides secure patterns for configuration management without exposing secrets.
---

# Environment Config Manager

## Goal
Manage environment-specific configuration securely with proper secrets handling and validation.

## Do Not Use When
- Configuration is already managed
- No environment-specific values needed

## Required Inputs To Inspect
- Required environment variables
- Current .env files
- Deployment platforms
- Secret management solution

## Workflow

1. **Inventory variables**: List all env vars needed
2. **Classify**: Public (NEXT_PUBLIC_) vs secret
3. **Document**: .env.example with descriptions
4. **Validate**: Schema validation on startup (Zod)
5. **Secure secrets**: Use platform secret managers in production
6. **Separate environments**: Dev, staging, prod configs
7. **Never commit secrets**: .env in .gitignore

## Required Variables Pattern

```typescript
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']),
});

export const env = envSchema.parse(process.env);
```

## Safety Rules
- Never commit .env files
- Never log secrets
- Rotate secrets regularly
- Use different secrets per environment

## Coordinates With
- `security-audit-reviewer` — for secret management
- `deployment-preflight-checker` — for env validation
