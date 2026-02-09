---
name: configure-alerting-rules
description: >
  Configure Prometheus Alertmanager with routing trees, receivers (Slack, PagerDuty, email),
  inhibition rules, silences, and notification templates for actionable incident alerting.
license: MIT
allowed-tools: Read Write Edit Bash Grep Glob
metadata:
  author: Philipp Thoss
  version: "1.0"
  domain: observability
  complexity: intermediate
  language: multi
  tags: alertmanager, alerting, routing, pagerduty, slack
---

# Configure Alerting Rules

Set up Prometheus alerting rules and Alertmanager for reliable, actionable incident notifications.

## When to Use

- Implementing proactive monitoring with automated incident detection
- Routing alerts to appropriate teams based on severity and service ownership
- Reducing alert fatigue through intelligent grouping and deduplication
- Integrating monitoring with on-call systems (PagerDuty, Opsgenie)
- Establishing escalation policies for critical production issues
- Migrating from legacy monitoring systems to Prometheus-based alerting
- Creating actionable alerts that guide responders to resolution

## Inputs

- **Required**: Prometheus metrics to alert on (error rates, latency, saturation)
- **Required**: On-call rotation and escalation policies
- **Optional**: Existing alert definitions to migrate
- **Optional**: Notification channels (Slack, email, PagerDuty)
- **Optional**: Runbook documentation for common alerts

## Procedure

### Step 1: Deploy Alertmanager

Install and configure Alertmanager to receive alerts from Prometheus.

**Docker Compose deployment**:

```yaml
version: '3.8'
services:
  alertmanager:
    image: prom/alertmanager:v0.26.0
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml
      - alertmanager-data:/alertmanager
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
      - '--storage.path=/alertmanager'
      - '--data.retention=120h'
      - '--web.external-url=http://alertmanager.example.com'
    restart: unless-stopped

volumes:
  alertmanager-data:
```

**Basic Alertmanager configuration** (`alertmanager.yml`):

```yaml
global:
  resolve_timeout: 5m
  slack_api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
  pagerduty_url: 'https://events.pagerduty.com/v2/enqueue'

# Templates for notification formatting
templates:
  - '/etc/alertmanager/templates/*.tmpl'

# Route tree for alert routing
route:
  receiver: 'default-receiver'
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h

  routes:
    # Critical alerts to PagerDuty
    - match:
        severity: critical
      receiver: pagerduty-critical
      continue: true  # Also send to other receivers

    # Page-worthy alerts
    - match:
        severity: page
      receiver: slack-oncall
      group_wait: 10s
      group_interval: 2m
      repeat_interval: 1h

    # Warning alerts to Slack
    - match:
        severity: warning
      receiver: slack-warnings
      group_wait: 5m
      group_interval: 10m
      repeat_interval: 12h

    # Team-specific routing
    - match:
        team: platform
      receiver: slack-platform
      routes:
        - match:
            severity: critical
          receiver: pagerduty-platform

    - match:
        team: database
      receiver: slack-database
      routes:
        - match:
            severity: critical
          receiver: pagerduty-database

# Inhibition rules: suppress alerts based on other active alerts
inhibit_rules:
  # If cluster is down, don't alert on individual nodes
  - source_match:
      severity: 'critical'
      alertname: 'ClusterDown'
    target_match:
      severity: 'warning'
    equal: ['cluster']

  # If service is down, don't alert on high latency
  - source_match:
      alertname: 'ServiceDown'
    target_match:
      alertname: 'HighLatency'
    equal: ['service', 'instance']

# Notification receivers
receivers:
  - name: 'default-receiver'
    slack_configs:
      - channel: '#alerts-general'
        title: 'Alert: {{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}\n{{ end }}'

  - name: 'pagerduty-critical'
    pagerduty_configs:
      - service_key: 'YOUR_PAGERDUTY_SERVICE_KEY'
        severity: 'critical'
        description: '{{ .GroupLabels.alertname }} - {{ .GroupLabels.service }}'
        details:
          firing: '{{ .Alerts.Firing | len }}'
          resolved: '{{ .Alerts.Resolved | len }}'
          summary: '{{ range .Alerts }}{{ .Annotations.summary }}\n{{ end }}'
          runbook: '{{ range .Alerts }}{{ .Annotations.runbook_url }}{{ end }}'

  - name: 'slack-oncall'
    slack_configs:
      - channel: '#oncall-alerts'
        username: 'Alertmanager'
        icon_emoji: ':fire:'
        title: '🚨 {{ .GroupLabels.alertname }}'
        text: |
          *Severity:* {{ .CommonLabels.severity }}
          *Service:* {{ .GroupLabels.service }}
          *Summary:* {{ range .Alerts.Firing }}{{ .Annotations.summary }}{{ end }}
          *Details:* {{ range .Alerts.Firing }}{{ .Annotations.description }}{{ end }}
          *Runbook:* {{ range .Alerts.Firing }}{{ .Annotations.runbook_url }}{{ end }}
        actions:
          - type: button
            text: 'View in Prometheus'
            url: '{{ .ExternalURL }}'
          - type: button
            text: 'Silence'
            url: '{{ .ExternalURL }}/#/silences/new'

  - name: 'slack-warnings'
    slack_configs:
      - channel: '#alerts-warnings'
        title: '⚠️ {{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}\n{{ end }}'

  - name: 'slack-platform'
    slack_configs:
      - channel: '#team-platform'
        title: '[Platform] {{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}\n{{ end }}'
```

