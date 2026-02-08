---
name: deploy-to-vercel
description: >
  Deploy a Next.js application to Vercel. Covers project linking,
  environment variables, preview deployments, custom domains,
  and production deployment configuration.
license: MIT
allowed-tools: Read Write Edit Bash Grep Glob
metadata:
  author: Philipp Thoss
  version: "1.0"
  domain: web-dev
  complexity: basic
  language: TypeScript
  tags: vercel, deployment, nextjs, hosting, ci-cd
---

# Deploy to Vercel

Deploy a Next.js application to Vercel with production configuration.

## When to Use

- Deploying a Next.js app for the first time
- Setting up preview deployments for pull requests
- Configuring custom domains
- Managing environment variables in production

## Inputs

- **Required**: Next.js application that builds successfully locally
- **Required**: GitHub repository (recommended) or local project
- **Optional**: Custom domain
- **Optional**: Environment variables for production

## Procedure

### Step 1: Verify Local Build

```bash
npm run build
```

**Expected**: Build succeeds with no errors.

**On failure**: Fix build errors before deploying. Common: TypeScript errors, missing dependencies, invalid imports.

### Step 2: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 3: Link and Deploy

```bash
# Login to Vercel
vercel login

# Deploy (first time: creates project)
vercel

# Follow prompts:
# - Set up and deploy? Y
# - Which scope? (select your account)
# - Link to existing project? N (for new projects)
# - Project name: my-app
# - Directory: ./
# - Override settings? N
```

**Expected**: Preview URL provided (e.g., `https://my-app-xxx.vercel.app`).

### Step 4: Configure Environment Variables

```bash
# Add environment variables
vercel env add DATABASE_URL production
vercel env add API_KEY production preview

# List environment variables
vercel env ls
```

Or configure through the Vercel dashboard: Project Settings > Environment Variables.

### Step 5: Deploy to Production

```bash
vercel --prod
```

**Expected**: Production URL available (e.g., `https://my-app.vercel.app`).

### Step 6: Connect GitHub for Auto-Deploy (Recommended)

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Vercel automatically deploys on:
   - Push to main -> Production deployment
   - Pull request -> Preview deployment

### Step 7: Configure Custom Domain

```bash
vercel domains add my-domain.com
```

Or through dashboard: Project Settings > Domains.

Update DNS records as instructed by Vercel (typically CNAME or A record).

### Step 8: Optimize Configuration

Create `vercel.json` for advanced settings:

```json
{
  "framework": "nextjs",
  "regions": ["iad1"],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "no-store" }
      ]
    }
  ]
}
```

## Validation

- [ ] `npm run build` succeeds locally
- [ ] Preview deployment works and is accessible
- [ ] Production deployment serves the application correctly
- [ ] Environment variables are available in production
- [ ] Custom domain resolves (if configured)
- [ ] GitHub integration triggers deployments on push

## Common Pitfalls

- **Build failing on Vercel but not locally**: Vercel uses a clean environment. Ensure all dependencies are in `package.json`, not just installed globally.
- **Environment variables missing**: Variables must be added to Vercel, not just `.env.local`. Different environments (production, preview, development) have separate variable sets.
- **Node.js version mismatch**: Set the Node.js version in Project Settings or `package.json` engines field.
- **Large deployments**: Vercel has size limits. Use `.vercelignore` to exclude unnecessary files.
- **API route timeouts**: Vercel serverless functions have a 10s timeout on the Hobby plan. Optimize or upgrade.

## Related Skills

- `scaffold-nextjs-app` - create the app to deploy
- `setup-tailwind-typescript` - configure styling before deployment
- `configure-git-repository` - Git setup for auto-deploy integration
