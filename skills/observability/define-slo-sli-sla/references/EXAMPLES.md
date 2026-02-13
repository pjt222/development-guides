# Define SLO/SLI/SLA — Extended Examples

Complete configuration files and code templates.


## Step 2: Select Appropriate SLIs

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


## Step 3: Set SLO Targets and Time Windows

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


## Step 4: Implement SLO Monitoring with Sloth

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


## Step 5: Build Error Budget Dashboards

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


## Step 6: Establish Error Budget Policy

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

