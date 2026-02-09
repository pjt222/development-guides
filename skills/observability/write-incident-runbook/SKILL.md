---
name: write-incident-runbook
description: >
  Create structured incident runbooks with diagnostic steps, resolution procedures, escalation
  paths, and communication templates for effective incident response.
license: MIT
allowed-tools: Read Write Edit Bash Grep Glob
metadata:
  author: Philipp Thoss
  version: "1.0"
  domain: observability
  complexity: basic
  language: multi
  tags: runbook, incident-response, diagnostics, escalation, documentation
---

# Write Incident Runbook

Create actionable runbooks that guide responders through incident diagnosis and resolution.

## When to Use

- Documenting response procedures for recurring alerts or incidents
- Standardizing incident response across on-call rotation members
- Reducing mean time to resolution (MTTR) with clear diagnostic steps
- Creating training materials for new team members on incident handling
- Establishing escalation paths and communication protocols
- Migrating tribal knowledge to written documentation
- Linking alerts to resolution procedures (alert annotations)

## Inputs

- **Required**: Incident or alert name/description
- **Required**: Historical incident data and resolution patterns
- **Optional**: Diagnostic queries (Prometheus, logs, traces)
- **Optional**: Escalation contacts and communication channels
- **Optional**: Previous incident post-mortems

## Procedure

### Step 1: Choose Runbook Template Structure

Select an appropriate template based on incident type and complexity.

**Basic runbook template**:

```markdown
# [Alert/Incident Name] Runbook

## Overview
Brief description of what this alert/incident represents and its business impact.

## Severity
- **Critical**: Immediate customer impact, requires page
- **High**: Degraded service, requires immediate attention
- **Medium**: Non-urgent but needs investigation
- **Low**: Informational, track for trends

## Symptoms
What the user/system experiences when this incident occurs.

## Diagnostic Steps
1. Step-by-step investigation procedures
2. Queries to run, dashboards to check
3. Expected vs actual values

## Resolution Steps
1. Step-by-step remediation procedures
2. Configuration changes, restarts, rollbacks
3. Verification steps

## Escalation
When to escalate and who to contact.

## Communication
Template messages for stakeholders.

## Prevention
Long-term fixes to prevent recurrence.

## Related
Links to dashboards, logs, documentation.
```

**Advanced SRE runbook template**:

