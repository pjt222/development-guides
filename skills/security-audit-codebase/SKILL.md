---
name: security-audit-codebase
description: >
  Perform a security audit of a codebase checking for exposed secrets,
  vulnerable dependencies, injection vulnerabilities, insecure
  configurations, and OWASP Top 10 issues. Use before publishing or
  deploying a project, for periodic security reviews, after adding
  authentication or API integration, before open-sourcing a private
  repository, or when preparing for a security compliance audit.
license: MIT
allowed-tools: Read Write Edit Bash Grep Glob
metadata:
  author: Philipp Thoss
  version: "1.0"
  domain: general
  complexity: intermediate
  language: multi
  tags: security, audit, owasp, secrets, vulnerability
---

# Security Audit Codebase

Perform a systematic security review of a codebase to identify vulnerabilities and exposed secrets.

## When to Use

- Before publishing or deploying a project
- Periodic security review of existing projects
- After adding authentication, API integration, or user input handling
- Before open-sourcing a private repository
- Preparing for a security compliance audit

## Inputs

- **Required**: Codebase to audit
- **Optional**: Specific focus area (secrets, dependencies, injection, auth)
- **Optional**: Compliance framework (OWASP, ISO 27001, SOC 2)
- **Optional**: Previous audit findings for comparison

## Procedure

### Step 1: Scan for Exposed Secrets

Search for patterns that indicate hardcoded secrets:

```bash
# API keys and tokens
grep -rn "sk-\|ghp_\|gho_\|github_pat_\|hf_\|AKIA" --include="*.{md,js,ts,py,R,json,yml,yaml}" .

# Generic secret patterns
grep -rn "password\s*=\s*['\"]" --include="*.{js,ts,py,R,json}" .
grep -rn "api[_-]key\s*[=:]\s*['\"]" --include="*.{js,ts,py,R,json}" .
grep -rn "secret\s*[=:]\s*['\"]" --include="*.{js,ts,py,R,json}" .

# Connection strings
grep -rn "postgresql://\|mysql://\|mongodb://" .

# Private keys
grep -rn "BEGIN.*PRIVATE KEY" .
```

**Expected**: No real secrets found (only placeholders like `YOUR_TOKEN_HERE`).

**On finding secrets**: Remove immediately, rotate the exposed credential, and clean git history.

### Step 2: Check .gitignore Coverage

Verify sensitive files are excluded:

```bash
# Check that these are git-ignored
git check-ignore .env .Renviron credentials.json node_modules/

# Look for tracked sensitive files
git ls-files | grep -i "\.env\|\.renviron\|credentials\|secret"
```

### Step 3: Audit Dependencies

**Node.js**:

```bash
npm audit
npx audit-ci --moderate
```

**Python**:

```bash
pip-audit
safety check
```

**R**:

```r
# Check for known vulnerabilities in packages
# No built-in tool, but verify package sources
renv::status()
```

### Step 4: Check for Injection Vulnerabilities

**SQL Injection**:

```bash
# Look for string concatenation in queries
grep -rn "paste.*SELECT\|paste.*INSERT\|paste.*UPDATE\|paste.*DELETE" --include="*.R" .
grep -rn "query.*\+.*\|query.*\$\{" --include="*.{js,ts}" .
```

All database queries should use parameterized queries, not string concatenation.

**Command Injection**:

```bash
# Look for shell execution with user input
grep -rn "system\(.*paste\|exec(\|spawn(" --include="*.{R,js,ts,py}" .
```

**XSS (Cross-Site Scripting)**:

```bash
# Look for unescaped user content in HTML
grep -rn "innerHTML\|dangerouslySetInnerHTML\|v-html" --include="*.{js,ts,jsx,tsx,vue}" .
```

### Step 5: Review Authentication and Authorization

Checklist:
- [ ] Passwords hashed with bcrypt/argon2 (not MD5/SHA1)
- [ ] Session tokens are random and sufficiently long
- [ ] Authentication tokens have expiration
- [ ] API endpoints check authorization
- [ ] CORS configured restrictively
- [ ] CSRF protection enabled for state-changing operations

### Step 6: Check Configuration Security

```bash
# Debug mode in production configs
grep -rn "debug\s*[=:]\s*[Tt]rue\|DEBUG\s*=\s*1" --include="*.{json,yml,yaml,toml,cfg}" .

# Permissive CORS
grep -rn "Access-Control-Allow-Origin.*\*\|cors.*origin.*\*" --include="*.{js,ts}" .

# HTTP instead of HTTPS
grep -rn "http://" --include="*.{js,ts,py,R}" . | grep -v "localhost\|127.0.0.1\|http://"
```

### Step 7: Document Findings

Create an audit report:

```markdown
# Security Audit Report

**Date**: YYYY-MM-DD
**Auditor**: [Name]
**Scope**: [Repository/Project]
**Status**: [PASS/FAIL/CONDITIONAL]

## Findings Summary

| Category | Status | Details |
|----------|--------|---------|
| Exposed secrets | PASS | No secrets found |
| .gitignore | PASS | Sensitive files excluded |
| Dependencies | WARN | 2 moderate vulnerabilities |
| Injection | PASS | Parameterized queries used |
| Auth/AuthZ | N/A | No authentication in scope |
| Configuration | PASS | Debug mode disabled |

## Detailed Findings

### Finding 1: [Title]
- **Severity**: Low / Medium / High / Critical
- **Location**: `path/to/file:line`
- **Description**: What was found
- **Recommendation**: How to fix
- **Status**: Open / Resolved

## Recommendations
1. Update dependencies to fix moderate vulnerabilities
2. [Additional recommendations]
```

## Validation

- [ ] No hardcoded secrets in source code
- [ ] .gitignore covers all sensitive files
- [ ] No high/critical dependency vulnerabilities
- [ ] No injection vulnerabilities
- [ ] Authentication is properly implemented (if applicable)
- [ ] Audit report is complete and findings addressed

## Common Pitfalls

- **Only checking current files**: Secrets in git history are still exposed. Check with `git log -p --all -S 'secret_pattern'`.
- **Ignoring dev dependencies**: Development dependencies can still introduce supply chain risks.
- **False sense of security from `.gitignore`**: `.gitignore` only prevents future tracking. Already-committed files need `git rm --cached`.
- **Overlooking configuration files**: `docker-compose.yml`, CI configs, and deployment scripts often contain secrets.
- **Not rotating compromised credentials**: Finding and removing a secret isn't enough. The credential must be revoked and regenerated.

## Related Skills

- `configure-git-repository` - proper .gitignore setup
- `write-claude-md` - documenting security requirements
- `setup-gxp-r-project` - security in regulated environments
