# Platform Deployment Guides

## Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in project root
3. Follow prompts
4. For subsequent deploys: `vercel --prod`

## Netlify

1. Connect Git repo in Netlify dashboard
2. Set build command: `npm run build`
3. Set publish directory: `dist` or `.next`
4. Deploy automatically on push

## Cloudflare Pages

1. Connect Git repo in Cloudflare dashboard
2. Set build command and output directory
3. Deploy on push

## Railway

1. Install Railway CLI: `npm i -g @railway/cli`
2. Run `railway login`
3. Run `railway init`
4. Run `railway up`

## Render

1. Create `render.yaml` or use dashboard
2. Connect repo
3. Set build and start commands
4. Auto-deploy on push
