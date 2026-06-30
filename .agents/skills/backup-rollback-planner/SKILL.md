---
name: backup-rollback-planner
description: Use when planning database backups, creating rollback strategies, disaster recovery procedures, or managing data integrity for production applications. Triggers on requests like "backup strategy", "rollback plan", "disaster recovery", "database backup", "how to rollback", "data recovery", "point-in-time recovery", or when production data protection needs to be established. Provides backup automation, rollback procedures, and disaster recovery playbooks.
---

# Backup and Rollback Planner

## Goal
Implement automated backups with tested rollback procedures for disaster recovery.

## Do Not Use When
- No production data to protect
- Backup strategy already exists

## Required Inputs To Inspect
- Database type and size
- Data change frequency
- Recovery point objective (RPO)
- Recovery time objective (RTO)
- Storage solution

## Workflow

1. **Automated backups**: Daily automated backups
2. **Test restores**: Monthly restore test
3. **Document rollback**: Step-by-step rollback procedures
4. **Version deployments**: Tag releases for easy rollback
5. **Database migrations**: Reversible migrations
6. **Monitor backups**: Alert on backup failures

## Backup Strategy

| Type | Frequency | Retention |
|------|-----------|-----------|
| Full database | Daily | 30 days |
| Incremental | Hourly | 7 days |
| Before deployment | On demand | Until next deployment |

## Rollback Procedure

```
1. Identify the issue
2. Pause deployments
3. Restore database backup (if schema changed)
4. Revert code to previous version
5. Verify functionality
6. Communicate to team/users
7. Post-incident review
```

## Quality Checks
- [ ] Backups run automatically
- [ ] Restore tested successfully
- [ ] Rollback procedure documented
- [ ] Team knows rollback steps

## Safety Rules
- Always backup before deploying
- Test restores, don't assume they work
- Keep backups in different region from primary
- Encrypt backups at rest

## Coordinates With
- `database-migration-safety` — for migration rollbacks
- `hosting-platform-deployer` — for deployment versioning
