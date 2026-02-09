---
name: define-slo-sli-sla
description: >
  Establish Service Level Objectives (SLO), Service Level Indicators (SLI), and Service Level
  Agreements (SLA) with error budget tracking, burn rate alerts, and automated reporting using
  Prometheus and tools like Sloth or Pyrra.
license: MIT
allowed-tools: Read Write Edit Bash Grep Glob
metadata:
  author: Philipp Thoss
  version: "1.0"
  domain: observability
  complexity: intermediate
  language: multi
  tags: slo, sli, sla, error-budget, burn-rate
---

# Define SLO/SLI/SLA

Establish measurable reliability targets with Service Level Objectives, track them with indicators, and manage error budgets.

## When to Use

- Defining reliability targets for customer-facing services or APIs
- Establishing clear expectations between service providers and consumers
- Balancing feature velocity with system reliability through error budgets
- Creating objective criteria for incident severity and response
- Migrating from arbitrary uptime goals to data-driven reliability metrics
- Implementing Site Reliability Engineering (SRE) practices
- Measuring and improving service quality over time

## Inputs

- **Required**: Service description and critical user journeys
- **Required**: Historical metrics data (request rates, latencies, error rates)
- **Optional**: Existing SLA commitments to customers
- **Optional**: Business requirements for service availability and performance
- **Optional**: Incident history and customer impact data

## Procedure

### Step 1: Understand SLI, SLO, and SLA Hierarchy

Learn the relationship and differences between these three concepts.

**Definitions**:

```markdown
SLI (Service Level Indicator)
- **What**: A quantitative measure of service behavior
- **Example**: Request success rate, request latency, system throughput
- **Measurement**: `successful_requests / total_requests * 100`

SLO (Service Level Objective)
- **What**: Target value or range for an SLI over a time window
- **Example**: 99.9% of requests succeed in 30-day window
- **Purpose**: Internal reliability target to guide operations

SLA (Service Level Agreement)
- **What**: Contractual commitment with consequences for missing SLO
- **Example**: 99.9% uptime SLA with refunds if breached
- **Purpose**: External promise to customers with penalties
```

**Hierarchy**:
```
SLA (99.9% uptime, customer refunds)
  ├─ SLO (99.95% success rate, internal target)
  │   └─ SLI (actual measured: 99.97% success rate)
  └─ Error Budget (0.05% failures allowed per month)
```

**Key principle**: SLO should be **stricter** than SLA to provide buffer before customer impact.

Example:
- **SLA**: 99.9% availability (customer promise)
- **SLO**: 99.95% availability (internal target)
- **Buffer**: 0.05% cushion before SLA breach

**Expected:** Team understands differences, agreement on which metrics become SLIs, alignment on SLO targets.

**On failure:**
- Review Google SRE book chapters on SLI/SLO/SLA
- Conduct workshop with stakeholders to align on definitions
- Start with simple success-rate SLI before complex latency SLOs

### Step 2: Select Appropriate SLIs

Choose SLIs that reflect user experience and business impact.

**The Four Golden Signals** (Google SRE):

1. **Latency**: Time to serve a request
   ```promql
   # P95 latency
   histogram_quantile(0.95,
     sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
   )
   ```

2. **Traffic**: Demand on the system
   ```promql
   # Requests per second
   sum(rate(http_requests_total[5m]))
   ```

3. **Errors**: Rate of failed requests
   ```promql
   # Error rate percentage
   sum(rate(http_requests_total{status=~"5.."}[5m]))
   / sum(rate(http_requests_total[5m])) * 100
   ```

4. **Saturation**: How "full" the system is
   ```promql
   # CPU saturation
   avg(rate(node_cpu_seconds_total{mode!="idle"}[5m]))
   ```

**Common SLI patterns**:

