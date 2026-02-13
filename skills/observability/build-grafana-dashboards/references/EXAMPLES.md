# Build Grafana Dashboards — Extended Examples

Complete configuration files and code templates.


## Step 1: Design Dashboard Structure

```markdown
# Service Overview Dashboard

## Purpose
Real-time operational view for on-call engineers monitoring the API service.

## Rows
1. High-Level Metrics (collapsed by default)
   - Request rate, error rate, latency (RED metrics)
   - Service uptime, instance count
2. Detailed Metrics (expanded by default)
   - Per-endpoint latency breakdown
   - Error rate by status code
   - Database connection pool status
3. Resource Utilization
   - CPU, memory, disk usage per instance
   - Network I/O rates
4. Logs (collapsed by default)
   - Recent errors from Loki
   - Alert firing history

## Variables
- `environment`: production, staging, development
- `instance`: all instances or specific instance selection
- `interval`: aggregation window (5m, 15m, 1h)

## Annotations
- Deployment events from CI/CD system
- Alert firing/resolving events
```


## Step 2: Create Dashboard with Template Variables

```json
{
  "dashboard": {
    "title": "API Service Overview",
    "uid": "api-service-overview",
    "version": 1,
    "timezone": "browser",
    "editable": true,
    "graphTooltip": 1,
    "time": {
      "from": "now-6h",
      "to": "now"
    },
    "refresh": "30s",
    "templating": {
      "list": [
        {
          "name": "environment",
          "type": "query",
          "datasource": "Prometheus",
          "query": "label_values(up{job=\"api-service\"}, environment)",
          "multi": false,
          "includeAll": false,
          "refresh": 1,
          "sort": 1,
          "current": {
            "selected": false,
            "text": "production",
            "value": "production"
          }
        },
        {
          "name": "instance",
          "type": "query",
          "datasource": "Prometheus",
          "query": "label_values(up{job=\"api-service\",environment=\"$environment\"}, instance)",
          "multi": true,
          "includeAll": true,
          "refresh": 1,
          "allValue": ".*",
          "current": {
            "selected": true,
            "text": "All",
            "value": "$__all"
          }
        },
        {
          "name": "interval",
          "type": "interval",
          "options": [
            {"text": "1m", "value": "1m"},
            {"text": "5m", "value": "5m"},
            {"text": "15m", "value": "15m"},
            {"text": "1h", "value": "1h"}
          ],
          "current": {
            "text": "5m",
            "value": "5m"
          },
          "auto": false
        }
      ]
    },
    "annotations": {
      "list": [
        {
          "name": "Deployments",
          "datasource": "Prometheus",
          "enable": true,
          "expr": "changes(app_version{job=\"api-service\",environment=\"$environment\"}[5m]) > 0",
          "step": "60s",
          "iconColor": "rgba(0, 211, 255, 1)",
          "tagKeys": "version"
        }
      ]
    }
  }
}
```


## Step 3: Build Visualization Panels

```json
{
  "type": "timeseries",
  "title": "Request Rate",
  "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0},
  "targets": [
    {
      "expr": "sum(rate(http_requests_total{job=\"api-service\",environment=\"$environment\",instance=~\"$instance\"}[$interval])) by (method)",
      "legendFormat": "{{method}}",
      "refId": "A"
    }
  ],
  "fieldConfig": {
    "defaults": {
      "unit": "reqps",
      "color": {
        "mode": "palette-classic"
      },
      "custom": {
        "drawStyle": "line",
        "lineInterpolation": "smooth",
        "fillOpacity": 10,
        "spanNulls": true
      },
      "thresholds": {
        "mode": "absolute",
        "steps": [
          {"value": null, "color": "green"},
          {"value": 1000, "color": "yellow"},
          {"value": 5000, "color": "red"}
        ]
      }
    }
  },
  "options": {
    "tooltip": {
      "mode": "multi",
      "sort": "desc"
    },
    "legend": {
      "displayMode": "table",
      "placement": "right",
      "calcs": ["mean", "max", "last"]
    }
  }
}
```