**Configure Prometheus to use Alertmanager** (`prometheus.yml`):

```yaml
alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093
      timeout: 10s
      api_version: v2
```

**Expected:** Alertmanager UI accessible at `http://localhost:9093`, Prometheus "Status > Alertmanagers" shows UP status.

**On failure:**
- Check Alertmanager logs: `docker logs alertmanager`
- Verify Prometheus can reach Alertmanager: `curl http://alertmanager:9093/api/v2/status`
- Test webhook URLs: `curl -X POST <SLACK_WEBHOOK_URL> -d '{"text":"test"}'`
- Validate YAML syntax: `amtool check-config alertmanager.yml`

### Step 2: Define Alerting Rules in Prometheus

Create alerting rules that fire when conditions are met.

**Create alerting rules file** (`/etc/prometheus/rules/alerts.yml`):

```yaml
groups:
  - name: instance_alerts
    interval: 30s
    rules:
      # Node/instance down
      - alert: InstanceDown
        expr: up == 0
        for: 5m
        labels:
          severity: critical
          team: infrastructure
        annotations:
          summary: "Instance {{ $labels.instance }} is down"
          description: "{{ $labels.instance }} of job {{ $labels.job }} has been down for more than 5 minutes."
          runbook_url: "https://wiki.example.com/runbooks/instance-down"

      # High CPU usage
      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 10m
        labels:
          severity: warning
          team: infrastructure
        annotations:
          summary: "High CPU usage on {{ $labels.instance }}"
          description: "CPU usage is {{ $value | humanize }}% on {{ $labels.instance }}"
          runbook_url: "https://wiki.example.com/runbooks/high-cpu"

      # Low disk space
      - alert: LowDiskSpace
        expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100 < 10
        for: 5m
        labels:
          severity: warning
          team: infrastructure
        annotations:
          summary: "Low disk space on {{ $labels.instance }}"
          description: "Disk {{ $labels.device }} on {{ $labels.instance }} has {{ $value | humanize }}% free space remaining"
          runbook_url: "https://wiki.example.com/runbooks/low-disk-space"

  - name: application_alerts
    interval: 30s
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: |
          (
            sum(rate(http_requests_total{status=~"5.."}[5m])) by (service)
            / sum(rate(http_requests_total[5m])) by (service)
          ) * 100 > 5
        for: 5m
        labels:
          severity: critical
          team: platform
        annotations:
          summary: "High error rate on {{ $labels.service }}"
          description: "Error rate is {{ $value | humanize }}% on {{ $labels.service }}"
          runbook_url: "https://wiki.example.com/runbooks/high-error-rate"

      # High latency (P99)
      - alert: HighLatency
        expr: |
          histogram_quantile(0.99,
            sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service)
          ) > 1
        for: 10m
        labels:
          severity: warning
          team: platform
        annotations:
          summary: "High P99 latency on {{ $labels.service }}"
          description: "P99 latency is {{ $value | humanize }}s on {{ $labels.service }}"
          runbook_url: "https://wiki.example.com/runbooks/high-latency"

      # Database connection pool exhausted
      - alert: DatabaseConnectionPoolExhausted
        expr: |
          (
            sum(db_connection_pool_active) by (service, instance)
            / sum(db_connection_pool_max) by (service, instance)
          ) > 0.9
        for: 5m
        labels:
          severity: critical
          team: database
        annotations:
          summary: "Database connection pool nearly exhausted"
          description: "{{ $labels.service }} on {{ $labels.instance }} is using {{ $value | humanizePercentage }} of connection pool"
          runbook_url: "https://wiki.example.com/runbooks/db-connection-pool"

  - name: kubernetes_alerts
    interval: 30s
    rules:
      # Pod crash looping
      - alert: PodCrashLooping
        expr: rate(kube_pod_container_status_restarts_total[15m]) > 0
        for: 5m
        labels:
          severity: warning
          team: platform
        annotations:
          summary: "Pod {{ $labels.namespace }}/{{ $labels.pod }} is crash looping"
          description: "Pod has restarted {{ $value | humanize }} times in the last 15 minutes"
          runbook_url: "https://wiki.example.com/runbooks/pod-crash-loop"

      # Deployment rollout stuck
      - alert: DeploymentRolloutStuck
        expr: |
          kube_deployment_status_replicas_updated < kube_deployment_spec_replicas
          unless
          kube_deployment_status_replicas_updated == kube_deployment_status_replicas_available
        for: 15m
        labels:
          severity: warning
          team: platform
        annotations:
          summary: "Deployment {{ $labels.namespace }}/{{ $labels.deployment }} rollout stuck"
          description: "Deployment has been stuck for 15 minutes"
          runbook_url: "https://wiki.example.com/runbooks/deployment-stuck"
```