```yaml
# Availability SLI
availability:
  description: "Percentage of successful requests"
  query: |
    sum(rate(http_requests_total{status!~"5.."}[5m]))
    / sum(rate(http_requests_total[5m]))
  good_threshold: 0.999  # 99.9%

# Latency SLI
latency:
  description: "P99 request latency under 500ms"
  query: |
    histogram_quantile(0.99,
      sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
    ) < 0.5
  good_threshold: 0.95  # 95% of windows meet target

# Throughput SLI
throughput:
  description: "Requests processed per second"
  query: |
    sum(rate(http_requests_total[5m]))
  good_threshold: 1000  # Minimum 1000 req/s

# Data freshness SLI (for batch jobs)
freshness:
  description: "Data updated within last hour"
  query: |
    (time() - max(data_last_updated_timestamp)) < 3600
  good_threshold: 1  # Always fresh
```

**SLI selection criteria**:
- **User-visible**: Reflects actual user experience
- **Measurable**: Can be quantified from existing metrics
- **Actionable**: Team can improve it through engineering work
- **Meaningful**: Correlates with customer satisfaction
- **Simple**: Easy to understand and explain

Avoid:
- Internal system metrics not visible to users (CPU, memory)
- Vanity metrics that don't predict customer impact
- Overly complex composite scores

**Expected:** 2-4 SLIs selected per service, covering availability and latency at minimum, team agreement on measurement queries.

**On failure:**
- Map user journey to identify critical failure points
- Analyze incident history: which metrics predicted customer impact?
- Validate SLI with A/B test: degrade metric, measure customer complaints
- Start with simple availability SLI, add complexity iteratively

### Step 3: Set SLO Targets and Time Windows

Define realistic and achievable reliability targets.

**SLO specification format**:

```yaml
service: user-api
slos:
  - name: availability
    objective: 99.9
    description: |
      99.9% of requests return non-5xx status codes
    sli:
      events:
        error_query: sum(rate(http_requests_total{job="user-api",status=~"5.."}[5m]))
        total_query: sum(rate(http_requests_total{job="user-api"}[5m]))
    alerting:
      name: UserAPIHighErrorRate
      labels:
        severity: page
      annotations:
        summary: User API error budget burn rate is too high
      page_alert:
        percent: 2
      ticket_alert:
        percent: 5
    labels:
      team: platform
      tier: "1"

  - name: latency
    objective: 95.0
    description: |
      95% of requests complete within 200ms
    sli:
      events:
        error_query: sum(rate(http_request_duration_seconds_bucket{job="user-api",le="0.2"}[5m]))
        total_query: sum(rate(http_request_duration_seconds_bucket{job="user-api",le="+Inf"}[5m]))
    alerting:
      name: UserAPIHighLatency
      labels:
        severity: warning
    labels:
      team: platform
      tier: "1"
```

**Time window selection**:

Common windows:
- **30 days** (monthly): Typical for external SLAs
- **7 days** (weekly): Faster feedback for engineering teams
- **1 day** (daily): High-frequency services requiring rapid response

Example 30-day window error budget:
```
SLO: 99.9% availability over 30 days
Allowed failures: 0.1%
Total requests per month: 100M
Error budget: 100,000 failed requests
Daily budget: ~3,333 failed requests
```

**Setting realistic targets**:

1. **Baseline current performance**:
   ```promql
   # Check actual availability over past 90 days
   avg_over_time(
     (sum(rate(http_requests_total{status!~"5.."}[5m]))
     / sum(rate(http_requests_total[5m])))[90d:5m]
   )
   # Result: 99.95% → Set SLO at 99.9% (safer than current)
   ```

2. **Calculate cost of nines**:
   ```
   99%    → 7.2 hours downtime/month (low reliability)
   99.9%  → 43 minutes downtime/month (good)
   99.95% → 22 minutes downtime/month (very good)
   99.99% → 4.3 minutes downtime/month (expensive)
   99.999% → 26 seconds downtime/month (very expensive)
   ```

3. **Balance user happiness vs engineering cost**:
   - Too strict: Expensive, slows feature development
   - Too loose: Poor user experience, customer churn
   - **Sweet spot**: Slightly better than user expectations

