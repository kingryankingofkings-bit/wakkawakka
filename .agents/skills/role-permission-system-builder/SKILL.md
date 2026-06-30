---
name: role-permission-system-builder
description: Use when implementing role-based access control (RBAC), permission systems, user roles, feature flags, or access management. Triggers on requests like "user roles", "permissions", "RBAC", "admin roles", "access control", "feature flags", "user groups", "authorization", "can user do X", or when different users need different access levels.
---

# Role and Permission System Builder

## Goal

Implement flexible, maintainable role-based access control with clear permission definitions.

## Do Not Use When

- All users have same access
- Using a third-party auth service with built-in RBAC (Clerk, Auth0)

## Required Inputs To Inspect

- Roles needed (admin, editor, viewer, etc.)
- Permissions per role
- Resource types to protect
- Frontend vs backend authorization

## Workflow

1. **Define roles**: Admin, Editor, Viewer, etc.
2. **Define permissions**: Granular actions (create:post, delete:user)
3. **Assign permissions to roles**: Role-permission matrix
4. **Assign roles to users**: User-role assignment
5. **Enforce on backend**: Middleware checks on every endpoint
6. **Enforce on frontend**: Hide/show UI based on permissions
7. **Add feature flags**: Toggle features per role or globally

## Permission Matrix

```
Permission      | Admin | Editor | Viewer
create:post     |   ✓   |   ✓    |   ✗
delete:post     |   ✓   |   ✗    |   ✗
manage:users    |   ✓   |   ✗    |   ✗
view:analytics  |   ✓   |   ✓    |   ✗
```

## Quality Checks

- [ ] Every protected endpoint checks permissions
- [ ] Frontend doesn't rely solely on UI hiding (backend enforces)
- [ ] Role changes reflect immediately
- [ ] Audit log for permission changes

## Safety Rules

- Always enforce authorization server-side
- Never trust client-side permission checks
- Log authorization failures
- Principle of least privilege

## Coordinates With

- `authentication-authorization-builder` — for auth integration
- `admin-dashboard-builder` — for admin role management
