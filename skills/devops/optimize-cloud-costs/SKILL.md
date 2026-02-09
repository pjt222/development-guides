---
name: optimize-cloud-costs
description: >
  Implement cloud cost optimization strategies for Kubernetes workloads using tools like
  Kubecost for visibility, right-sizing recommendations, horizontal and vertical pod
  autoscaling, spot/preemptible instances, and resource quotas. Covers cost allocation,
  showback reporting, and continuous optimization practices.
license: MIT
allowed-tools: Read Write Edit Bash Grep Glob
metadata:
  author: Philipp Thoss
  version: "1.0"
  domain: devops
  complexity: intermediate
  language: multi
  tags: cost-optimization, kubecost, hpa, vpa, spot-instances, resource-management, kubernetes
---

# Optimize Cloud Costs

Implement comprehensive cost optimization strategies for Kubernetes clusters to reduce cloud spending.

## When to Use

- Cloud infrastructure costs growing without corresponding business value increase
- Need visibility into cost allocation by team, application, or environment
- Resource requests/limits not aligned with actual usage patterns
- Manual scaling leading to over-provisioning and waste
- Want to leverage spot/preemptible instances for non-critical workloads
- Need to implement showback or chargeback for internal cost allocation
- Seeking to establish FinOps culture with cost awareness and accountability

## Inputs

- **Required**: Kubernetes cluster with workloads running
- **Required**: Cloud provider billing API access
- **Required**: Metrics server or Prometheus for resource metrics
- **Optional**: Historical usage data for trend analysis
- **Optional**: Cost allocation requirements (by namespace, label, team)
- **Optional**: Service level objectives (SLOs) for performance constraints
- **Optional**: Budget limits or cost reduction targets

## Procedure

### Step 1: Deploy Cost Visibility Tools

Install Kubecost or OpenCost for cost monitoring and allocation.

**Install Kubecost:**
```bash
# Add Kubecost Helm repository
helm repo add kubecost https://kubecost.github.io/cost-analyzer/
helm repo update

# Install Kubecost with Prometheus integration
helm install kubecost kubecost/cost-analyzer \
  --namespace kubecost \
  --create-namespace \
  --set kubecostToken="your-token-here" \
  --set prometheus.server.global.external_labels.cluster_id="production-cluster" \
  --set prometheus.nodeExporter.enabled=true \
  --set prometheus.serviceAccounts.nodeExporter.create=true

# For existing Prometheus, configure Kubecost to use it
helm install kubecost kubecost/cost-analyzer \
  --namespace kubecost \
  --create-namespace \
  --set prometheus.enabled=false \
  --set global.prometheus.fqdn="http://prometheus-server.monitoring.svc.cluster.local" \
  --set global.prometheus.enabled=true

# Verify installation
kubectl get pods -n kubecost
kubectl get svc -n kubecost

# Access Kubecost UI
kubectl port-forward -n kubecost svc/kubecost-cost-analyzer 9090:9090
# Open http://localhost:9090
```

**Configure cloud provider integration:**
```yaml
# kubecost-cloud-integration.yaml
apiVersion: v1
kind: Secret
metadata:
  name: cloud-integration
  namespace: kubecost
type: Opaque
stringData:
  # For AWS
  cloud-integration.json: |
    {
      "aws": [
        {
          "serviceKeyName": "AWS_ACCESS_KEY_ID",
          "serviceKeySecret": "AWS_SECRET_ACCESS_KEY",
          "athenaProjectID": "cur-query-results",
          "athenaBucketName": "s3://your-cur-bucket",
          "athenaRegion": "us-east-1",
          "athenaDatabase": "athenacurcfn_my_cur",
          "athenaTable": "my_cur"
        }
      ]
    }
---
# For GCP
apiVersion: v1
kind: Secret
metadata:
  name: gcp-key
  namespace: kubecost
type: Opaque
data:
  key.json: <base64-encoded-service-account-key>
---
# For Azure
apiVersion: v1
kind: ConfigMap
metadata:
  name: azure-config
  namespace: kubecost
data:
  azure.json: |
    {
      "azureSubscriptionID": "your-subscription-id",
      "azureClientID": "your-client-id",
      "azureClientSecret": "your-client-secret",
      "azureTenantID": "your-tenant-id",
      "azureOfferDurableID": "MS-AZR-0003P"
    }
```

