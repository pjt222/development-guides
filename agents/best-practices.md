# Agent Development Best Practices

This guide outlines best practices for creating, maintaining, and using Claude Code agents effectively.

## Agent Design Principles

### 1. Single Responsibility Principle
Each agent should have a clear, focused purpose:
- **Good**: "Code Reviewer" - reviews code for quality and security
- **Bad**: "Development Helper" - vague, too broad

### 2. Clear Naming Conventions
Agent names should be descriptive and follow kebab-case:
- **Good**: `security-analyst`, `r-developer`, `test-engineer`
- **Bad**: `myAgent`, `helper_1`, `SecAnalyst`

### 3. Comprehensive Documentation
Every agent should include:
- Clear purpose statement
- Detailed capabilities list
- Usage examples
- Limitations and constraints
- Integration requirements

### 4. Appropriate Tool Selection
Only include tools the agent actually needs:
- **Good**: Security analyst uses `Read`, `Grep`, `Glob` for code analysis
- **Bad**: Documentation writer includes `Bash` unnecessarily

## Writing Effective Agents

### Agent Structure Template

```markdown
---
# Frontmatter with proper schema
---

# Agent Name
Clear, compelling introduction

## Purpose
What problem does this agent solve?

## Capabilities
What can this agent do?

## Usage Scenarios
When should users choose this agent?

## Examples
Concrete examples of agent interactions

## Limitations
What the agent cannot or should not do
```

### Description Guidelines

#### Frontmatter Description
- Keep to 1-2 sentences
- Focus on primary capability
- Use active voice
- Be specific about domain/language

```yaml
# Good
description: Reviews code changes and provides detailed feedback on security, performance, and best practices

# Bad
description: Helps with code stuff and makes things better
```

#### Detailed Documentation
- Start with a compelling overview
- Explain the specific problem the agent solves
- Provide context for when to use this agent vs others
- Include concrete, realistic examples

### Capability Documentation

#### Be Specific
```markdown
Good:
- **SQL Injection Detection**: Identifies parameterized query violations
- **XSS Prevention**: Scans for unescaped output in templates
- **Authentication Review**: Validates session management patterns

Bad:
- Finds security issues
- Checks for problems
- Makes code better
```

#### Group Related Capabilities
```markdown
## Security Analysis
- Vulnerability scanning (OWASP Top 10)
- Dependency audit (CVE checking)
- Configuration review

## Code Quality
- Style compliance checking
- Performance bottleneck identification
- Maintainability assessment
```

### Usage Examples

#### Provide Realistic Scenarios
```markdown
### Example 1: Pull Request Review
**User**: Review this authentication module for security issues
**Agent**: Found 3 critical issues:
1. Password stored in plaintext (line 42)
2. SQL injection vulnerability (line 67)
3. Missing rate limiting (endpoints lack protection)

**Recommendations**:
- Use bcrypt for password hashing
- Implement parameterized queries
- Add express-rate-limit middleware
```

#### Show Progressive Complexity
- Start with simple, common use cases
- Progress to advanced scenarios
- Include error handling examples

## Tool Integration Best Practices

### Tool Selection Strategy

#### Essential Tools Only
```yaml
# Security analyst - minimal but sufficient
tools: [Read, Grep, Glob, WebFetch]

# R developer - comprehensive for domain
tools: [Read, Write, Edit, Bash, Grep, Glob]
```

#### Tool Usage Patterns
- **Read/Grep/Glob**: Code analysis and discovery
- **Write/Edit**: Code generation and modification
- **Bash**: Running tests, builds, external tools
- **WebFetch**: Documentation lookup, CVE checking
- **Task**: Delegating complex sub-tasks

### MCP Server Integration

#### Document Dependencies Clearly
```yaml
mcp_servers: [r-mcptools, r-mcp-server]
```

```markdown
## MCP Server Requirements
- **r-mcptools**: Package management, help system
- **r-mcp-server**: Direct R code execution (optional)

### Setup Instructions
1. Install MCP servers: `claude mcp add r-mcptools ...`
2. Verify connection: `claude mcp list`
3. Test integration: Load agent and run example
```

### Skill Integration

Agents define *who* handles a task; skills define *how* specific procedures are executed. Connect them so users and agentic systems can discover which procedures each agent follows.

#### Referencing Skills
```yaml
# In frontmatter — use bare skill IDs (slash-command names)
skills:
  - create-r-package
  - write-testthat-tests
  - submit-to-cran
```

#### Documenting Skills in the Agent Body
Add an `## Available Skills` section after `## Capabilities`, listing each skill with a brief description:

```markdown
## Available Skills

- `create-r-package` — Scaffold a new R package with complete structure
- `write-testthat-tests` — Write testthat edition 3 tests with high coverage
```

Group by domain when the agent spans many domains; use a flat list for a small number of skills.