**Alert design best practices**:

- **`for` duration**: Prevents flapping alerts. Use 5-10 minutes for most alerts.
- **Descriptive annotations**: Include current value, affected resource, and runbook link.
- **Severity levels**:
  - `critical`: Requires immediate action, pages on-call
  - `warning`: Should be investigated but not urgent
  - `info`: Informational, no action required
- **Team labels**: Enable routing to correct team/channel
- **Runbook links**: Every alert should have a runbook URL

Load rules into Prometheus:

```yaml
# prometheus.yml
rule_files:
  - "rules/*.yml"
```

Validate and reload:

```bash
promtool check rules /etc/prometheus/rules/alerts.yml
curl -X POST http://localhost:9090/-/reload
```

**Expected:** Alerts visible in Prometheus "Alerts" page, alerts fire when thresholds exceeded, Alertmanager receives fired alerts.

**On failure:**
- Check Prometheus logs for rule evaluation errors
- Verify rule syntax with `promtool check rules`
- Test alert queries independently in Prometheus UI
- Inspect alert state transitions: Inactive → Pending → Firing
- Check `for` duration hasn't made alert too slow to fire

### Step 3: Create Notification Templates

Design readable, actionable notification messages.

**Create template file** (`/etc/alertmanager/templates/default.tmpl`):