Apply cloud integration:
```bash
kubectl apply -f kubecost-cloud-integration.yaml

# Verify cloud costs are being imported
kubectl logs -n kubecost -l app=cost-analyzer -c cost-model --tail=100 | grep -i "cloud"

# Check Kubecost API for cost data
kubectl port-forward -n kubecost svc/kubecost-cost-analyzer 9090:9090 &
curl http://localhost:9090/model/allocation\?window\=7d | jq .
```

**Expected:** Kubecost pods running successfully. UI accessible showing cost breakdown by namespace, deployment, pod. Cloud provider costs importing (may take 24-48 hours for initial sync). API returning allocation data.

**On failure:**
- Check Prometheus is running and accessible: `kubectl get svc -n monitoring prometheus-server`
- Verify cloud credentials have billing API access
- Review cost-model logs: `kubectl logs -n kubecost -l app=cost-analyzer -c cost-model`
- Ensure metrics-server or Prometheus node-exporter collecting resource metrics
- Check for network policies blocking access to cloud billing APIs

### Step 2: Analyze Current Resource Utilization

Identify over-provisioned resources and optimization opportunities.

**Query resource utilization:**
```bash
# Get resource requests vs usage for all pods
kubectl top pods --all-namespaces --containers | \
  awk 'NR>1 {print $1,$2,$3,$4,$5}' > current-usage.txt

# Compare requests to actual usage
cat <<'EOF' > analyze-utilization.sh
#!/bin/bash
echo "Pod,Namespace,CPU-Request,CPU-Usage,Memory-Request,Memory-Usage"
for ns in $(kubectl get ns -o jsonpath='{.items[*].metadata.name}'); do
  kubectl get pods -n $ns -o json | jq -r '
    .items[] |
    select(.status.phase == "Running") |
    {
      name: .metadata.name,
      namespace: .metadata.namespace,
      containers: [
        .spec.containers[] |
        {
          name: .name,
          cpuReq: .resources.requests.cpu,
          memReq: .resources.requests.memory
        }
      ]
    } |
    "\(.name),\(.namespace),\(.containers[].cpuReq // "none"),\(.containers[].memReq // "none")"
  ' 2>/dev/null
done
EOF

chmod +x analyze-utilization.sh
./analyze-utilization.sh > resource-requests.csv

# Get actual usage from metrics server
kubectl top pods --all-namespaces --containers > actual-usage.txt
```

**Use Kubecost recommendations:**
```bash
# Get right-sizing recommendations via API
curl "http://localhost:9090/model/savings/requestSizing?window=7d" | jq . > recommendations.json

# Extract top wasteful resources
jq '.data[] | select(.totalRecommendedSavings > 10) | {
  cluster: .clusterID,
  namespace: .namespace,
  controller: .controllerName,
  container: .containerName,
  monthlySavings: .totalRecommendedSavings,
  currentCPU: .cpuRequest,
  recommendedCPU: .cpuRecommendation,
  currentMemory: .memoryRequest,
  recommendedMemory: .memoryRecommendation
}' recommendations.json | jq -s 'sort_by(-.monthlySavings)'

# Get efficiency scores
curl "http://localhost:9090/model/savings/clusterSizingETL?window=7d" | jq .
```

