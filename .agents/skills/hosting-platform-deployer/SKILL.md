---
name: hosting-platform-deployer
description: Use when deploying websites to hosting platforms, configuring deployment settings, setting up domains, or managing production environments. Triggers on requests like "deploy to Vercel", "deploy website", "hosting setup", "Netlify deploy", "Cloudflare Pages", "production deployment", "custom domain", "SSL certificate", "go live", or when any deployment to a hosting platform is needed. Platform-aware for Vercel, Netlify, Cloudflare Pages, AWS, Google Cloud Run, Railway, Render, and Fly.io.
---

# Hosting Platform Deployer

## Goal
Deploy websites to hosting platforms with proper configuration, custom domains, and SSL.

## Do Not Use When
- Deployment is already configured
- Using Docker/Kubernetes exclusively

## Required Inputs To Inspect
- Hosting platform preference
- Framework (determines optimal platform)
- Custom domain needs
- Environment variables
- Database hosting needs

## Workflow

1. **Choose platform**: Match to framework and needs
2. **Create project**: Link repository or upload files
3. **Configure build**: Build command, output directory
4. **Set env vars**: All required environment variables
5. **Configure domain**: Custom domain, SSL
6. **Deploy**: Trigger deployment
7. **Verify**: Check site loads, features work
8. **Monitor**: Set up error tracking

See `references/platform-guides.md` for platform-specific deployment steps.

## Platform Quick Reference

| Platform | Best For | Key Feature |
|----------|----------|-------------|
| Vercel | Next.js | Edge functions, ISR |
| Netlify | Static, JAMstack | Forms, edge functions |
| Cloudflare Pages | Global edge | Workers integration |
| Railway | Full-stack | Easy databases |
| Render | Traditional | Long-running services |
| Fly.io | Docker | Global deployment |
| AWS/GCP | Enterprise | Full control |

## Quality Checks
- [ ] Site loads without errors
- [ ] Custom domain works
- [ ] SSL certificate active
- [ ] Environment variables set
- [ ] Build logs clean

## Coordinates With
- `deployment-preflight-checker` — for readiness checks
- `environment-config-manager` — for env vars
- `monitoring-logging-setup` — for post-deploy monitoring
