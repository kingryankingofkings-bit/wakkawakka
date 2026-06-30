---
name: database-migration-safety
description: Use when creating, running, or reverting database migrations, managing schema changes in production, or planning zero-downtime schema updates. Triggers on requests like "create a migration", "run migrations", "schema change", "add column", "alter table", "rollback migration", "Prisma migrate", "Drizzle migrate", or when any database schema change is needed. Provides safe migration patterns for production environments with rollback plans.
---

# Database Migration Safety

## Goal

Execute schema changes safely with rollback plans and zero-downtime strategies.

## Do Not Use When

- Development-only, throwaway databases
- Schema is managed automatically (Firebase, etc.)

## Required Inputs To Inspect

- Current schema
- Desired schema changes
- Production status (is this live?)
- Database size and traffic
- Migration tool (Prisma, Drizzle, Flyway, etc.)

## Workflow

1. **Backup first**: Always backup before migrations in production
2. **Write migration script**: Up and down migrations
3. **Test on copy**: Run against a copy of production data
4. **Plan for zero-downtime**: For large tables, use online migrations
5. **Deploy in steps**: Add column → Deploy code → Backfill → Add constraint
6. **Monitor**: Check error rates and performance after migration
7. **Have rollback ready**: Know how to revert quickly

## Safe Migration Patterns

### Adding a Column

```sql
-- Step 1: Add nullable column (safe, no table lock)
ALTER TABLE users ADD COLUMN display_name TEXT;

-- Step 2: Deploy code that writes to new column

-- Step 3: Backfill existing data in batches
UPDATE users SET display_name = name WHERE display_name IS NULL LIMIT 1000;

-- Step 4: Add constraint if needed
ALTER TABLE users ALTER COLUMN display_name SET NOT NULL;
```

### Removing a Column

```sql
-- Step 1: Stop writing to column (deploy code change)
-- Step 2: Make column nullable (if not already)
-- Step 3: Wait (verify no reads)
-- Step 4: Remove column
```

## Quality Checks

- [ ] Migration tested on realistic data
- [ ] Rollback plan documented
- [ ] No data loss risk
- [ ] Minimal locking on production
- [ ] Monitored post-deployment

## Safety Rules

- Never run untested migrations on production
- Never modify existing migration files that have been run
- Always have a backup
- Break large migrations into smaller batches

## Coordinates With

- `database-schema-designer` — for schema changes
- `backup-rollback-planner` — for disaster recovery