**Create utilization dashboard:**
```yaml
# grafana-utilization-dashboard.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: utilization-dashboard
  namespace: monitoring
  labels:
    grafana_dashboard: "1"
data:
  utilization.json: |
    {
      "dashboard": {
        "title": "Resource Utilization vs Requests",
        "panels": [
          {
            "title": "CPU Request vs Usage",
            "targets": [{
              "expr": "sum(rate(container_cpu_usage_seconds_total[5m])) by (namespace, pod) / sum(kube_pod_container_resource_requests{resource=\"cpu\"}) by (namespace, pod)"
            }]
          },
          {
            "title": "Memory Request vs Usage",
            "targets": [{
              "expr": "sum(container_memory_working_set_bytes) by (namespace, pod) / sum(kube_pod_container_resource_requests{resource=\"memory\"}) by (namespace, pod)"
            }]
          },
          {
            "title": "Most Over-Provisioned Pods",
            "targets": [{
              "expr": "topk(10, (sum(kube_pod_container_resource_requests{resource=\"cpu\"}) by (namespace, pod) - sum(rate(container_cpu_usage_seconds_total[1h])) by (namespace, pod)))"
            }]
          }
        ]
      }
    }
```

**Expected:** Clear view of current resource requests vs actual usage. Identification of pods with <30% utilization (over-provisioned). List of optimization opportunities with estimated savings. Dashboard showing utilization trends over time.

**On failure:**
- Ensure metrics-server is running: `kubectl get deployment metrics-server -n kube-system`
- Check if Prometheus has node-exporter metrics: `curl http://prometheus:9090/api/v1/query?query=node_cpu_seconds_total`
- Verify pods have been running long enough for meaningful data (at least 24 hours)
- Check for gaps in metrics collection: review Prometheus retention and scrape intervals
- For Kubecost, ensure it has collected at least 48 hours of data

### Step 3: Implement Horizontal Pod Autoscaling (HPA)

Configure automatic scaling based on CPU, memory, or custom metrics.

**Create HPA for CPU-based scaling:**
```yaml
# hpa-cpu.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-server-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-server
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
      - type: Pods
        value: 2
        periodSeconds: 60
      selectPolicy: Min
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 30
      - type: Pods
        value: 4
        periodSeconds: 30
      selectPolicy: Max
---
# HPA with custom metrics (requires metrics adapter)
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: worker-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: worker
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Pods
    pods:
      metric:
        name: queue_depth
      target:
        type: AverageValue
        averageValue: "30"
  - type: External
    external:
      metric:
        name: pubsub_subscription_num_undelivered_messages
        selector:
          matchLabels:
            subscription: "worker-queue"
      target:
        type: AverageValue
        averageValue: "100"
```

**Deploy and verify HPA:**
```bash
kubectl apply -f hpa-cpu.yaml

# Check HPA status
kubectl get hpa -n production
kubectl describe hpa api-server-hpa -n production

# Monitor scaling events
kubectl get events -n production --field-selector involvedObject.kind=HorizontalPodAutoscaler --watch

# Generate load to test autoscaling
kubectl run load-generator --rm -it --image=busybox -- /bin/sh -c \
  "while true; do wget -q -O- http://api-server.production.svc.cluster.local; done"

# Watch replicas scale
watch kubectl get hpa,deployment -n production
```

**Expected:** HPA created and showing current/target metrics. Pods scale up under load. Pods scale down when load decreases (after stabilization window). Scaling events logged. No thrashing (rapid scale up/down cycles).

**On failure:**
- Verify metrics-server is running: `kubectl get apiservice v1beta1.metrics.k8s.io`
- Check if deployment has resource requests set (HPA requires this)
- Review HPA events: `kubectl describe hpa api-server-hpa -n production`
- Ensure target deployment is not at max replicas
- For custom metrics, verify metrics adapter installed and configured
- Check HPA controller logs: `kubectl logs -n kube-system -l app=kube-controller-manager | grep horizontal-pod-autoscaler`

### Step 4: Configure Vertical Pod Autoscaling (VPA)

Automatically adjust resource requests based on actual usage patterns.