#### Keeping Skills in Sync
- Frontmatter `skills` array must match the `## Available Skills` section
- Both must reference skill IDs that exist in `skills/_registry.yml`
- Update `agents/_registry.yml` skills arrays when changing agent frontmatter

#### Graceful Degradation
Agents should work with reduced functionality if MCP servers are unavailable:

```markdown
## Functionality Matrix
| Feature | Without MCP | With r-mcptools | With r-mcp-server |
|---------|-------------|-----------------|-------------------|
| Code Review | Full | Enhanced | Enhanced |
| Package Install | Manual | Automated | Automated |
| Code Execution | None | Limited | Full |
```

## Quality Assurance

### Testing Your Agents

#### Functional Testing
1. **Basic Functionality**: Can the agent handle its primary use case?
2. **Error Handling**: How does it respond to invalid inputs?
3. **Tool Integration**: Do all specified tools work correctly?
4. **MCP Integration**: Does MCP server integration function as expected?

#### Content Review Checklist
- [ ] Agent name follows naming conventions
- [ ] Description is clear and specific
- [ ] All required schema fields present
- [ ] Tools list is minimal but complete
- [ ] Examples are realistic and helpful
- [ ] Limitations are clearly stated
- [ ] Skills list matches agent's domain expertise
- [ ] MCP dependencies documented
- [ ] Markdown formatting is correct
- [ ] YAML frontmatter validates

### Version Management

#### Semantic Versioning
- **1.0.0**: Initial stable release
- **1.1.0**: New features, backward compatible
- **1.0.1**: Bug fixes, documentation updates
- **2.0.0**: Breaking changes to interface

#### Change Documentation
```markdown
## Changelog

### v2.1.0 (2025-01-25)
- Added advanced statistical modeling capabilities
- Improved integration with r-mcp-server
- Enhanced error handling for edge cases

### v2.0.0 (2025-01-15)
- BREAKING: Changed tool requirements (removed WebFetch)
- Redesigned agent interface for better usability
- Major documentation overhaul
```

## Performance Optimization

### Context Management
- Keep agent descriptions concise but complete
- Use examples sparingly - quality over quantity
- Structure content for easy scanning
- Minimize redundant information

### Model Selection
```yaml
# For complex reasoning tasks (default)
model: sonnet

# For the most capable reasoning
model: opus

# For simple, fast responses
model: haiku
```

### Token Efficiency
- Use clear, direct language
- Avoid unnecessary verbosity
- Structure information hierarchically
- Include only essential examples

## Security Considerations

### Defensive Security Focus
All agents must prioritize defensive security:
- Vulnerability detection and remediation
- Security best practices education
- Defensive tool creation

### Data Handling
- Never hardcode secrets or credentials
- Use placeholders for sensitive information
- Document secure configuration practices
- Provide security warnings where appropriate

### Access Control
- Document required permissions clearly
- Use principle of least privilege
- Explain security implications of tool usage
- Provide secure defaults in examples

## Collaboration and Sharing

### Contributing to the Collection

#### Before Submitting
1. Test agent with multiple use cases
2. Review against best practices checklist
3. Validate YAML schema compliance
4. Check for naming conflicts
5. Ensure documentation completeness

#### Submission Process
1. Fork the repository
2. Create feature branch: `feature/agent-name`
3. Add agent following template structure
4. Update main README if needed
5. Submit pull request with detailed description

### Community Guidelines

#### Code of Conduct
- Be respectful and constructive in feedback
- Focus on improving agent quality and usability
- Share knowledge and best practices
- Help others learn and contribute

#### Review Standards
- Functionality: Does the agent work as described?
- Security: Are there any security concerns?
- Documentation: Is the agent well-documented?
- Standards: Does it follow established conventions?

## Maintenance and Updates

### Regular Maintenance
- Update dependencies and tool references
- Refresh examples with current syntax
- Review and update documentation
- Test compatibility with new Claude versions

### Deprecation Process
When retiring an agent:
1. Mark as deprecated in README
2. Update agent documentation with deprecation notice
3. Provide migration path to alternatives
4. Maintain for at least 6 months before removal

### Community Feedback Integration
- Monitor usage patterns and feedback
- Regular surveys of agent effectiveness
- Incorporate user suggestions and improvements
- Maintain changelog of community-driven updates

## Common Pitfalls to Avoid

### Over-Engineering
- Don't create agents for every minor task variation
- Avoid overly complex configuration schemas
- Keep tool lists minimal and focused

### Under-Documentation
- Don't assume users understand the domain
- Always provide concrete examples
- Explain limitations and edge cases

### Poor Tool Selection
- Don't include tools "just in case"
- Avoid tools that require special setup without documentation
- Test all tool interactions thoroughly

### Inconsistent Naming
- Follow established naming conventions
- Use consistent terminology across agents
- Avoid abbreviations and acronyms in names

By following these best practices, you'll create high-quality, maintainable agents that provide real value to the Claude Code community.