```gotmpl
{{ define "slack.default.title" }}
[{{ .Status | toUpper }}{{ if eq .Status "firing" }}:{{ .Alerts.Firing | len }}{{ end }}] {{ .GroupLabels.alertname }}
{{ end }}

{{ define "slack.default.text" }}
{{ range .Alerts }}
*Alert:* {{ .Labels.alertname }}
*Severity:* {{ .Labels.severity }}
*Service:* {{ .Labels.service }}
*Instance:* {{ .Labels.instance }}
*Summary:* {{ .Annotations.summary }}
*Description:* {{ .Annotations.description }}
{{ if .Annotations.runbook_url }}*Runbook:* {{ .Annotations.runbook_url }}{{ end }}
*Started:* {{ .StartsAt.Format "2006-01-02 15:04:05 MST" }}
{{ if .EndsAt }}*Ended:* {{ .EndsAt.Format "2006-01-02 15:04:05 MST" }}{{ end }}

{{ end }}
{{ end }}

{{ define "email.default.subject" }}
[{{ .Status | toUpper }}] {{ .GroupLabels.alertname }} ({{ .Alerts.Firing | len }} firing)
{{ end }}

{{ define "email.default.html" }}
<!DOCTYPE html>
<html>
<head>
  <style>
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .critical { background-color: #ffcccc; }
    .warning { background-color: #fff4cc; }
    .firing { color: red; font-weight: bold; }
    .resolved { color: green; font-weight: bold; }
  </style>
</head>
<body>
  <h2>{{ .GroupLabels.alertname }}</h2>
  <p><strong>Status:</strong> <span class="{{ .Status }}">{{ .Status | toUpper }}</span></p>
  <p><strong>Alerts Firing:</strong> {{ .Alerts.Firing | len }}</p>
  <p><strong>Alerts Resolved:</strong> {{ .Alerts.Resolved | len }}</p>

  <h3>Firing Alerts</h3>
  <table>
    <tr>
      <th>Severity</th>
      <th>Service</th>
      <th>Instance</th>
      <th>Summary</th>
      <th>Started</th>
    </tr>
    {{ range .Alerts.Firing }}
    <tr class="{{ .Labels.severity }}">
      <td>{{ .Labels.severity }}</td>
      <td>{{ .Labels.service }}</td>
      <td>{{ .Labels.instance }}</td>
      <td>{{ .Annotations.summary }}</td>
      <td>{{ .StartsAt.Format "2006-01-02 15:04:05" }}</td>
    </tr>
    {{ end }}
  </table>

  <h3>Resolved Alerts</h3>
  <table>
    {{ range .Alerts.Resolved }}
    <tr>
      <td>{{ .Labels.severity }}</td>
      <td>{{ .Labels.service }}</td>
      <td>{{ .Labels.instance }}</td>
      <td>{{ .Annotations.summary }}</td>
      <td>{{ .EndsAt.Format "2006-01-02 15:04:05" }}</td>
    </tr>
    {{ end }}
  </table>
</body>
</html>
{{ end }}

{{ define "pagerduty.default.description" }}
{{ .GroupLabels.alertname }}: {{ range .Alerts.Firing }}{{ .Annotations.summary }}{{ end }}
{{ end }}
```

**Use templates in receivers**:

```yaml
receivers:
  - name: 'slack-custom'
    slack_configs:
      - channel: '#alerts'
        title: '{{ template "slack.default.title" . }}'
        text: '{{ template "slack.default.text" . }}'

  - name: 'email-custom'
    email_configs:
      - to: 'oncall@example.com'
        from: 'alertmanager@example.com'
        smarthost: 'smtp.gmail.com:587'
        auth_username: 'alertmanager@example.com'
        auth_password: 'APP_PASSWORD'
        headers:
          Subject: '{{ template "email.default.subject" . }}'
        html: '{{ template "email.default.html" . }}'

  - name: 'pagerduty-custom'
    pagerduty_configs:
      - service_key: 'YOUR_KEY'
        description: '{{ template "pagerduty.default.description" . }}'
```