**Install VPA:**
```bash
# Clone VPA repository
git clone https://github.com/kubernetes/autoscaler.git
cd autoscaler/vertical-pod-autoscaler

# Install VPA
./hack/vpa-up.sh

# Verify installation
kubectl get pods -n kube-system | grep vpa

# Check VPA CRDs
kubectl get crd | grep verticalpodautoscaler
```

**Create VPA policies:**
```yaml
# vpa-policies.yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: api-server-vpa
  namespace: production
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-server
  updatePolicy:
    updateMode: "Auto"  # Options: Off, Initial, Recreate, Auto
  resourcePolicy:
    containerPolicies:
    - containerName: api-server
      minAllowed:
        cpu: 100m
        memory: 128Mi
      maxAllowed:
        cpu: 2000m
        memory: 2Gi
      controlledResources:
      - cpu
      - memory
      mode: Auto
---
# VPA in recommendation-only mode (safe for testing)
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: worker-vpa
  namespace: production
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: worker
  updatePolicy:
    updateMode: "Off"  # Only provide recommendations
  resourcePolicy:
    containerPolicies:
    - containerName: worker
      minAllowed:
        cpu: 50m
        memory: 64Mi
      maxAllowed:
        cpu: 4000m
        memory: 4Gi
---
# VPA with PodDisruptionBudget awareness
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: api-server-pdb
  namespace: production
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: api-server
---
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: database-vpa
  namespace: production
spec:
  targetRef:
    apiVersion: apps/v1
    kind: StatefulSet
    name: database
  updatePolicy:
    updateMode: "Initial"  # Only set requests on pod creation
  resourcePolicy:
    containerPolicies:
    - containerName: postgres
      minAllowed:
        cpu: 500m
        memory: 1Gi
      maxAllowed:
        cpu: 8000m
        memory: 16Gi
      controlledResources:
      - memory
```

**Deploy and monitor VPA:**
```bash
kubectl apply -f vpa-policies.yaml

# Check VPA recommendations
kubectl get vpa -n production
kubectl describe vpa api-server-vpa -n production

# View detailed recommendations
kubectl get vpa api-server-vpa -n production -o jsonpath='{.status.recommendation}' | jq .

# Monitor VPA-initiated pod updates
kubectl get events -n production --field-selector involvedObject.kind=VerticalPodAutoscaler --watch

# Compare recommendations to current requests
kubectl get deployment api-server -n production -o json | \
  jq '.spec.template.spec.containers[].resources.requests'
```

**Expected:** VPA providing recommendations or automatically updating resource requests. Recommendations based on percentile usage patterns (typically P95). Pods restarted with new requests when using Auto/Recreate mode. No conflicts between HPA and VPA (use HPA for replicas, VPA for resources per pod).

**On failure:**
- Ensure metrics-server has sufficient data (VPA needs several days for accurate recommendations)
- Check VPA components running: `kubectl get pods -n kube-system | grep vpa`
- Review VPA admission controller logs: `kubectl logs -n kube-system -l app=vpa-admission-controller`
- Verify webhook is registered: `kubectl get mutatingwebhookconfigurations vpa-webhook-config`
- Don't use VPA and HPA on same metric (CPU/memory) - causes conflicts
- Start with "Off" mode to review recommendations before enabling automatic updates

### Step 5: Leverage Spot/Preemptible Instances

Configure workload scheduling on cost-effective spot instances.

**Create node pools with spot instances:**
```yaml
# For AWS (via Karpenter)
apiVersion: karpenter.sh/v1alpha5
kind: Provisioner
metadata:
  name: spot-provisioner
spec:
  requirements:
  - key: karpenter.sh/capacity-type
    operator: In
    values: ["spot"]
  - key: kubernetes.io/arch
    operator: In
    values: ["amd64"]
  - key: node.kubernetes.io/instance-type
    operator: In
    values: ["m5.large", "m5.xlarge", "m5a.large", "m5a.xlarge"]
  limits:
    resources:
      cpu: 1000
      memory: 1000Gi
  providerRef:
    name: spot-provider
  labels:
    node-type: spot
  taints:
  - key: spot
    value: "true"
    effect: NoSchedule
  ttlSecondsAfterEmpty: 30
  ttlSecondsUntilExpired: 2592000
---
apiVersion: karpenter.k8s.aws/v1alpha1
kind: AWSNodeTemplate
metadata:
  name: spot-provider
spec:
  subnetSelector:
    karpenter.sh/discovery: production-cluster
  securityGroupSelector:
    karpenter.sh/discovery: production-cluster
  instanceProfile: KarpenterNodeInstanceProfile
  amiFamily: AL2
  tags:
    Environment: production
    ManagedBy: karpenter
    NodeType: spot
```

