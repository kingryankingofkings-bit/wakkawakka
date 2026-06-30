---
name: database-schema-designer
description: Use when designing database schemas, creating data models, planning relationships, or structuring data storage for web applications. Triggers on requests like "design the database", "create the schema", "data model", "table structure", "relationships", "ER diagram", "Prisma schema", "Drizzle schema", or when building any feature that requires data persistence. Supports PostgreSQL, MySQL, SQLite, MongoDB, and ORM schemas (Prisma, Drizzle, TypeORM, Mongoose).
---

# Database Schema Designer

## Goal

Design normalized, performant database schemas with proper relationships, indexes, and constraints.

## Do Not Use When

- Using a backend-as-a-service with automatic schemas
- Schema is already defined and implemented
- The database is a simple key-value store

## Required Inputs To Inspect

- Domain model / entities from requirements
- Relationship cardinality (one-to-one, one-to-many, many-to-many)
- Query patterns (what will be read/written most)
- Performance requirements
- Data volume estimates

## Workflow

1. **Identify entities**: Nouns from requirements (User, Product, Order)
2. **Define attributes**: Columns/fields for each entity
3. **Establish relationships**: One-to-one, one-to-many, many-to-many
4. **Normalize to 3NF**: Eliminate redundancy, then denormalize if needed for performance
5. **Add constraints**: NOT NULL, UNIQUE, FOREIGN KEY, CHECK
6. **Add indexes**: On frequently queried columns, foreign keys
7. **Plan for migrations**: Schema versioning strategy
8. **Consider soft deletes**: `deleted_at` timestamp instead of hard delete
9. **Add audit fields**: `created_at`, `updated_at` on every table
10. **Document**: Entity relationship diagram or schema documentation

## Example Schema (Prisma)

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  posts     Post[]
}

model Post {
  id       String @id @default(cuid())
  title    String
  content  String
  author   User   @relation(fields: [authorId], references: [id])
  authorId String
}

enum Role {
  USER
  ADMIN
}
```

## Quality Checks

- [ ] No redundant data (normalized)
- [ ] All relationships have foreign keys
- [ ] Indexes on query columns
- [ ] Constraints prevent invalid data
- [ ] Audit fields present
- [ ] Soft deletes considered

## Safety Rules

- Never store passwords in plain text (use bcrypt/argon2)
- Use parameterized queries (ORM handles this)
- Don't expose auto-incrementing IDs publicly (use UUIDs/CUIDs)
- Back up before schema migrations

## Coordinates With

- `backend-api-architect` — API needs data
- `database-migration-safety` — for migrations
- `technical-architecture-planner` — for data flow