**Expected:** SLO targets set with business stakeholder buy-in, documented with rationale, error budget calculated.

**On failure:**
- Start with achievable target (e.g., 99% if current is 98.5%)
- Iterate SLO targets quarterly based on actual performance
- Get executive sponsorship for realistic targets vs "five nines" demands
- Document cost-benefit analysis for each additional nine

### Step 4: Implement SLO Monitoring with Sloth

Use Sloth to generate Prometheus recording rules and alerts from SLO specs.

**Install Sloth**:

```bash
# Binary installation
wget https://github.com/slok/sloth/releases/download/v0.11.0/sloth-linux-amd64
chmod +x sloth-linux-amd64
sudo mv sloth-linux-amd64 /usr/local/bin/sloth

# Or Docker
docker pull ghcr.io/slok/sloth:latest
```

**Create Sloth SLO specification** (`slos/user-api.yml`):

```yaml
version: "prometheus/v1"
service: "user-api"
labels:
  team: "platform"
  tier: "1"
slos:
  # Availability SLO
  - name: "requests-availability"
    objective: 99.9
    description: "99.9% of requests are successful"
    sli:
      events:
        error_query: sum(rate(http_requests_total{job="user-api",status=~"5.."}[{{.window}}]))
        total_query: sum(rate(http_requests_total{job="user-api"}[{{.window}}]))
    alerting:
      name: UserAPIHighErrorRate
      labels:
        category: "availability"
      annotations:
        summary: "High error rate on user-api"
        runbook: "https://wiki.example.com/runbooks/user-api-errors"
      page_alert:
        percent: 2     # Page if burning 2% of monthly budget per hour
        labels:
          severity: "page"
      ticket_alert:
        percent: 5     # Ticket if burning 5% of monthly budget per hour
        labels:
          severity: "warning"

  # Latency SLO
  - name: "requests-latency"
    objective: 95.0
    description: "95% of requests faster than 200ms"
    sli:
      events:
        error_query: |
          sum(rate(http_request_duration_seconds_bucket{job="user-api",le="0.2"}[{{.window}}]))
        total_query: |
          sum(rate(http_request_duration_seconds_bucket{job="user-api",le="+Inf"}[{{.window}}]))
    alerting:
      name: UserAPIHighLatency
      labels:
        category: "latency"
      annotations:
        summary: "High latency on user-api"
      page_alert:
        percent: 2
      ticket_alert:
        percent: 5
```

**Generate Prometheus rules**:

```bash
# Generate recording and alerting rules
sloth generate -i slos/user-api.yml -o prometheus/rules/user-api-slo.yml

# Validate generated rules
promtool check rules prometheus/rules/user-api-slo.yml
```

**Generated recording rules** (excerpt):

```yaml
groups:
  - name: sloth-slo-sli-recordings-user-api-requests-availability
    interval: 30s
    rules:
      # SLI: Ratio of good events
      - record: slo:sli_error:ratio_rate5m
        expr: |
          sum(rate(http_requests_total{job="user-api",status=~"5.."}[5m]))
          / sum(rate(http_requests_total{job="user-api"}[5m]))
        labels:
          service: user-api
          slo: requests-availability

      # Error budget remaining
      - record: slo:error_budget:ratio
        expr: |
          1 - (
            slo:sli_error:ratio_rate5m{service="user-api",slo="requests-availability"}
            / (1 - 0.999)
          )
        labels:
          service: user-api
          slo: requests-availability

  - name: sloth-slo-meta-recordings-user-api-requests-availability
    interval: 30s
    rules:
      # Metadata
      - record: slo:objective:ratio
        expr: "0.999"
        labels:
          service: user-api
          slo: requests-availability

      # Error budget total
      - record: slo:error_budget:total
        expr: "1 - 0.999"
        labels:
          service: user-api
          slo: requests-availability
```

**Generated alerts**:

```yaml
groups:
  - name: sloth-slo-alerts-user-api-requests-availability
    rules:
      # Fast burn: 2% budget consumed in 1 hour
      - alert: UserAPIHighErrorRate
        expr: |
          (
            slo:sli_error:ratio_rate5m{service="user-api",slo="requests-availability"} > (14.4 * (1-0.999))
          and
            slo:sli_error:ratio_rate1h{service="user-api",slo="requests-availability"} > (14.4 * (1-0.999))
          )
        labels:
          severity: page
          category: availability
        annotations:
          summary: "High error rate on user-api"
          runbook: "https://wiki.example.com/runbooks/user-api-errors"

      # Slow burn: 5% budget consumed in 6 hours
      - alert: UserAPIHighErrorRate
        expr: |
          (
            slo:sli_error:ratio_rate30m{service="user-api",slo="requests-availability"} > (6 * (1-0.999))
          and
            slo:sli_error:ratio_rate6h{service="user-api",slo="requests-availability"} > (6 * (1-0.999))
          )
        labels:
          severity: warning
          category: availability
        annotations:
          summary: "High error rate on user-api"
```

**Load rules into Prometheus**:

```yaml
# prometheus.yml
rule_files:
  - "rules/user-api-slo.yml"
```

Reload Prometheus:
```bash
curl -X POST http://localhost:9090/-/reload
```

**Expected:** Sloth generates multi-window multi-burn-rate alerts, recording rules evaluate successfully, alerts fire appropriately during incidents.

**On failure:**
- Validate YAML syntax with `yamllint slos/user-api.yml`
- Check Sloth version compatibility (v0.11+ recommended)
- Verify Prometheus recording rule evaluation: `curl http://localhost:9090/api/v1/rules`
- Test with synthetic error injection to trigger alerts
- Check Sloth documentation for SLI event query format

### Step 5: Build Error Budget Dashboards

Visualize SLO compliance and error budget consumption in Grafana.

**Grafana dashboard JSON** (excerpt):

```json
{
  "dashboard": {
    "title": "SLO Dashboard - User API",
    "panels": [
      {
        "type": "stat",
        "title": "30-Day Availability SLO",
        "targets": [
          {
            "expr": "slo:objective:ratio{service=\"user-api\",slo=\"requests-availability\"}",
            "legendFormat": "Target: {{slo}}"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percentunit",
            "decimals": 3,
            "thresholds": {
              "steps": [
                {"value": 0.999, "color": "green"},
                {"value": 0.995, "color": "yellow"},
                {"value": 0, "color": "red"}
              ]
            }
          }
        }
      },
      {
        "type": "stat",
        "title": "Current SLI (5m)",
        "targets": [
          {
            "expr": "1 - slo:sli_error:ratio_rate5m{service=\"user-api\",slo=\"requests-availability\"}",
            "legendFormat": "Current"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percentunit",
            "decimals": 3,
            "thresholds": {
              "steps": [
                {"value": 0.999, "color": "green"},
                {"value": 0.995, "color": "yellow"},
                {"value": 0, "color": "red"}
              ]
            }
          }
        }
      },
      {
        "type": "gauge",
        "title": "Error Budget Remaining",
        "targets": [
          {
            "expr": "slo:error_budget:ratio{service=\"user-api\",slo=\"requests-availability\"}",
            "legendFormat": "Budget"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percentunit",
            "min": 0,
            "max": 1,
            "thresholds": {
              "steps": [
                {"value": 0, "color": "red"},
                {"value": 0.25, "color": "yellow"},
                {"value": 0.5, "color": "green"}
              ]
            }
          }
        }
      },
      {
        "type": "timeseries",
        "title": "SLI Over Time",
        "targets": [
          {
            "expr": "1 - slo:sli_error:ratio_rate5m{service=\"user-api\",slo=\"requests-availability\"}",
            "legendFormat": "Availability SLI"
          },
          {
            "expr": "slo:objective:ratio{service=\"user-api\",slo=\"requests-availability\"}",
            "legendFormat": "SLO Target (99.9%)"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percentunit",
            "min": 0.99,
            "max": 1
          }
        }
      },
      {
        "type": "timeseries",
        "title": "Error Budget Burn Rate",
        "targets": [
          {
            "expr": "slo:sli_error:ratio_rate5m{service=\"user-api\"} / slo:error_budget:total{service=\"user-api\"}",
            "legendFormat": "Burn Rate (1x = normal)"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "none",
            "thresholds": {
              "steps": [
                {"value": 0, "color": "green"},
                {"value": 1, "color": "yellow"},
                {"value": 5, "color": "red"}
              ]
            }
          }
        }
      }
    ]
  }
}
```