**Expected:** Notifications formatted consistently, include all relevant context, actionable with runbook links.

**On failure:**
- Test template rendering: `amtool template test --config.file=alertmanager.yml --template.data=test_data.json`
- Check template syntax errors in Alertmanager logs
- Verify variable names match alert labels and annotations
- Use `{{ . | json }}` to debug template data structure

### Step 4: Configure Routing and Grouping

Optimize alert delivery with intelligent routing rules.

**Advanced routing configuration**:

```yaml
route:
  receiver: 'default-receiver'
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 30s       # Wait before sending first notification
  group_interval: 5m    # Wait before sending batch of new alerts
  repeat_interval: 4h   # Re-send notification if still firing

  routes:
    # Database team alerts
    - match_re:
        service: '(postgres|mysql|redis)'
      receiver: 'team-database'
      group_by: ['alertname', 'instance']
      routes:
        - match:
            severity: critical
          receiver: 'pagerduty-database'
          repeat_interval: 30m  # Page every 30 min until resolved

    # Platform team alerts
    - match:
        team: platform
      receiver: 'team-platform'
      routes:
        # Critical platform alerts to PagerDuty
        - match:
            severity: critical
          receiver: 'pagerduty-platform'
          group_wait: 10s  # Fast paging for critical issues
          repeat_interval: 15m
          continue: true   # Also send to Slack

        # Platform warnings to Slack only
        - match:
            severity: warning
          receiver: 'slack-platform'
          group_interval: 15m

    # Business hours vs after-hours routing
    - match:
        severity: warning
      receiver: 'slack-warnings'
      # During business hours (Mon-Fri 9am-5pm UTC)
      active_time_intervals:
        - business_hours
      routes:
        - receiver: 'slack-warnings'

    - match:
        severity: warning
      receiver: 'email-oncall'
      # After hours (evenings and weekends)
      active_time_intervals:
        - after_hours

# Time intervals for time-based routing
time_intervals:
  - name: business_hours
    time_intervals:
      - times:
          - start_time: '09:00'
            end_time: '17:00'
        weekdays: ['monday:friday']
        location: 'UTC'

  - name: after_hours
    time_intervals:
      - times:
          - start_time: '17:00'
            end_time: '09:00'
        weekdays: ['monday:friday']
        location: 'UTC'
      - weekdays: ['saturday', 'sunday']
        location: 'UTC'
```

**Grouping strategies**:

```yaml
# Group by alertname: All HighCPU alerts bundled together
group_by: ['alertname']

# Group by instance: All alerts from one host bundled
group_by: ['instance']

# Group by alertname AND cluster: Separate notifications per cluster
group_by: ['alertname', 'cluster']

# Don't group: Send each alert individually (use cautiously)
group_by: ['...']  # Special value that groups by all labels
```

**Expected:** Alerts routed to correct teams, grouped logically, timing appropriate for severity.

**On failure:**
- Test routing with `amtool config routes test --config.file=alertmanager.yml --alertname=HighCPU --label=severity=critical`
- Check routing tree visualization: `amtool config routes show --config.file=alertmanager.yml`
- Verify `continue: true` if alert should match multiple routes
- Review Alertmanager logs for routing decisions

### Step 5: Implement Inhibition and Silencing

Reduce alert noise with inhibition rules and temporary silences.

**Inhibition rules** (suppress dependent alerts):