**Configure workloads for spot instances:**
```yaml
# spot-workload.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: batch-processor
  namespace: production
spec:
  replicas: 5
  selector:
    matchLabels:
      app: batch-processor
  template:
    metadata:
      labels:
        app: batch-processor
    spec:
      # Tolerate spot node taint
      tolerations:
      - key: spot
        operator: Equal
        value: "true"
        effect: NoSchedule
      # Prefer spot nodes
      affinity:
        nodeAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            preference:
              matchExpressions:
              - key: node-type
                operator: In
                values:
                - spot
      # Configure for spot interruption
      terminationGracePeriodSeconds: 30
      containers:
      - name: processor
        image: batch-processor:v1.0
        resources:
          requests:
            cpu: 500m
            memory: 1Gi
          limits:
            cpu: 2000m
            memory: 2Gi
        # Add spot interruption handler
        lifecycle:
          preStop:
            exec:
              command:
              - /bin/sh
              - -c
              - "sleep 15 && kill -SIGTERM 1"
---
# Node Termination Handler DaemonSet (AWS)
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: aws-node-termination-handler
  namespace: kube-system
spec:
  selector:
    matchLabels:
      app: aws-node-termination-handler
  template:
    metadata:
      labels:
        app: aws-node-termination-handler
    spec:
      serviceAccountName: aws-node-termination-handler
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
            - matchExpressions:
              - key: node-type
                operator: In
                values:
                - spot
      containers:
      - name: handler
        image: public.ecr.aws/aws-ec2/aws-node-termination-handler:v1.19.0
        env:
        - name: NODE_NAME
          valueFrom:
            fieldRef:
              fieldPath: spec.nodeName
        - name: POD_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: NAMESPACE
          valueFrom:
            fieldRef:
              fieldPath: metadata.namespace
        - name: ENABLE_SPOT_INTERRUPTION_DRAINING
          value: "true"
        - name: ENABLE_SCHEDULED_EVENT_DRAINING
          value: "true"
```

**Deploy and monitor spot usage:**
```bash
kubectl apply -f spot-workload.yaml

# Monitor spot node allocation
kubectl get nodes -l node-type=spot

# Check workload distribution
kubectl get pods -n production -o wide | grep batch-processor

# Monitor spot interruptions
kubectl get events --field-selector reason=SpotInterruption -w

# Calculate spot savings
cat <<'EOF' > calculate-spot-savings.sh
#!/bin/bash
ONDEMAND_COST=$(kubectl get nodes -l node-type=ondemand -o json | \
  jq '[.items[].metadata.annotations."karpenter.sh/provisioner-pricing"] | add')
SPOT_COST=$(kubectl get nodes -l node-type=spot -o json | \
  jq '[.items[].metadata.annotations."karpenter.sh/provisioner-pricing"] | add')

echo "On-Demand Cost: \$$ONDEMAND_COST/hour"
echo "Spot Cost: \$$SPOT_COST/hour"
echo "Savings: \$$(echo "$ONDEMAND_COST - $SPOT_COST" | bc)/hour"
EOF

chmod +x calculate-spot-savings.sh
./calculate-spot-savings.sh
```

**Expected:** Workloads scheduled on spot nodes successfully. Significant cost reduction (typically 60-90% vs on-demand). Graceful handling of spot interruptions with pod rescheduling. Monitoring shows spot interruption rate and successful recovery.

