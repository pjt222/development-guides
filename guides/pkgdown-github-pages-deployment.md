# pkgdown GitHub Pages Deployment Guide

This guide covers deploying R package documentation sites built with pkgdown to GitHub Pages, including common issues and best practices.

## Table of Contents
1. [Overview](#overview)
2. [Deployment Methods](#deployment-methods)
3. [Branch-Based Deployment (Recommended)](#branch-based-deployment-recommended)
4. [GitHub Actions Deployment](#github-actions-deployment)
5. [Common Issues](#common-issues)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)
8. [Migration Guide](#migration-guide)

## Overview

pkgdown is an R package that builds documentation websites for R packages. GitHub Pages provides free hosting for these sites. However, there are multiple deployment approaches, each with trade-offs.

### Key Decision Points
- **Development mode**: Can break GitHub Pages deployment
- **Deployment method**: Branch-based vs GitHub Actions
- **URL structure**: Root vs subdirectory deployment

## Deployment Methods

### Method 1: Branch-Based Deployment (Traditional)
- **Pros**: Reliable, well-tested, straightforward
- **Cons**: Requires gh-pages branch, slightly older approach
- **Best for**: Most projects, especially those having issues with Actions deployment

### Method 2: GitHub Actions Deployment (Modern)
- **Pros**: No separate branch needed, newer approach
- **Cons**: Can have configuration conflicts, less predictable
- **Best for**: New projects comfortable with Actions-only deployment

## Branch-Based Deployment (Recommended)

### Step 1: Create Workflow File

Create `.github/workflows/pkgdown-gh-pages.yaml`:

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  release:
    types: [published]
  workflow_dispatch:

name: pkgdown-gh-pages

jobs:
  pkgdown:
    runs-on: ubuntu-latest
    env:
      GITHUB_PAT: ${{ secrets.GITHUB_TOKEN }}
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4

      - uses: r-lib/actions/setup-pandoc@v2

      - uses: r-lib/actions/setup-r@v2
        with:
          use-public-rspm: true

      - uses: r-lib/actions/setup-r-dependencies@v2
        with:
          extra-packages: any::pkgdown, local::.
          needs: website

      - name: Build site
        run: pkgdown::build_site_github_pages(new_process = FALSE, install = FALSE)
        shell: Rscript {0}

      - name: Deploy to GitHub Pages
        uses: JamesIves/github-pages-deploy-action@v4
        with:
          folder: docs
          branch: gh-pages
          clean: true
```

### Step 2: Configure _pkgdown.yml

**Critical**: Disable development mode to ensure root-level deployment:

```yaml
url: https://yourusername.github.io/yourpackage/
template:
  bootstrap: 5
  
# IMPORTANT: Comment out or remove development mode for GitHub Pages
# development:
#   mode: auto
```

### Step 3: Configure GitHub Pages

1. Push your workflow to trigger the first build
2. Wait for workflow to complete and create gh-pages branch
3. Go to Settings → Pages
4. Set Source to "Deploy from a branch"
5. Select "gh-pages" branch and "/ (root)" folder
6. Click Save

### Step 4: Verify Deployment

- Check workflow runs: `gh workflow view pkgdown-gh-pages`
- Verify branch exists: `git branch -r | grep gh-pages`
- Test site: `curl -I https://yourusername.github.io/yourpackage/`

## GitHub Actions Deployment

If you prefer the newer GitHub Actions deployment:

### Workflow Configuration

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  release:
    types: [published]
  workflow_dispatch:

name: pkgdown

permissions: read-all

jobs:
  pkgdown:
    runs-on: ubuntu-latest
    concurrency:
      group: pkgdown-${{ github.event_name != 'pull_request' || github.run_id }}
    env:
      GITHUB_PAT: ${{ secrets.GITHUB_TOKEN }}
    permissions:
      contents: write
      pages: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: r-lib/actions/setup-pandoc@v2
      - uses: r-lib/actions/setup-r@v2
        with:
          use-public-rspm: true
      - uses: r-lib/actions/setup-r-dependencies@v2
        with:
          extra-packages: any::pkgdown, local::.
          needs: website
      - name: Build site
        run: pkgdown::build_site_github_pages(new_process = FALSE, install = FALSE)
        shell: Rscript {0}
      - name: Setup Pages
        if: github.event_name != 'pull_request'
        uses: actions/configure-pages@v4
      - name: Upload artifact
        if: github.event_name != 'pull_request'
        uses: actions/upload-pages-artifact@v3
        with:
          path: docs
      - name: Deploy to GitHub Pages
        if: github.event_name != 'pull_request'
        id: deployment
        uses: actions/deploy-pages@v4
```

### GitHub Settings

1. Go to Settings → Pages
2. Set Source to "GitHub Actions"
3. No branch selection needed

## Common Issues

### Issue 1: 404 Error with Development Mode

**Symptom**: Site returns 404 even though deployment succeeds

**Cause**: Development mode in `_pkgdown.yml` causes site to build in subdirectory:
```yaml
development:
  mode: auto  # This causes /dev/ subdirectory
```

**Solution**: Comment out or remove development mode:
```yaml
# development:
#   mode: auto
```

### Issue 2: Deployment Creates But Site Doesn't Work

**Symptom**: Workflow succeeds, deployment created, but site still 404

**Cause**: Mismatch between GitHub Pages configuration and deployment method

**Solution**: 
- If using branch deployment workflow → Set Pages to "Deploy from a branch"
- If using Actions deployment workflow → Set Pages to "GitHub Actions"

### Issue 3: No Deployments Created

**Symptom**: Workflow succeeds but no deployments appear in repo

**Cause**: Missing permissions or incorrect workflow configuration

**Solution**: Ensure workflow has correct permissions:
```yaml
permissions:
  contents: write
  pages: write      # For Actions deployment
  id-token: write   # For Actions deployment
```

## Best Practices

### 1. Choose One Deployment Method
Don't mix branch-based and Actions-based deployment. Pick one and stick with it.

### 2. Disable Development Mode for Production
Always disable development mode in `_pkgdown.yml` for GitHub Pages deployment:
```yaml
# Comment out for GitHub Pages
# development:
#   mode: auto
```

### 3. Use Consistent URLs
Ensure your `_pkgdown.yml` URL matches your GitHub Pages URL:
```yaml
url: https://username.github.io/package/
```

### 4. Test Locally First
```r
# Test your pkgdown site locally
pkgdown::build_site()

# Preview at http://localhost:3000
pkgdown::preview_site()
```

### 5. Monitor Deployments
```bash
# Check workflow status
gh workflow view pkgdown-gh-pages

# Check recent runs
gh run list --workflow=pkgdown-gh-pages

# Check deployment status
gh api repos/USER/REPO/deployments
```

## Troubleshooting

### Debugging Checklist

1. **Check GitHub Pages Settings**
   ```bash
   gh api repos/USER/REPO/pages
   ```

2. **Verify Branch Exists** (for branch deployment)
   ```bash
   git ls-remote --heads origin gh-pages
   ```

3. **Check Workflow Logs**
   ```bash
   gh run view --log
   ```

4. **Verify Site Structure**
   ```bash
   # For branch deployment
   gh api 'repos/USER/REPO/contents?ref=gh-pages' --jq '.[].name'
   ```

5. **Test URL Directly**
   ```bash
   curl -I https://username.github.io/package/
   ```

### Common Error Messages

**"There isn't a cname for this page"**
- This is normal for github.io domains, not an error

**"Invalid request... missing pages_build_version, oidc_token"**
- Indicates Actions deployment configuration issue
- Switch to branch-based deployment

**Site builds in `/dev/` subdirectory**
- Development mode is enabled
- Comment out `development: mode: auto`

## Migration Guide

### From Actions to Branch Deployment

1. Create new workflow file with branch deployment
2. Disable or remove Actions deployment workflow
3. Push changes to trigger new workflow
4. Update GitHub Pages settings to use branch
5. Verify site works at expected URL

### From Branch to Actions Deployment

1. Update workflow to use Actions deployment
2. Change GitHub Pages settings to "GitHub Actions"
3. Delete gh-pages branch (optional)
4. Trigger new deployment

### Rollback Procedure

If deployment fails:

1. **Quick Fix**: Re-enable previous workflow
2. **Branch Deployment**: 
   ```bash
   # Force push previous good gh-pages
   git checkout gh-pages
   git reset --hard <last-good-commit>
   git push --force origin gh-pages
   ```
3. **Actions Deployment**: Revert workflow changes

## Example Configurations

### Minimal Branch Deployment
```yaml
name: pkgdown
on:
  push:
    branches: [main]

jobs:
  pkgdown:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      - uses: r-lib/actions/setup-pandoc@v2
      - uses: r-lib/actions/setup-r@v2
      - uses: r-lib/actions/setup-r-dependencies@v2
        with:
          extra-packages: any::pkgdown, local::.
          needs: website
      - run: pkgdown::build_site_github_pages(new_process = FALSE, install = FALSE)
        shell: Rscript {0}
      - uses: JamesIves/github-pages-deploy-action@v4
        with:
          folder: docs
          branch: gh-pages
```

### Production-Ready Configuration
See the complete workflow examples above for full production configurations with:
- Multiple triggers (push, PR, release, manual)
- Proper error handling
- Conditional deployment (skip on PRs)
- Full permissions setup

## Resources

- [pkgdown documentation](https://pkgdown.r-lib.org/)
- [GitHub Pages documentation](https://docs.github.com/en/pages)
- [r-lib/actions examples](https://github.com/r-lib/actions/tree/v2/examples)
- [JamesIves/github-pages-deploy-action](https://github.com/JamesIves/github-pages-deploy-action)

## Summary

For most R packages, branch-based deployment with development mode disabled provides the most reliable GitHub Pages deployment. The key is ensuring consistency between your deployment method, GitHub Pages settings, and pkgdown configuration.

Remember: **Always disable development mode for GitHub Pages!**