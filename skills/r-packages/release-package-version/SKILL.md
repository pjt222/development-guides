---
name: release-package-version
description: >
  Release a new version of an R package including version bumping,
  NEWS.md updates, git tagging, GitHub release creation, and
  post-release development version setup. Use when a package is ready
  for a new patch, minor, or major release, after CRAN acceptance to
  create the corresponding GitHub release, or when setting up the
  development version bump immediately after a release.
license: MIT
allowed-tools: Read Write Edit Bash Grep Glob
metadata:
  author: Philipp Thoss
  version: "1.0"
  domain: r-packages
  complexity: intermediate
  language: R
  tags: r, versioning, release, git-tags, changelog
---

# Release Package Version

Execute the full version release cycle for an R package.

## When to Use

- Ready to release a new version (bug fix, feature, or breaking change)
- After CRAN acceptance, creating a corresponding GitHub release
- Setting up post-release development version

## Inputs

- **Required**: Package with changes ready for release
- **Required**: Release type: patch (0.1.0 -> 0.1.1), minor (0.1.0 -> 0.2.0), or major (0.1.0 -> 1.0.0)
- **Optional**: Whether to submit to CRAN (default: no, use `submit-to-cran` skill separately)

## Procedure

### Step 1: Determine Version Bump

Follow semantic versioning:

| Change Type | Version Bump | Example |
|-------------|-------------|---------|
| Bug fixes only | Patch | 0.1.0 -> 0.1.1 |
| New features (backward compatible) | Minor | 0.1.0 -> 0.2.0 |
| Breaking changes | Major | 0.1.0 -> 1.0.0 |

### Step 2: Update Version

```r
usethis::use_version("minor")  # or "patch" or "major"
```

This updates the `Version` field in DESCRIPTION and adds a heading to NEWS.md.

**Expected**: DESCRIPTION version updated. NEWS.md has new section header.

### Step 3: Update NEWS.md

Fill in the release notes under the new version heading:

```markdown
# packagename 0.2.0

## New Features
- Added `new_function()` for processing data (#42)
- Support for custom themes in `plot_results()` (#45)

## Bug Fixes
- Fixed crash when input contains all NAs (#38)
- Corrected off-by-one error in `window_calc()` (#41)

## Minor Improvements
- Improved error messages for invalid input types
- Updated documentation examples
```

Use issue/PR numbers for traceability.

### Step 4: Final Checks

```r
devtools::check()
devtools::spell_check()
urlchecker::url_check()
```

**Expected**: All pass cleanly.

### Step 5: Commit Release

```bash
git add DESCRIPTION NEWS.md
git commit -m "Release packagename v0.2.0"
```

### Step 6: Tag the Release

```bash
git tag -a v0.2.0 -m "Release v0.2.0"
git push origin main --tags
```

### Step 7: Create GitHub Release

```bash
gh release create v0.2.0 \
  --title "packagename v0.2.0" \
  --notes-file NEWS.md
```

Or use:

```r
usethis::use_github_release()
```

**Expected**: GitHub release created with release notes.

### Step 8: Set Development Version

After release, bump to development version:

```r
usethis::use_dev_version()
```

This changes version to `0.2.0.9000` indicating development.

```bash
git add DESCRIPTION NEWS.md
git commit -m "Begin development for next version"
git push
```

## Validation

- [ ] Version in DESCRIPTION matches intended release
- [ ] NEWS.md has complete, accurate release notes
- [ ] `R CMD check` passes
- [ ] Git tag matches version (e.g., `v0.2.0`)
- [ ] GitHub release exists with release notes
- [ ] Post-release development version set (x.y.z.9000)

## Common Pitfalls

- **Forgetting to push tags**: `git push` alone doesn't push tags. Use `--tags` or `git push origin v0.2.0`
- **NEWS.md format**: Use markdown headers matching the pkgdown/CRAN expected format
- **Tagging wrong commit**: Always tag after the version-bump commit, not before
- **CRAN version already exists**: CRAN won't accept a version that's already been published. Always increment.
- **Development version in release**: Never submit a `.9000` version to CRAN

## Related Skills

- `submit-to-cran` - CRAN submission after version release
- `create-github-release` - general GitHub release creation
- `setup-github-actions-ci` - triggers pkgdown rebuild on release
- `build-pkgdown-site` - documentation site reflects new version