```yaml
inhibit_rules:
  # Cluster down suppresses all node alerts in that cluster
  - source_match:
      alertname: 'ClusterDown'
      severity: 'critical'
    target_match_re:
      alertname: '(InstanceDown|HighCPU|HighMemory)'
    equal: ['cluster']

  # Service down suppresses latency and error alerts
  - source_match:
      alertname: 'ServiceDown'
    target_match_re:
      alertname: '(HighLatency|HighErrorRate)'
    equal: ['service', 'namespace']

  # Critical alerts suppress warnings for same service
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['service']

  # Database master down suppresses replica alerts
  - source_match:
      alertname: 'DatabaseMasterDown'
    target_match:
      alertname: 'DatabaseReplicaLag'
    equal: ['cluster']

  # Network partition suppresses all downstream alerts
  - source_match:
      alertname: 'NetworkPartition'
    target_match_re:
      alertname: '.*'
    equal: ['datacenter']
```

**Create silences programmatically**:

```bash
# Silence all alerts for a specific instance during maintenance
amtool silence add \
  instance=app-server-1 \
  --author="ops-team" \
  --comment="Scheduled maintenance" \
  --duration=2h \
  --alertmanager.url=http://localhost:9093

# Silence specific alert by name
amtool silence add \
  alertname=HighCPU \
  instance=app-server-1 \
  --author="ops-team" \
  --comment="Known issue, fix deploying" \
  --duration=30m \
  --alertmanager.url=http://localhost:9093

# Silence with regex matcher
amtool silence add \
  alertname=~"High.*" \
  cluster=production \
  --author="ops-team" \
  --comment="Production maintenance window" \
  --duration=4h \
  --alertmanager.url=http://localhost:9093
```

**Create silence via API**:

```bash
curl -X POST http://localhost:9093/api/v2/silences \
  -H "Content-Type: application/json" \
  -d '{
    "matchers": [
      {"name": "alertname", "value": "HighErrorRate", "isRegex": false},
      {"name": "service", "value": "user-api", "isRegex": false}
    ],
    "startsAt": "2024-01-15T10:00:00Z",
    "endsAt": "2024-01-15T12:00:00Z",
    "createdBy": "ops-team",
    "comment": "Known issue during deployment"
  }'
```

**List and manage silences**:

```bash
# List all active silences
amtool silence query --alertmanager.url=http://localhost:9093

# Expire a silence early
amtool silence expire <SILENCE_ID> --alertmanager.url=http://localhost:9093

# Query specific silences
amtool silence query alertname=HighCPU --alertmanager.url=http://localhost:9093
```

**Expected:** Inhibition reduces cascade alerts automatically, silences prevent notifications during planned maintenance.

**On failure:**
- Test inhibition logic with live alerts (fire source alert, verify target suppressed)
- Check Alertmanager UI "Silences" tab for active silences
- Verify silence matchers are exact (labels must match perfectly)
- Review inhibition logic in Alertmanager logs

### Step 6: Integrate with External Systems

Connect Alertmanager to PagerDuty, Opsgenie, Jira, etc.

**PagerDuty integration**:

```yaml
receivers:
  - name: 'pagerduty'
    pagerduty_configs:
      - routing_key: 'YOUR_INTEGRATION_KEY'  # From PagerDuty service
        severity: '{{ .CommonLabels.severity }}'
        description: '{{ range .Alerts.Firing }}{{ .Annotations.summary }}{{ end }}'
        details:
          firing: '{{ .Alerts.Firing | len }}'
          resolved: '{{ .Alerts.Resolved | len }}'
          num_firing: '{{ .Alerts.Firing | len }}'
          num_resolved: '{{ .Alerts.Resolved | len }}'
          resolved_at: '{{ range .Alerts.Resolved }}{{ .EndsAt }}{{ end }}'
          alertname: '{{ .GroupLabels.alertname }}'
          cluster: '{{ .GroupLabels.cluster }}'
          service: '{{ .GroupLabels.service }}'
        links:
          - href: '{{ .ExternalURL }}'
            text: 'Prometheus'
          - href: '{{ range .Alerts.Firing }}{{ .Annotations.runbook_url }}{{ end }}'
            text: 'Runbook'
```

**Opsgenie integration**:

```yaml
receivers:
  - name: 'opsgenie'
    opsgenie_configs:
      - api_key: 'YOUR_OPSGENIE_API_KEY'
        message: '{{ .GroupLabels.alertname }}: {{ range .Alerts.Firing }}{{ .Annotations.summary }}{{ end }}'
        description: '{{ range .Alerts.Firing }}{{ .Annotations.description }}{{ end }}'
        priority: '{{ if eq .CommonLabels.severity "critical" }}P1{{ else }}P3{{ end }}'
        tags: '{{ .CommonLabels.severity }},{{ .GroupLabels.service }}'
        responders:
          - name: 'Platform Team'
            type: 'team'
```

**Webhook for custom integrations**:

```yaml
receivers:
  - name: 'webhook-custom'
    webhook_configs:
      - url: 'https://your-webhook-endpoint.com/alerts'
        send_resolved: true
        http_config:
          basic_auth:
            username: 'webhook-user'
            password: 'webhook-password'
```

**Webhook payload example**:

```json
{
  "receiver": "webhook-custom",
  "status": "firing",
  "alerts": [
    {
      "status": "firing",
      "labels": {
        "alertname": "HighErrorRate",
        "severity": "critical",
        "service": "user-api"
      },
      "annotations": {
        "summary": "High error rate on user-api",
        "description": "Error rate is 12% on user-api",
        "runbook_url": "https://wiki.example.com/runbooks/high-error-rate"
      },
      "startsAt": "2024-01-15T10:30:00Z",
      "endsAt": "0001-01-01T00:00:00Z",
      "generatorURL": "http://prometheus:9090/graph?g0.expr=..."
    }
  ],
  "groupLabels": {
    "alertname": "HighErrorRate",
    "service": "user-api"
  },
  "externalURL": "http://alertmanager:9093"
}
```

**Expected:** Alerts create incidents in PagerDuty, appear in team communication channels, trigger on-call escalations.

**On failure:**
- Verify API keys/tokens are valid and not expired
- Check network connectivity to external services
- Test webhook endpoints independently with curl
- Review external service logs for rejected requests
- Enable debug mode in Alertmanager: `--log.level=debug`

## Validation

- [ ] Alertmanager receives alerts from Prometheus successfully
- [ ] Alerts routed to correct teams based on labels and severity
- [ ] Notifications delivered to Slack, email, or PagerDuty
- [ ] Alert grouping reduces notification volume appropriately
- [ ] Inhibition rules suppress dependent alerts correctly
- [ ] Silences prevent notifications during maintenance windows
- [ ] Notification templates include runbook links and context
- [ ] Repeat interval prevents alert fatigue for long-running issues
- [ ] Resolved notifications sent when alerts clear
- [ ] External integrations (PagerDuty, Opsgenie) create incidents

## Common Pitfalls

- **Alert fatigue**: Too many low-priority alerts cause responders to ignore critical ones. Set strict thresholds, use inhibition.
- **Missing `for` duration**: Alerts without `for` fire on transient spikes. Always use 5-10 minute windows.
- **Overly broad grouping**: Grouping by `['...']` sends individual notifications, overwhelming channels. Use specific label grouping.
- **No runbook links**: Alerts without runbooks leave responders guessing. Every alert needs a runbook URL.
- **Incorrect severity**: Mislabeling warnings as critical desensitizes team. Reserve critical for actual emergencies.
- **Forgotten silences**: Silences without expiration can hide real issues. Always set end times, review active silences regularly.
- **Single route**: All alerts to one channel loses context. Use team-specific routing for accountability.
- **No inhibition**: Cascade alerts during outages create noise. Implement inhibition rules for common failure patterns.

## Related Skills

- `setup-prometheus-monitoring` - Define metrics and recording rules that feed alerting rules
- `define-slo-sli-sla` - Generate SLO burn rate alerts for error budget management
- `write-incident-runbook` - Create runbooks linked from alert annotations
- `build-grafana-dashboards` - Visualize alert firing history and silence patterns