**On failure:**
- Verify spot instance availability in your region/zones
- Check node labels and taints match workload tolerations
- Review Karpenter logs: `kubectl logs -n karpenter -l app.kubernetes.io/name=karpenter`
- Ensure workloads are stateless or have proper state management for interruptions
- Test interruption handling: manually cordon and drain spot node
- Monitor interruption rate - if too high, consider fallback to on-demand nodes

### Step 6: Implement Resource Quotas and Budget Alerts

Set hard limits and alerting for cost control.

**Create resource quotas:**
```yaml
# resource-quotas.yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: production-quota
  namespace: production
spec:
  hard:
    requests.cpu: "100"
    requests.memory: 200Gi
    limits.cpu: "200"
    limits.memory: 400Gi
    persistentvolumeclaims: "50"
    requests.storage: 1Ti
    count/pods: "1000"
    count/services.loadbalancers: "5"
---
apiVersion: v1
kind: ResourceQuota
metadata:
  name: development-quota
  namespace: development
spec:
  hard:
    requests.cpu: "20"
    requests.memory: 40Gi
    limits.cpu: "40"
    limits.memory: 80Gi
    persistentvolumeclaims: "10"
    requests.storage: 200Gi
---
# Limit ranges for default values
apiVersion: v1
kind: LimitRange
metadata:
  name: production-limits
  namespace: production
spec:
  limits:
  - max:
      cpu: "4"
      memory: 8Gi
    min:
      cpu: 50m
      memory: 64Mi
    default:
      cpu: 500m
      memory: 512Mi
    defaultRequest:
      cpu: 100m
      memory: 128Mi
    type: Container
  - max:
      storage: 100Gi
    min:
      storage: 1Gi
    type: PersistentVolumeClaim
```

**Configure budget alerts:**
```yaml
# kubecost-budget-alerts.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: budget-alerts
  namespace: kubecost
data:
  alerts.json: |
    [
      {
        "type": "budget",
        "threshold": 1000,
        "window": "monthly",
        "aggregation": "namespace",
        "filter": "namespace:production",
        "ownerContact": ["team-lead@example.com"]
      },
      {
        "type": "spend",
        "threshold": 50,
        "window": "daily",
        "aggregation": "deployment",
        "filter": "namespace:production",
        "ownerContact": ["platform-team@example.com"]
      },
      {
        "type": "efficiency",
        "threshold": 0.5,
        "window": "weekly",
        "aggregation": "cluster",
        "ownerContact": ["finops-team@example.com"]
      }
    ]
---
# Prometheus alert rules
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: cost-alerts
  namespace: monitoring
spec:
  groups:
  - name: cost-monitoring
    interval: 60s
    rules:
    - alert: NamespaceOverBudget
      expr: |
        sum(kubecost_monthly_cost) by (namespace) > 1000
      for: 1h
      labels:
        severity: warning
      annotations:
        summary: "Namespace {{ $labels.namespace }} over monthly budget"
        description: "Cost: ${{ $value }}"

    - alert: ClusterCostSpike
      expr: |
        (sum(rate(kubecost_hourly_cost[1h])) / sum(rate(kubecost_hourly_cost[1h] offset 24h))) > 1.5
      for: 30m
      labels:
        severity: critical
      annotations:
        summary: "Cluster cost increased by 50% in last 24h"

    - alert: LowResourceUtilization
      expr: |
        (sum(rate(container_cpu_usage_seconds_total[5m])) / sum(kube_pod_container_resource_requests{resource="cpu"})) < 0.3
      for: 2h
      labels:
        severity: warning
      annotations:
        summary: "Cluster CPU utilization below 30%"
```

Apply and monitor:
```bash
kubectl apply -f resource-quotas.yaml
kubectl apply -f kubecost-budget-alerts.yaml

# Check quota usage
kubectl get resourcequota -n production
kubectl describe resourcequota production-quota -n production

# Monitor quota across namespaces
kubectl get resourcequota --all-namespaces

# Test quota enforcement
kubectl run test-pod --image=nginx --requests=cpu=200 -n production
# Should fail if over quota

# View budget status in Kubecost
curl "http://localhost:9090/model/budgets" | jq .
```