```markdown
# [Service Name] - [Incident Type] Runbook

## Metadata
- **Service**: service-name
- **Owned By**: team-name
- **Severity**: Critical/High/Medium/Low
- **On-Call**: [PagerDuty/Opsgenie rotation link]
- **Last Updated**: YYYY-MM-DD
- **Version**: 1.0

## Overview
### What is this incident?
Detailed description of the failure mode.

### Business Impact
- Customer-facing impact
- SLO/SLA implications
- Revenue/reputation impact

### Success Criteria
How do you know the incident is resolved?

## Diagnostic Phase

### Quick Health Check (< 5 minutes)
Rapid assessment to understand scope and severity.

- [ ] Check service dashboard: [link]
- [ ] Verify error rate: [Prometheus query]
- [ ] Check recent deployments: [CI/CD link]

### Detailed Investigation (5-20 minutes)
Deep dive to identify root cause.

#### Metrics to Check
```promql
# Example queries
rate(http_requests_total{status=~"5.."}[5m])
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))
```

#### Logs to Review
```logql
# Loki query examples
{job="api-service"} |= "error" | json | level="error"
```

#### Traces to Examine
Look for trace IDs in error logs, search in Tempo/Jaeger.

#### Common Failure Patterns
1. **Pattern A**: Symptoms and investigation steps
2. **Pattern B**: Symptoms and investigation steps

## Resolution Phase

### Immediate Mitigation (< 15 minutes)
Stop the bleeding before fixing root cause.

1. **Option A: Rollback**
   ```bash
   # Commands to rollback deployment
   kubectl rollout undo deployment/api-service
   ```

2. **Option B: Scale Up**
   ```bash
   # Commands to increase capacity
   kubectl scale deployment/api-service --replicas=10
   ```

3. **Option C: Failover**
   Steps to switch to backup/secondary system.

### Root Cause Remediation
Permanent fix for the underlying issue.

1. Step 1 with detailed commands
2. Step 2 with verification checks
3. Step 3 with rollback procedure

### Verification
Confirm incident is resolved and system is healthy.

- [ ] Error rate back to normal: [query]
- [ ] Latency within SLO: [query]
- [ ] Customer-facing features working: [test links]
- [ ] No new alerts firing

## Escalation

### When to Escalate
- Unable to identify root cause within 20 minutes
- Mitigation attempts fail
- Customer impact exceeds SLO tolerance
- Requires domain expertise not available

### Escalation Path
1. **Primary On-Call**: [contact method]
2. **Secondary On-Call**: [contact method]
3. **Team Lead**: [contact method]
4. **Incident Commander**: [contact method]

## Communication

### Internal Communication
**Slack Channel**: #incident-response

**Initial Message Template**:
```
🚨 INCIDENT: [Title]
Severity: [Critical/High/Medium]
Impact: [Description]
Status: Investigating
Owner: @username
Dashboard: [link]
```

**Update Template** (every 15-30 minutes):
```
📊 UPDATE: [Title]
Current Status: [In Progress/Mitigated/Resolved]
Actions Taken: [Summary]
Next Steps: [Plan]
ETA: [Estimated resolution time]
```

**Resolution Message Template**:
```
✅ RESOLVED: [Title]
Duration: [Time to resolution]
Impact: [Final customer impact assessment]
Root Cause: [Brief explanation]
Post-Mortem: [Link to doc]
```

### External Communication
**Status Page Update Template**:
```
We are currently investigating reports of [issue description].
Our team is actively working to resolve this issue.
We will provide updates every 30 minutes.
Next update: [time]
```

## Prevention

### Short-Term Actions
- Immediate fixes that reduce likelihood of recurrence.

### Long-Term Actions
- Architectural improvements
- SLO adjustments
- Monitoring enhancements
- Team training needs

## Post-Incident

### Post-Mortem Template
[Link to post-mortem template]

### Key Questions
1. What was the root cause?
2. Why did monitoring not detect earlier?
3. What could have prevented this?
4. What should we change?

## Related Resources

### Dashboards
- [Service Overview Dashboard]
- [Error Rate Dashboard]
- [Latency Dashboard]

### Logs
- [Loki Query Link]
- [Kibana Dashboard]

### Traces
- [Tempo/Jaeger Search]

### Documentation
- [Architecture Diagram]
- [Service Dependencies]
- [Configuration Guide]

### Historical Incidents
- [Previous similar incidents]
- [Post-mortems]

## Revision History
| Date | Author | Changes |
|------|--------|---------|
| 2024-01-15 | @user | Initial version |
```

**Expected:** Template selected matches incident complexity, sections appropriate for service type.

**On failure:**
- Start with basic template, iterate based on incident patterns
- Review industry examples (Google SRE books, vendor runbooks)
- Adapt template based on team feedback after first use

### Step 2: Document Diagnostic Procedures

Create step-by-step investigation procedures with specific queries.

**Diagnostic checklist example**:

```markdown
## Diagnostic Procedures

### 1. Verify Service Health

**Check if service is responding**:
```bash
curl -I https://api.example.com/health
# Expected: HTTP 200 OK
# On failure: Check if all pods/instances are down
```

**Prometheus query for service uptime**:
```promql
up{job="api-service"}
# Expected: 1 for all instances
# If 0: Service instance is down, check logs
```

### 2. Check Error Rate

**Current error rate**:
```promql
sum(rate(http_requests_total{job="api-service",status=~"5.."}[5m]))
/ sum(rate(http_requests_total{job="api-service"}[5m])) * 100
# Expected: < 1%
# If > 5%: Critical issue, proceed to step 3
```

**Error breakdown by endpoint**:
```promql
sum by (path, status) (
  rate(http_requests_total{job="api-service",status=~"5.."}[5m])
)
# Identify which endpoint is failing
```

### 3. Analyze Logs

**Recent errors from Loki**:
```logql
{job="api-service"} |= "error" | json | level="error"
# Look for common error messages
# Check for trace IDs to investigate specific requests
```

**Top error messages** (last 15 minutes):
```logql
topk(10,
  sum by (message) (
    count_over_time({job="api-service"} |= "error" [15m])
  )
)
```

### 4. Check Resource Utilization

**CPU usage**:
```promql
avg(rate(container_cpu_usage_seconds_total{pod=~"api-service.*"}[5m])) * 100
# Expected: < 70%
# If > 90%: CPU saturation, consider scaling
```

**Memory usage**:
```promql
avg(container_memory_working_set_bytes{pod=~"api-service.*"})
/ avg(container_spec_memory_limit_bytes{pod=~"api-service.*"}) * 100
# Expected: < 80%
# If > 95%: Memory pressure, check for leaks
```

**Database connection pool**:
```promql
sum(db_connection_pool_active{service="api-service"})
/ sum(db_connection_pool_max{service="api-service"}) * 100
# Expected: < 80%
# If > 95%: Connection pool exhaustion
```

### 5. Review Recent Changes

**Check recent deployments**:
```bash
kubectl rollout history deployment/api-service
# Identify if incident started after deployment
```

**Git commits since last stable version**:
```bash
git log --oneline --since="2 hours ago"
# Review changes that might have introduced issue
```

**Infrastructure changes**:
- Check for recent Terraform/CloudFormation applies
- Review configuration changes (ConfigMaps, Secrets)
- Verify DNS/networking changes

### 6. Examine Dependencies

**Check downstream service health**:
```promql
up{job=~"(database|cache|message-queue)"}
# Verify all dependencies are up
```

**Database query latency**:
```promql
histogram_quantile(0.99,
  rate(db_query_duration_seconds_bucket[5m])
)
# Expected: < 100ms
# If > 1s: Database performance issue
```

**External API latency**:
```promql
histogram_quantile(0.99,
  rate(http_request_duration_seconds_bucket{job="api-service",path=~"/external/.*"}[5m])
)
# Identify slow external dependencies
```
```

**Common failure pattern decision tree**:

```markdown
## Failure Pattern Decision Tree

### Is the service responding to health checks?
- **No** → Proceed to "Service Down" section
- **Yes** → Continue to error rate check

### Is error rate elevated?
- **No** → Check latency metrics
- **Yes** → Continue to error analysis

### What type of errors?
- **500 Internal Server Error** → Check application logs for exceptions
- **502/503/504 Gateway errors** → Check load balancer and upstream services
- **Database errors** → Check database connection pool and query performance
- **Timeout errors** → Check latency metrics and resource saturation

### When did it start?
- **After recent deployment** → Consider rollback
- **Gradually increasing** → Resource exhaustion or memory leak
- **Sudden spike** → Traffic surge or external dependency failure

### Is it affecting all requests or specific endpoints?
- **All endpoints** → Infrastructure issue (CPU, memory, network)
- **Specific endpoint** → Application logic bug or database query issue
```

**Expected:** Diagnostic procedures are specific, include expected vs actual values, guide responder through investigation.

**On failure:**
- Test queries in actual monitoring system before documenting
- Include screenshots of dashboards for visual reference
- Add "Common mistakes" section for frequently missed steps
- Iterate based on feedback from incident responders

### Step 3: Define Resolution Procedures

Document step-by-step remediation with rollback options.

**Resolution procedure example**:

```markdown
## Resolution Procedures

### Option 1: Rollback Deployment (Fastest)

**When to use**: Error rate spiked after recent deployment.

**Steps**:

1. **Verify current deployment version**:
   ```bash
   kubectl describe deployment api-service | grep Image:
   # Note the current version
   ```

2. **Rollback to previous version**:
   ```bash
   kubectl rollout undo deployment/api-service
   ```
   **Expected**: Rollback initiates, new pods start.
   **On failure**: Check if previous ReplicaSet still exists: `kubectl get rs -l app=api-service`

3. **Monitor rollback progress**:
   ```bash
   kubectl rollout status deployment/api-service
   # Wait for "successfully rolled out"
   ```

4. **Verify error rate decreasing**:
   ```promql
   rate(http_requests_total{job="api-service",status=~"5.."}[5m])
   ```
   **Expected**: Error rate drops within 2-3 minutes.
   **On failure**: Rollback further to last known good version.

5. **Confirm resolution**:
   - [ ] Error rate < 1%
   - [ ] Latency P99 < 200ms
   - [ ] No new alerts firing
   - [ ] Sample user requests succeeding

### Option 2: Scale Up Resources

**When to use**: High CPU/memory usage, connection pool exhaustion.

**Steps**:

1. **Check current replica count**:
   ```bash
   kubectl get deployment api-service
   ```

2. **Scale up by 50%**:
   ```bash
   current_replicas=$(kubectl get deployment api-service -o jsonpath='{.spec.replicas}')
   new_replicas=$((current_replicas * 3 / 2))
   kubectl scale deployment/api-service --replicas=$new_replicas
   ```

3. **Monitor resource usage**:
   ```promql
   avg(rate(container_cpu_usage_seconds_total{pod=~"api-service.*"}[5m])) * 100
   ```
   **Expected**: CPU usage drops below 70% within 5 minutes.

4. **Verify error rate improvement**:
   If error rate doesn't decrease after scaling, proceed to Option 3.

### Option 3: Restart Service

**When to use**: Memory leak, connection pool stuck, cache corruption.

**Steps**:

1. **Perform rolling restart**:
   ```bash
   kubectl rollout restart deployment/api-service
   ```

2. **Monitor pod restarts**:
   ```bash
   kubectl get pods -l app=api-service -w
   # Watch pods terminate and start
   ```

3. **Check for CrashLoopBackOff**:
   ```bash
   kubectl get pods -l app=api-service | grep -i crash
   ```
   **On failure**: Pods failing to start, check logs: `kubectl logs -l app=api-service --tail=50`

4. **Verify service recovery**:
   - [ ] All pods in Running state
   - [ ] Health check returning 200 OK
   - [ ] Error rate back to baseline

### Option 4: Enable Feature Flag / Circuit Breaker

**When to use**: Specific feature causing errors, external dependency failing.

**Steps**:

1. **Identify problematic feature**:
   ```promql
   sum by (feature_flag) (
     rate(http_requests_total{status=~"5..",job="api-service"}[5m])
   )
   ```

2. **Disable feature flag**:
   ```bash
   kubectl set env deployment/api-service FEATURE_NEW_CHECKOUT=false
   # Or update ConfigMap
   kubectl patch configmap api-config -p '{"data":{"feature.new-checkout":"false"}}'
   kubectl rollout restart deployment/api-service
   ```

3. **Enable circuit breaker** (if application supports):
   ```bash
   curl -X POST http://api-service:8080/admin/circuit-breaker/open \
     -d '{"service": "payment-gateway"}'
   ```

4. **Monitor error rate**:
   Errors should stop immediately if feature is the cause.

### Option 5: Database Remediation

**When to use**: Database connection errors, slow queries, connection pool exhaustion.

**Steps**:

1. **Check database connections**:
   ```sql
   -- PostgreSQL
   SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

   -- MySQL
   SHOW PROCESSLIST;
   ```

2. **Kill long-running queries** (if identified as cause):
   ```sql
   -- PostgreSQL
   SELECT pg_terminate_backend(pid) FROM pg_stat_activity
   WHERE state = 'active' AND query_start < now() - interval '5 minutes';
   ```

3. **Restart connection pool** (application-level):
   ```bash
   curl -X POST http://api-service:8080/admin/db/restart-pool
   ```

4. **Increase connection pool size** (temporary):
   ```bash
   kubectl set env deployment/api-service DB_POOL_MAX_SIZE=50
   ```

### Verification Checklist

After any resolution attempt, verify:

- [ ] **Error rate**: `rate(http_requests_total{status=~"5.."}[5m]) < 1%`
- [ ] **Latency**: `histogram_quantile(0.99, ...) < 200ms`
- [ ] **Throughput**: `rate(http_requests_total[5m]) >= baseline`
- [ ] **Resource usage**: CPU < 70%, Memory < 80%
- [ ] **Downstream services**: All dependencies healthy
- [ ] **User-facing tests**: Sample transactions succeeding
- [ ] **Alerts**: No active critical alerts
```