```json
{
  "type": "stat",
  "title": "Error Rate",
  "gridPos": {"h": 4, "w": 6, "x": 12, "y": 0},
  "targets": [
    {
      "expr": "sum(rate(http_requests_total{job=\"api-service\",environment=\"$environment\",status=~\"5..\"}[$interval])) / sum(rate(http_requests_total{job=\"api-service\",environment=\"$environment\"}[$interval])) * 100",
      "refId": "A"
    }
  ],
  "fieldConfig": {
    "defaults": {
      "unit": "percent",
      "decimals": 2,
      "thresholds": {
        "mode": "absolute",
        "steps": [
          {"value": null, "color": "green"},
          {"value": 0.1, "color": "yellow"},
          {"value": 1, "color": "red"}
        ]
      },
      "mappings": []
    }
  },
  "options": {
    "reduceOptions": {
      "values": false,
      "calcs": ["lastNotNull"]
    },
    "orientation": "auto",
    "textMode": "value_and_name",
    "colorMode": "background",
    "graphMode": "area"
  }
}
```

```json
{
  "type": "heatmap",
  "title": "Request Duration Heatmap",
  "gridPos": {"h": 8, "w": 12, "x": 0, "y": 8},
  "targets": [
    {
      "expr": "sum(rate(http_request_duration_seconds_bucket{job=\"api-service\",environment=\"$environment\",instance=~\"$instance\"}[$interval])) by (le)",
      "format": "heatmap",
      "legendFormat": "{{le}}",
      "refId": "A"
    }
  ],
  "options": {
    "calculate": true,
    "calculation": {
      "xBuckets": {
        "mode": "size",
        "value": "1m"
      }
    },
    "color": {
      "mode": "scheme",
      "scheme": "Spectral"
    },
    "cellGap": 2,
    "yAxis": {
      "unit": "s",
      "decimals": 2
    }
  }
}
```


## Step 4: Configure Rows and Layout

```json
{
  "panels": [
    {
      "type": "row",
      "title": "High-Level Metrics",
      "collapsed": false,
      "gridPos": {"h": 1, "w": 24, "x": 0, "y": 0},
      "panels": []
    },
    {
      "type": "stat",
      "title": "Request Rate",
      "gridPos": {"h": 4, "w": 6, "x": 0, "y": 1},
      "targets": [...]
    },
    {
      "type": "stat",
      "title": "Error Rate",
      "gridPos": {"h": 4, "w": 6, "x": 6, "y": 1},
      "targets": [...]
    },
    {
      "type": "row",
      "title": "Detailed Metrics",
      "collapsed": true,
      "gridPos": {"h": 1, "w": 24, "x": 0, "y": 5},
      "panels": [
        {
          "type": "timeseries",
          "title": "Latency by Endpoint",
          "gridPos": {"h": 8, "w": 12, "x": 0, "y": 6},
          "targets": [...]
        }
      ]
    }
  ]
}
```


## Step 5: Add Links and Drill-Downs

```json
{
  "links": [
    {
      "title": "Service Details",
      "type": "link",
      "icon": "external link",
      "url": "/d/service-details?var-service=$service&var-environment=$environment&$__url_time_range",
      "tooltip": "Detailed metrics for selected service",
      "targetBlank": false
    },
    {
      "title": "Database Dashboard",
      "type": "dashboards",
      "tags": ["database"],
      "icon": "dashboard",
      "tooltip": "All database-related dashboards",
      "asDropdown": true,
      "includeVars": true,
      "keepTime": true
    }
  ]
}
```

```json
{
  "fieldConfig": {
    "defaults": {
      "links": [
        {
          "title": "View Logs for ${__field.labels.instance}",
          "url": "/explore?left={\"datasource\":\"Loki\",\"queries\":[{\"refId\":\"A\",\"expr\":\"{instance=\\\"${__field.labels.instance}\\\"}\"}],\"range\":{\"from\":\"${__from}\",\"to\":\"${__to}\"}}",
          "targetBlank": true
        },
        {
          "title": "View Traces",
          "url": "/explore?left={\"datasource\":\"Tempo\",\"queries\":[{\"refId\":\"A\",\"query\":\"${__field.labels.trace_id}\"}]}"
        }
      ]
    }
  }
}
```


## Step 6: Set Up Dashboard Provisioning

```yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    jsonData:
      timeInterval: "15s"
      queryTimeout: "60s"
      httpMethod: POST
    editable: false

  - name: Loki
    type: loki
    access: proxy
    url: http://loki:3100
    jsonData:
      maxLines: 1000
    editable: false
```