**Expected:** Resource quotas enforcing limits per namespace. Pod creation blocked when quota exceeded. Budget alerts firing when thresholds breached. Cost spike detection working. Regular reports sent to stakeholders.

**On failure:**
- Verify ResourceQuota and LimitRange applied correctly: `kubectl get resourcequota,limitrange -A`
- Check for pods failing due to quota: `kubectl get events -n production | grep quota`
- Review Kubecost alert configuration: `kubectl logs -n kubecost -l app=cost-analyzer | grep alert`
- Ensure Prometheus has Kubecost metrics: `curl http://prometheus:9090/api/v1/query?query=kubecost_monthly_cost`
- Test alert routing: verify email/Slack webhook configuration

## Validation

- [ ] Kubecost or OpenCost deployed and showing accurate cost data
- [ ] Cloud provider billing integration working (costs match actual bills)
- [ ] Resource utilization analysis identifies over-provisioned workloads
- [ ] HPA scaling pods based on load (verified with load test)
- [ ] VPA providing recommendations or auto-adjusting resource requests
- [ ] Spot instances handling interruptions gracefully
- [ ] Resource quotas enforcing limits per namespace
- [ ] Budget alerts firing when thresholds exceeded
- [ ] Monthly cost trending downward or staying within budget
- [ ] Showback reports generated for teams/projects
- [ ] No performance degradation from cost optimizations
- [ ] Documentation updated with optimization practices

## Common Pitfalls

- **Aggressive Right-Sizing**: Don't immediately apply VPA recommendations. Start with "Off" mode, review suggestions for a week, then gradually apply. Sudden changes can cause OOMKills or CPU throttling.

- **HPA + VPA Conflict**: Never use HPA and VPA on same metric (CPU/memory). Use HPA for horizontal scaling, VPA for per-pod resource tuning, or HPA on custom metrics + VPA on resources.

- **Spot Without Fault Tolerance**: Only run fault-tolerant, stateless workloads on spot. Never databases, stateful services, or single-replica critical services. Always use PodDisruptionBudgets.

- **Insufficient Monitoring Period**: Cost optimization decisions need historical data. Wait at least 7 days before making changes, 30 days for VPA recommendations, 90 days for trend analysis.

- **Ignoring Burst Requirements**: Setting limits too low based on average usage causes throttling during traffic spikes. Use P95 or P99 percentiles, not average, for capacity planning.

- **Network Egress Costs**: Compute costs visible in Kubecost, but egress (data transfer) can be significant. Monitor cross-AZ traffic, use topology-aware routing, consider data transfer costs in architecture.

- **Storage Overlooked**: PersistentVolume costs often forgotten. Audit unused PVCs, right-size volumes, use volume expansion instead of over-provisioning, implement PV cleanup policies.

- **Quota Too Restrictive**: Setting quotas too low blocks legitimate growth. Review quota usage monthly, adjust based on actual needs, communicate limits to teams before enforcement.

- **False Savings from Wrong Metrics**: Using CPU/memory as sole optimization metric misses I/O, network, storage costs. Consider total cost of ownership, not just compute.

- **Chargeback Before Trust**: Implementing chargeback before teams understand and trust cost data causes friction. Start with showback (informational), build culture of cost awareness, then move to chargeback.

## Related Skills

- `deploy-to-kubernetes` - Application deployment with appropriate resource requests
- `setup-prometheus-monitoring` - Monitoring infrastructure for cost metrics
- `plan-capacity` - Capacity planning based on cost and performance
- `setup-local-kubernetes` - Local development to avoid cloud costs
- `write-helm-chart` - Templating resource requests and limits
- `implement-gitops-workflow` - GitOps for cost-optimized configurations