**Key metrics to visualize**:
- SLO target vs current SLI
- Error budget remaining (percentage and absolute)
- Burn rate (how fast budget is depleting)
- Historical SLI trends (30-day rolling window)
- Time to exhaustion (if current burn rate continues)

**Error budget policy dashboard** (markdown panel):

```markdown
## Error Budget Policy

**Current Status**: 78% budget remaining

### If Error Budget > 50%
- ✅ Full speed ahead on new features
- ✅ Normal deployment cadence
- ✅ Experimental features allowed

### If Error Budget 25-50%
- ⚠️ Focus on reliability improvements
- ⚠️ Reduce deployment frequency
- ⚠️ Review change management process

### If Error Budget < 25%
- 🚨 Feature freeze in effect
- 🚨 Emergency reliability work only
- 🚨 Incident retrospectives required

### If Error Budget Exhausted (0%)
- 🔴 Complete code freeze
- 🔴 All hands on reliability
- 🔴 Executive escalation
```

**Expected:** Dashboards show real-time SLO compliance, error budget depletion visible, team can make informed decisions about feature velocity.

**On failure:**
- Verify recording rules exist: `curl http://localhost:9090/api/v1/rules | jq '.data.groups[].rules[] | select(.name | contains("slo:"))'`
- Check Prometheus datasource in Grafana has correct URL
- Validate query results in Explore view before adding to dashboard
- Ensure time range set to appropriate window (e.g., 30d for monthly SLOs)

### Step 6: Establish Error Budget Policy

Define organizational process for managing error budgets.

**Error budget policy template**:

```yaml
service: user-api
slo:
  availability: 99.9%
  latency_p99: 200ms
  window: 30 days

error_budget_policy:
  # When budget > 50% remaining
  green_state:
    deployment_frequency: multiple_per_day
    change_approval: automated
    experimental_features: allowed
    on_call_load: normal
    actions:
      - "Continue normal feature development"
      - "Maintain standard deployment cadence"
      - "Optional: Refactor technical debt"

  # When budget 25-50% remaining
  yellow_state:
    deployment_frequency: daily
    change_approval: peer_review_required
    experimental_features: limited
    on_call_load: elevated
    actions:
      - "Prioritize reliability work over new features"
      - "Require change review before deployment"
      - "Investigate error sources"
      - "Update runbooks for common issues"

  # When budget < 25% remaining
  orange_state:
    deployment_frequency: weekly
    change_approval: manager_approval
    experimental_features: blocked
    on_call_load: high
    actions:
      - "Feature freeze for non-reliability work"
      - "Root cause analysis for all errors"
      - "Emergency retrospectives"
      - "Increase monitoring and alerting"

  # When budget exhausted (0%)
  red_state:
    deployment_frequency: emergency_only
    change_approval: executive_approval
    experimental_features: blocked
    on_call_load: critical
    actions:
      - "Complete code freeze"
      - "All engineers on reliability duty"
      - "Daily executive updates"
      - "Post-mortem required before resume"

stakeholders:
  engineering: Platform Team
  product: Product Manager Name
  executive: VP Engineering
  notification_channels:
    - slack: "#platform-alerts"
    - email: "platform-team@example.com"
    - pagerduty: "platform-oncall"

review_cadence: weekly
policy_version: "1.0"
last_updated: "2024-01-15"
```