**Rollback procedures**:

```markdown
## Rollback Procedure

If resolution attempt makes situation worse:

1. **Stop ongoing changes**:
   ```bash
   # Pause deployments
   kubectl rollout pause deployment/api-service

   # Cancel scaling operations
   kubectl scale deployment/api-service --replicas=<previous-count>
   ```

2. **Revert configuration changes**:
   ```bash
   # Revert environment variable
   kubectl set env deployment/api-service FEATURE_FLAG-

   # Restore previous ConfigMap
   kubectl apply -f configmap-backup.yaml
   ```

3. **Resume normal operations**:
   ```bash
   kubectl rollout resume deployment/api-service
   ```

4. **Reassess situation**:
   Return to diagnostic phase with new information.
```

**Expected:** Resolution steps are clear, include verification checks, provide rollback options for each action.

**On failure:**
- Add more granular steps for complex procedures
- Include screenshots or diagrams for multi-step processes
- Document command outputs (expected vs actual)
- Create separate runbook for complex resolution procedures

### Step 4: Establish Escalation Paths

Define when and how to escalate incidents.

**Escalation criteria and contacts**:

```markdown
## Escalation Guidelines

### When to Escalate

Escalate **immediately** if:
- Customer-facing outage exceeds 15 minutes
- SLO error budget depleted by more than 10% in single incident
- Data loss or corruption suspected
- Security breach suspected
- Unable to identify root cause within 20 minutes
- Mitigation attempts fail or make situation worse

Escalate **proactively** if:
- Incident requires expertise outside on-call's domain
- Coordinated response needed across multiple teams
- Decision required that exceeds on-call authority
- Incident complexity suggests extended resolution time

### Escalation Levels

#### Level 1: Primary On-Call (You)
- **Initial response**: 5 minutes
- **Authority**: Deploy fixes, rollback, scale resources
- **Duration**: Up to 30 minutes solo investigation

#### Level 2: Secondary On-Call
- **Contact**: PagerDuty escalation (automatic after 15 min)
- **Phone**: +1-555-0100 (backup)
- **Authority**: Same as L1, provides additional investigation support
- **When**: Primary on-call needs help or after 20 min without progress

#### Level 3: Team Lead / Senior Engineer
- **Contact**: @team-lead (Slack), +1-555-0101 (emergency)
- **Authority**: Architectural decisions, database changes, external vendor escalation
- **When**:
  - Requires database schema changes
  - Needs architectural decision
  - Incident exceeds 1 hour

#### Level 4: Incident Commander
- **Contact**: @incident-commander (Slack), +1-555-0102
- **Authority**: Cross-team coordination, customer communication, executive updates
- **When**:
  - Multiple teams involved
  - Customer communication required
  - Incident exceeds 2 hours or high visibility

#### Level 5: Executive / C-Level
- **Contact**: VP Engineering @vp-eng, CTO @cto
- **When**:
  - Major customer impact (> 50% of users)
  - SLA breach imminent
  - Media/PR implications
  - Extended outage (> 4 hours)

### Escalation Process

1. **Notify escalation target**:
   ```
   @secondary-oncall I'm escalating [incident-name].
   Current status: [brief summary]
   Impact: [affected users/services]
   Actions taken: [what you've tried]
   Requesting: [specific help needed]
   Dashboard: [link]
   ```

2. **Handoff if needed**:
   - Share incident timeline
   - Document actions taken
   - Provide access to relevant systems
   - Remain available for questions

3. **Don't go silent**:
   - Continue posting updates every 15 minutes
   - Ask questions if stuck
   - Provide feedback on effectiveness of escalation

### Contact Directory

| Role | Slack | Phone | PagerDuty |
|------|-------|-------|-----------|
| Platform Primary | @platform-oncall | +1-555-0100 | [schedule link] |
| Platform Secondary | @platform-secondary | +1-555-0101 | [schedule link] |
| Database Team | @dba-oncall | +1-555-0200 | [schedule link] |
| Security Team | @security-oncall | +1-555-0300 | [schedule link] |
| Network Team | @network-oncall | +1-555-0400 | [schedule link] |
| Incident Commander | @incident-cmd | +1-555-0500 | [schedule link] |

### External Vendor Escalation

#### AWS Support
- **Critical**: +1-877-XXX-XXXX
- **Account**: 1234-5678-9012
- **Support Portal**: https://console.aws.amazon.com/support

#### Database Vendor (e.g., MongoDB)
- **Critical**: +1-844-XXX-XXXX
- **Account**: MONGO-12345
- **Support Portal**: https://support.mongodb.com

#### CDN Provider (e.g., Cloudflare)
- **Critical**: +1-888-XXX-XXXX
- **Account**: CF-67890
```

**Expected:** Clear criteria for escalation, contact information readily accessible, escalation paths aligned with organizational structure.

**On failure:**
- Validate contact information is current (test quarterly)
- Add decision tree for when to escalate
- Include examples of escalation messages
- Document response time expectations for each level

### Step 5: Create Communication Templates

Provide pre-written messages for incident updates.

**Internal communication templates**:

```markdown
## Communication Templates

### Initial Incident Declaration

**Slack #incident-response**:
```
🚨 **INCIDENT DECLARED**
**Title**: [Brief descriptive title]
**Severity**: Critical / High / Medium
**Status**: Investigating
**Impact**: [Number of affected users/services]
**Owner**: @username
**Started**: [HH:MM UTC]
**Dashboard**: [Link]
**War Room**: #incident-[YYYYMMDD-NNN]

Quick Summary: [1-2 sentences on what's wrong and initial assessment]

Next update in 15 minutes.
```

### Progress Update (Every 15-30 minutes)

```
📊 **UPDATE #N** - [HH:MM UTC]
**Status**: Investigating / Mitigating / Monitoring
**Actions Taken**:
- [Action 1] - [Outcome]
- [Action 2] - [Outcome]

**Current Theory**: [What we think is happening]

**Next Steps**:
- [Planned action 1]
- [Planned action 2]

**Impact Update**: [Any change in scope/severity]

Next update in 15 minutes or upon significant change.
```

### Mitigation Announcement

```
✅ **MITIGATION COMPLETE** - [HH:MM UTC]
**Mitigation**: [What was done to stop the bleeding]
**Status**: Monitoring for stability

**Metrics**:
- Error rate: [Before] → [After]
- Latency P99: [Before] → [After]
- Affected users: [Estimate]

**Root Cause**: [Brief explanation or "Under investigation"]

Continuing to monitor for 30 minutes before declaring resolved.
Next update in 15 minutes.
```

### Incident Resolution

```
🎉 **INCIDENT RESOLVED** - [HH:MM UTC]
**Duration**: [Total time from start to resolution]
**Final Status**: Resolved

**Summary**:
- **Root Cause**: [Detailed explanation]
- **Impact**: [Final assessment of customer impact]
- **Resolution**: [What fixed it]

**Follow-up Actions**:
- [ ] Post-mortem scheduled: [Date/time]
- [ ] Monitoring alerts updated
- [ ] Prevention work tracked: [Jira/Linear ticket]

**Dashboard**: [Link to incident metrics]

Thank you to everyone who helped resolve this incident.
```

### False Alarm / Resolved Without Action

```
ℹ️ **FALSE ALARM / AUTO-RESOLVED** - [HH:MM UTC]
**Status**: Closed

**Initial Report**: [What triggered investigation]
**Investigation Outcome**: [Why it wasn't actually an incident]
**Action Taken**: None required

No customer impact.
No follow-up needed.
```

### External Status Page Updates

**Initial Post** (within 5 minutes of customer impact):
```
🔴 **Service Disruption**

We are currently investigating reports of [specific issue description, e.g., "errors when accessing user profiles"].

Our engineering team has been notified and is actively investigating.

**Current Status**: Investigating
**Started**: [HH:MM UTC]
**Next Update**: [HH:MM UTC] (15 minutes)

We apologize for any inconvenience.
```

**Progress Update**:
```
🟡 **Update**: Service Disruption

We have identified the cause as [brief explanation without technical jargon].

Our team is implementing a fix.

**Impact**: [Percentage or description of affected users]
**Estimated Resolution**: [Timeframe if known, or "working on it" if not]
**Next Update**: [HH:MM UTC]
```

**Resolution Post**:
```
🟢 **Resolved**: Service Disruption

The issue has been resolved as of [HH:MM UTC].

All services are operating normally.

**Root Cause**: [Customer-friendly explanation]
**Duration**: [Total time]
**Affected**: [Impact summary]

We have implemented measures to prevent this from happening again and will continue monitoring closely.

We apologize for any inconvenience this may have caused.
```

### Customer Support Email Template

**Subject**: Update on [Service Name] Disruption - [Date]

```
Dear [Customer Name],

We are writing to inform you that we experienced a service disruption today affecting [service/feature name].

**Timeline**:
- **Started**: [HH:MM UTC]
- **Resolved**: [HH:MM UTC]
- **Duration**: [X hours/minutes]

**Impact**:
[Specific description of what customers experienced]

**Resolution**:
[Brief explanation of what we did to fix it]

**Prevention**:
We have identified the root cause and are implementing the following measures to prevent recurrence:
- [Action item 1]
- [Action item 2]

**Compensation** (if applicable):
[Details of any service credits or compensation]

We sincerely apologize for this disruption and any impact it had on your business.

If you have any questions, please contact our support team at [email/phone].

Best regards,
[Name]
[Title]
```
```

**Expected:** Templates save time during incidents, ensure consistent communication, reduce cognitive load on responders.

**On failure:**
- Customize templates to match company communication style
- Pre-fill templates with common incident types
- Create Slack workflow/bot to populate templates automatically
- Review templates during incident retrospectives

### Step 6: Link Runbook to Monitoring

Integrate runbook with alerts and dashboards.

**Add runbook links to alert rules** (`alerts.yml`):

```yaml
groups:
  - name: application_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
          team: platform
        annotations:
          summary: "High error rate on {{ $labels.service }}"
          description: "Error rate is {{ $value | humanizePercentage }} on {{ $labels.service }}"
          runbook_url: "https://wiki.example.com/runbooks/high-error-rate"
          dashboard_url: "https://grafana.example.com/d/service-overview"
          incident_channel: "#incident-platform"

      - alert: DatabaseConnectionPoolExhausted
        expr: (db_pool_active / db_pool_max) > 0.9
        for: 5m
        labels:
          severity: critical
          team: database
        annotations:
          summary: "Database connection pool exhausted"
          description: "Connection pool {{ $value | humanizePercentage }} full on {{ $labels.instance }}"
          runbook_url: "https://wiki.example.com/runbooks/db-connection-pool-exhausted"
          diagnostic_query: "db_pool_active / db_pool_max"
```

**Embed diagnostic queries in runbook**:

```markdown
## Quick Diagnostic Links

Click these links to jump directly to relevant views:

- [Service Overview Dashboard](https://grafana.example.com/d/api-service)
- [Error Rate Last 1h](https://prometheus.example.com/graph?g0.expr=rate%28http_requests_total%7Bstatus%3D~%225..%22%7D%5B5m%5D%29&g0.range_input=1h)
- [Recent Error Logs](https://grafana.example.com/explore?left=%7B%22datasource%22:%22Loki%22,%22queries%22:%5B%7B%22refId%22:%22A%22,%22expr%22:%22%7Bjob%3D%5C%22api-service%5C%22%7D%20%7C%3D%20%5C%22error%5C%22%22%7D%5D%7D)
- [Recent Deployments](https://github.com/org/api-service/deployments)
- [PagerDuty Incidents](https://acme.pagerduty.com/incidents?service_ids[]=PXXXXXX)
```

**Create Grafana dashboard with runbook links**:

```json
{
  "panels": [
    {
      "type": "text",
      "title": "Runbooks",
      "gridPos": {"h": 4, "w": 24, "x": 0, "y": 0},
      "options": {
        "mode": "markdown",
        "content": "## Incident Response Runbooks\n\n- [High Error Rate](https://wiki.example.com/runbooks/high-error-rate)\n- [High Latency](https://wiki.example.com/runbooks/high-latency)\n- [Database Issues](https://wiki.example.com/runbooks/database)\n- [Deployment Failures](https://wiki.example.com/runbooks/deployment-failures)\n\n**On-Call**: @platform-oncall | **Escalation**: #incident-response"
      }
    }
  ]
}
```

**Expected:** Responders can access runbooks directly from alerts or dashboards, diagnostic queries pre-filled, one-click access to relevant tools.

**On failure:**
- Verify runbook URLs are accessible without VPN/login
- Use URL shorteners for complex Grafana/Prometheus links
- Test links quarterly to ensure they don't break
- Create browser bookmarks for frequently used runbooks

## Validation

- [ ] Runbook follows consistent template structure
- [ ] Diagnostic procedures include specific queries and expected values
- [ ] Resolution steps are actionable with clear commands
- [ ] Escalation criteria and contacts are current
- [ ] Communication templates provided for internal and external audiences
- [ ] Runbook linked from monitoring alerts and dashboards
- [ ] Runbook tested during incident simulation or actual incident
- [ ] Feedback from responders incorporated into runbook
- [ ] Revision history tracked with dates and authors
- [ ] Runbook accessible without authentication (or cached offline)

## Common Pitfalls

- **Too generic**: Runbooks with vague steps like "check the logs" without specific queries are not actionable. Be specific.
- **Outdated information**: Runbooks referencing old systems or commands become useless. Review quarterly.
- **No verification steps**: Resolution without verification leads to false positives. Always include "how to confirm it's fixed."
- **Missing rollback procedures**: Every action should have a rollback plan. Don't trap responders in worse state.
- **Assuming knowledge**: Runbooks for experts only exclude junior engineers. Write for the least experienced person on rotation.
- **No ownership**: Runbooks without owners become stale. Assign team/person responsible for updates.
- **Hidden behind auth**: Runbooks inaccessible during VPN/SSO issues are useless during crisis. Cache copies or use public wiki.

## Related Skills

- `configure-alerting-rules` - Link runbooks to alert annotations for immediate access during incidents
- `build-grafana-dashboards` - Embed runbook links in dashboards and diagnostic panels
- `setup-prometheus-monitoring` - Include diagnostic queries from Prometheus in runbook procedures
- `define-slo-sli-sla` - Reference SLO impact in incident severity classification
