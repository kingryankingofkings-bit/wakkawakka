---
name: admin-dashboard-builder
description: Use when building admin panels, dashboards, back-office interfaces, data management UIs, or internal tools. Triggers on requests like "admin panel", "dashboard", "admin interface", "back office", "manage users", "data table", "CRUD interface", "internal tool", "admin page", or when creating interfaces for managing application data. Provides patterns for data tables, filters, bulk actions, charts, and role-based admin access.
---

# Admin Dashboard Builder

## Goal

Build efficient admin interfaces for data management with tables, filters, forms, and analytics.

## Do Not Use When

- No admin functionality needed
- Using an existing admin framework (ActiveAdmin, etc.)

## Required Inputs To Inspect

- Entities to manage (users, orders, posts)
- CRUD operations needed
- Role-based access (who can do what)
- Analytics/metrics to display
- Export requirements

## Workflow

1. **Layout**: Sidebar navigation, main content area, header
2. **Data tables**: Sortable, filterable, paginated tables
3. **CRUD forms**: Create, edit forms with validation
4. **Bulk actions**: Select multiple, batch operations
5. **Search**: Full-text search across records
6. **Filters**: Date range, status, category filters
7. **Charts**: Key metrics visualization
8. **Export**: CSV, PDF export functionality
9. **Audit log**: Track admin actions
10. **Mobile**: Responsive admin for on-the-go

## Common Components

| Component     | Use                       |
| ------------- | ------------------------- |
| DataTable     | Sortable, filterable grid |
| StatCard      | Key metric display        |
| FilterBar     | Search + filters          |
| CRUDModal     | Create/edit form          |
| ConfirmDialog | Delete confirmation       |
| Pagination    | Page controls             |

## Quality Checks

- [ ] All CRUD operations work
- [ ] Filters combine correctly
- [ ] Bulk actions have confirmation
- [ ] Responsive on tablet
- [ ] Actions are audited

## Safety Rules

- Admin routes must be protected
- All admin actions logged
- Sensitive data masked in UI
- Rate limit admin endpoints

## Coordinates With

- `authentication-authorization-builder` — for admin auth
- `role-permission-system-builder` — for access control
- `search-filter-sort-builder` — for data tables