**Automate policy enforcement**:

```python
# Example: Deployment gate script
import requests
import sys

def check_error_budget(service):
    # Query Prometheus for error budget
    query = f'slo:error_budget:ratio{{service="{service}"}}'
    response = requests.get(
        'http://prometheus:9090/api/v1/query',
        params={'query': query}
    )
    budget_ratio = float(response.json()['data']['result'][0]['value'][1])

    if budget_ratio < 0.25:
        print(f"❌ Error budget depleted ({budget_ratio*100:.1f}% remaining)")
        print("⚠️  Feature freeze in effect")
        print("📋 See error budget policy: https://wiki.example.com/slo-policy")
        return False
    elif budget_ratio < 0.50:
        print(f"⚠️  Error budget low ({budget_ratio*100:.1f}% remaining)")
        print("✅ Deployment allowed but prioritize reliability")
        return True
    else:
        print(f"✅ Error budget healthy ({budget_ratio*100:.1f}% remaining)")
        return True

if __name__ == '__main__':
    service = sys.argv[1]
    if not check_error_budget(service):
        sys.exit(1)  # Fail CI/CD pipeline
```

Integrate into CI/CD pipeline:

```yaml
# .github/workflows/deploy.yml
jobs:
  check-error-budget:
    runs-on: ubuntu-latest
    steps:
      - name: Check SLO Error Budget
        run: |
          python scripts/check_error_budget.py user-api
      - name: Deploy
        if: success()
        run: |
          kubectl apply -f deploy/
```

**Expected:** Clear policy documented, automated gates prevent risky deployments during budget depletion, team alignment on reliability priorities.

**On failure:**
- Start with manual policy enforcement (Slack reminders)
- Gradually automate with soft gates (warnings, not blocks)
- Get executive buy-in before hard gates (blocking deployments)
- Review policy effectiveness quarterly, adjust thresholds as needed

## Validation

- [ ] SLIs selected reflect user experience and business impact
- [ ] SLO targets set with stakeholder agreement and documented rationale
- [ ] Prometheus recording rules generate SLI metrics successfully
- [ ] Multi-burn-rate alerts configured and tested with synthetic errors
- [ ] Grafana dashboards show real-time SLO compliance and error budget
- [ ] Error budget policy documented and communicated to team
- [ ] Automated gates prevent risky deployments during budget depletion
- [ ] Weekly/monthly SLO review meetings scheduled
- [ ] Incident retrospectives include SLO impact analysis
- [ ] SLO compliance reports shared with stakeholders

## Common Pitfalls

- **Overly strict SLOs**: Setting "five nines" without cost analysis leads to burnout and slowed feature velocity. Start achievable, iterate up.
- **Too many SLIs**: Tracking 10+ indicators creates confusion. Focus on 2-4 critical user-facing metrics.
- **SLO without SLA buffer**: Setting SLO equal to SLA leaves no margin for error before customer impact. Keep 0.05-0.1% buffer.
- **Ignoring error budget**: Tracking SLOs but not acting on budget depletion defeats the purpose. Enforce error budget policy.
- **Vanity metrics as SLIs**: Using internal metrics (CPU, memory) instead of user-visible metrics (latency, errors) misaligns priorities.
- **No stakeholder buy-in**: Engineering-only SLOs without product/business agreement lead to conflicts. Get executive sponsorship.
- **Static SLOs**: Never reviewing or adjusting targets as system evolves. Revisit quarterly based on actual performance and user feedback.

## Related Skills

- `setup-prometheus-monitoring` - Configure Prometheus to collect metrics for SLI calculation
- `configure-alerting-rules` - Integrate SLO burn rate alerts with Alertmanager for on-call notifications
- `build-grafana-dashboards` - Visualize SLO compliance and error budget consumption
- `write-incident-runbook` - Include SLO impact in runbooks for prioritizing incident response
