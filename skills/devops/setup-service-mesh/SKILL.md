---
name: setup-service-mesh
description: >
  Deploy and configure a service mesh (Istio or Linkerd) to enable secure service-to-service
  communication, traffic management, observability, and policy enforcement in Kubernetes clusters.
  Covers installation, mTLS configuration, traffic routing, circuit breaking, and integration
  with monitoring tools.
license: MIT
allowed-tools: Read Write Edit Bash Grep Glob
metadata:
  author: Philipp Thoss
  version: "1.0"
  domain: devops
  complexity: advanced
  language: multi
  tags: service-mesh, istio, linkerd, mtls, traffic-management, observability, kubernetes
---

# Setup Service Mesh

Deploy and configure a service mesh for secure service-to-service communication and advanced traffic management.

## When to Use

- Microservices architecture requires encrypted service-to-service communication
- Need fine-grained traffic control (canary deployments, A/B testing, traffic splitting)
- Require observability across all service interactions without application changes
- Enforce security policies (mTLS, authorization) at the infrastructure level
- Implement circuit breaking, retries, and timeouts consistently across services
- Need distributed tracing and service dependency mapping

## Inputs

- **Required**: Kubernetes cluster with admin access
- **Required**: Choice of service mesh (Istio or Linkerd)
- **Required**: Namespace(s) to enable service mesh
- **Optional**: Monitoring stack (Prometheus, Grafana, Jaeger)
- **Optional**: Custom traffic management requirements
- **Optional**: Certificate authority configuration for mTLS

## Procedure

### Step 1: Install Service Mesh Control Plane

Choose and install the service mesh control plane.

**For Istio:**
```bash
# Download Istio
curl -L https://istio.io/downloadIstio | ISTIO_VERSION=1.20.2 sh -
cd istio-1.20.2
export PATH=$PWD/bin:$PATH

# Install with demo profile (or production profile for production)
istioctl install --set profile=production -y

# Verify installation
kubectl get pods -n istio-system
kubectl get svc -n istio-system
```

**For Linkerd:**
```bash
# Install Linkerd CLI
curl -sL https://run.linkerd.io/install | sh
export PATH=$PATH:$HOME/.linkerd2/bin

# Verify cluster compatibility
linkerd check --pre

# Install Linkerd control plane with HA
linkerd install --ha | kubectl apply -f -

# Verify installation
linkerd check
kubectl get pods -n linkerd
```

Create a service mesh configuration file:
```yaml
# service-mesh-config.yaml
apiVersion: install.istio.io/v1alpha1
kind: IstioOperator
metadata:
  name: production-istio
  namespace: istio-system
spec:
  profile: production
  meshConfig:
    accessLogFile: /dev/stdout
    enableTracing: true
    defaultConfig:
      tracing:
        sampling: 100
        zipkin:
          address: jaeger-collector.observability:9411
  components:
    pilot:
      k8s:
        resources:
          requests:
            cpu: 500m
            memory: 2Gi
          limits:
            cpu: 2000m
            memory: 4Gi
    ingressGateways:
    - name: istio-ingressgateway
      enabled: true
      k8s:
        resources:
          requests:
            cpu: 200m
            memory: 256Mi
        service:
          type: LoadBalancer
```

**Expected:** Control plane pods running in istio-system (Istio) or linkerd (Linkerd) namespace. `istioctl version` or `linkerd version` shows matching client and server versions.

**On failure:**
- Check cluster has sufficient resources (at least 4 CPU cores, 8GB RAM for production)
- Verify Kubernetes version compatibility (check mesh documentation)
- Review logs: `kubectl logs -n istio-system -l app=istiod` or `kubectl logs -n linkerd -l linkerd.io/control-plane-component=controller`
- Check for conflicting CRDs: `kubectl get crd | grep istio` or `kubectl get crd | grep linkerd`

### Step 2: Enable Automatic Sidecar Injection

Configure namespaces for automatic sidecar proxy injection.

**For Istio:**
```bash
# Label namespace for automatic injection
kubectl label namespace default istio-injection=enabled
kubectl label namespace production istio-injection=enabled

# Verify label
kubectl get namespace -L istio-injection

# Create injection configuration for specific workloads
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Namespace
metadata:
  name: application
  labels:
    istio-injection: enabled
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: istio-sidecar-injector
  namespace: istio-system
data:
  values: |
    global:
      proxy:
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 256Mi
EOF
```

**For Linkerd:**
```bash
# Annotate namespace for injection
kubectl annotate namespace default linkerd.io/inject=enabled
kubectl annotate namespace production linkerd.io/inject=enabled

# For specific deployments, annotate the pod template
kubectl get deploy -n default -o yaml | \
  linkerd inject - | \
  kubectl apply -f -
```

Test sidecar injection with a sample deployment:
```yaml
# test-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: test-app
  namespace: default
spec:
  replicas: 2
  selector:
    matchLabels:
      app: test-app
  template:
    metadata:
      labels:
        app: test-app
    spec:
      containers:
      - name: app
        image: nginx:alpine
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: test-app
  namespace: default
spec:
  selector:
    app: test-app
  ports:
  - port: 80
    targetPort: 80
```

```bash
kubectl apply -f test-deployment.yaml
kubectl get pods -n default
kubectl describe pod -n default -l app=test-app
```

**Expected:** New pods show 2/2 containers (application + sidecar proxy). Describe output shows istio-proxy or linkerd-proxy container. Logs show successful proxy startup.

**On failure:**
- Check namespace labels/annotations: `kubectl get ns default -o yaml`
- Verify mutating webhook is active: `kubectl get mutatingwebhookconfiguration`
- Review injection logs: `kubectl logs -n istio-system -l app=sidecar-injector` (Istio)
- Manually inject to test: `kubectl get deploy test-app -o yaml | istioctl kube-inject -f - | kubectl apply -f -`

### Step 3: Configure mTLS Policy

Enable mutual TLS for secure service-to-service communication.

**For Istio:**
```yaml
# mtls-policy.yaml
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: istio-system
spec:
  mtls:
    mode: STRICT
---
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default-production
  namespace: production
spec:
  mtls:
    mode: STRICT
---
# Allow specific workloads to use PERMISSIVE for migration
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: legacy-service
  namespace: production
spec:
  selector:
    matchLabels:
      app: legacy-api
  mtls:
    mode: PERMISSIVE
---
# Destination rule for TLS origination
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: global-mtls
  namespace: istio-system
spec:
  host: "*.local"
  trafficPolicy:
    tls:
      mode: ISTIO_MUTUAL
```

**For Linkerd:**
```bash
# Linkerd enforces mTLS by default for meshed pods
# Verify mTLS is working
linkerd viz tap deploy/test-app -n default

# Check for 🔒 (lock) symbol indicating encrypted connections
linkerd viz stat deploy -n default

# Create ServerAuthorization for fine-grained access control
cat <<EOF | kubectl apply -f -
apiVersion: policy.linkerd.io/v1beta1
kind: Server
metadata:
  name: test-app-server
  namespace: default
spec:
  podSelector:
    matchLabels:
      app: test-app
  port: 80
---
apiVersion: policy.linkerd.io/v1alpha1
kind: ServerAuthorization
metadata:
  name: test-app-authz
  namespace: default
spec:
  server:
    name: test-app-server
  client:
    meshTLS:
      serviceAccounts:
      - name: default
        namespace: production
EOF
```

Apply and verify:
```bash
kubectl apply -f mtls-policy.yaml

# For Istio, verify mTLS status
istioctl authn tls-check $(kubectl get pod -n default -l app=test-app -o jsonpath='{.items[0].metadata.name}') -n default

# Test connectivity
kubectl run curl-test --image=curlimages/curl:latest --rm -it --restart=Never -- \
  curl -v http://test-app.default.svc.cluster.local
```

**Expected:** All connections between meshed services show mTLS enabled. Istio `tls-check` shows STATUS as "OK". Linkerd `tap` output shows 🔒 for all connections. Service logs show no TLS errors.

**On failure:**
- Check certificate issuance: `kubectl get certificates -A` (cert-manager)
- Verify CA is healthy: `kubectl logs -n istio-system -l app=istiod | grep -i cert`
- Test with PERMISSIVE mode first, then transition to STRICT
- Check for services without sidecars: `kubectl get pods --all-namespaces -o json | jq '.items[] | select(.spec.containers | length == 1) | .metadata.name'`

### Step 4: Implement Traffic Management Rules

Configure intelligent traffic routing, retries, and circuit breaking.

Create traffic management policies:
```yaml
# traffic-management.yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: api-routes
  namespace: production
spec:
  hosts:
  - api.example.com
  gateways:
  - istio-gateway
  http:
  # Canary deployment: 90% v1, 10% v2
  - match:
    - uri:
        prefix: /api/v2
    route:
    - destination:
        host: api-service
        subset: v2
      weight: 10
    - destination:
        host: api-service
        subset: v1
      weight: 90
    retries:
      attempts: 3
      perTryTimeout: 2s
      retryOn: 5xx,reset,connect-failure
    timeout: 10s
  # A/B testing based on headers
  - match:
    - headers:
        x-beta-user:
          exact: "true"
    route:
    - destination:
        host: api-service
        subset: v2
  - route:
    - destination:
        host: api-service
        subset: v1
---
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: api-circuit-breaker
  namespace: production
spec:
  host: api-service
  subsets:
  - name: v1
    labels:
      version: v1
  - name: v2
    labels:
      version: v2
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        http1MaxPendingRequests: 50
        http2MaxRequests: 100
        maxRequestsPerConnection: 2
    outlierDetection:
      consecutive5xxErrors: 5
      interval: 30s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
      minHealthPercent: 40
---
# Gateway for external traffic
apiVersion: networking.istio.io/v1beta1
kind: Gateway
metadata:
  name: istio-gateway
  namespace: production
spec:
  selector:
    istio: ingressgateway
  servers:
  - port:
      number: 443
      name: https
      protocol: HTTPS
    tls:
      mode: SIMPLE
      credentialName: api-tls-cert
    hosts:
    - api.example.com
```

**For Linkerd traffic splitting:**
```yaml
# linkerd-traffic-split.yaml
apiVersion: split.smi-spec.io/v1alpha2
kind: TrafficSplit
metadata:
  name: api-rollout
  namespace: production
spec:
  service: api-service
  backends:
  - service: api-service-v1
    weight: 900
  - service: api-service-v2
    weight: 100
```

Apply and test:
```bash
kubectl apply -f traffic-management.yaml

# Test traffic distribution
for i in {1..100}; do
  curl -s http://api.example.com/api/v2 | grep version
done | sort | uniq -c

# Monitor traffic in real-time
istioctl dashboard kiali
# OR for Linkerd:
linkerd viz dashboard
```

**Expected:** Traffic splits according to defined weights. Circuit breaker trips after consecutive errors. Retries occur for transient failures. Kiali/Linkerd dashboard shows traffic flow visualization.

**On failure:**
- Verify destination hosts resolve: `kubectl get svc -n production`
- Check subset labels match pod labels: `kubectl get pods -n production --show-labels`
- Review pilot logs: `kubectl logs -n istio-system -l app=istiod`
- Test without circuit breaker first, then add incrementally
- Use `istioctl analyze` to check configuration: `istioctl analyze -n production`

### Step 5: Integrate Observability Stack

Connect service mesh telemetry to monitoring and tracing systems.

**Install observability addons:**
```bash
# For Istio (includes Prometheus, Grafana, Kiali, Jaeger)
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.20/samples/addons/prometheus.yaml
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.20/samples/addons/grafana.yaml
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.20/samples/addons/kiali.yaml
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.20/samples/addons/jaeger.yaml

# For Linkerd
linkerd viz install | kubectl apply -f -
linkerd jaeger install | kubectl apply -f -
```

Configure custom metrics and dashboards:
```yaml
# service-monitor.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: istio-grafana-dashboards
  namespace: istio-system
  labels:
    grafana_dashboard: "1"
data:
  istio-mesh-dashboard.json: |
    {
      "dashboard": {
        "title": "Istio Mesh Dashboard",
        "panels": [
          {
            "title": "Request Rate",
            "targets": [
              {
                "expr": "sum(rate(istio_requests_total[5m])) by (destination_service_name)"
              }
            ]
          },
          {
            "title": "Success Rate",
            "targets": [
              {
                "expr": "sum(rate(istio_requests_total{response_code!~\"5.*\"}[5m])) / sum(rate(istio_requests_total[5m])) * 100"
              }
            ]
          }
        ]
      }
    }
---
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: istio-mesh-metrics
  namespace: istio-system
spec:
  selector:
    matchLabels:
      app: istiod
  endpoints:
  - port: http-monitoring
    interval: 30s
    path: /metrics
```

Create custom telemetry for business metrics:
```yaml
# telemetry.yaml
apiVersion: telemetry.istio.io/v1alpha1
kind: Telemetry
metadata:
  name: custom-metrics
  namespace: production
spec:
  metrics:
  - providers:
    - name: prometheus
    dimensions:
      request_path: request.path
      response_code: response.code
    overrides:
    - match:
        metric: REQUEST_COUNT
      tagOverrides:
        destination_port:
          operation: REMOVE
```

Access dashboards:
```bash
# Istio dashboards
istioctl dashboard grafana
istioctl dashboard kiali
istioctl dashboard jaeger

# Linkerd dashboards
linkerd viz dashboard
linkerd jaeger dashboard

# Port-forward for external access
kubectl port-forward -n istio-system svc/grafana 3000:3000
kubectl port-forward -n istio-system svc/kiali 20001:20001
```

**Expected:** Dashboards show service topology, request rates, latency percentiles, error rates. Distributed traces available in Jaeger. Prometheus scraping mesh metrics successfully. Custom metrics appear in queries.

**On failure:**
- Verify Prometheus scraping: `kubectl get servicemonitor -A`
- Check addon pods are running: `kubectl get pods -n istio-system`
- Review telemetry configuration: `istioctl proxy-config log <pod-name> -n <namespace>`
- Verify mesh config has telemetry enabled: `kubectl get configmap istio -n istio-system -o yaml | grep -A 5 enableTracing`
- Check for port conflicts if port-forward fails

### Step 6: Validate and Monitor Mesh Health

Perform comprehensive health checks and set up ongoing monitoring.

```bash
# Istio validation
istioctl analyze --all-namespaces
istioctl verify-install
istioctl proxy-status

# Linkerd validation
linkerd check
linkerd viz check
linkerd diagnostics policy

# Check proxy sync status
kubectl get pods -n production -o json | \
  jq '.items[] | {name: .metadata.name, proxy: .status.containerStatuses[] | select(.name=="istio-proxy").ready}'

# Test end-to-end connectivity with mTLS
kubectl exec -it deploy/test-app -n default -- \
  curl -v https://api-service.production.svc.cluster.local

# Monitor control plane health
kubectl get pods -n istio-system -w
kubectl top pods -n istio-system

# Set up alerts for mesh issues
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: istio-alerts
  namespace: istio-system
data:
  alerts.yaml: |
    groups:
    - name: istio
      interval: 30s
      rules:
      - alert: HighSidecarMemory
        expr: container_memory_usage_bytes{container="istio-proxy"} > 500000000
        for: 5m
        annotations:
          summary: "High sidecar memory usage"
      - alert: MeshConfigSyncFailed
        expr: pilot_proxy_convergence_time{job="istiod"} > 30
        for: 5m
        annotations:
          summary: "Mesh configuration sync taking too long"
EOF
```

Create health check script:
```bash
#!/bin/bash
# mesh-health-check.sh
echo "=== Service Mesh Health Check ==="

echo "1. Control Plane Status:"
kubectl get pods -n istio-system

echo "2. Proxy Injection Status:"
kubectl get namespace -L istio-injection

echo "3. Configuration Analysis:"
istioctl analyze --all-namespaces

echo "4. mTLS Status:"
istioctl authn tls-check $(kubectl get pod -n production -l app=api-service -o jsonpath='{.items[0].metadata.name}').production

echo "5. Traffic Metrics (last 5 min):"
kubectl exec -n istio-system deploy/istiod -- \
  curl -s localhost:15014/metrics | grep istio_requests_total | tail -5

echo "=== Health Check Complete ==="
```

**Expected:** All analysis checks pass with no warnings. Proxy-status shows all proxies synced. mTLS check confirms encryption. Metrics show traffic flowing. Control plane pods stable with low resource usage.

**On failure:**
- Address specific issues from `istioctl analyze` output
- Check proxy logs for individual pods: `kubectl logs <pod> -c istio-proxy -n <namespace>`
- Verify network policies aren't blocking mesh traffic
- Review control plane logs for errors: `kubectl logs -n istio-system deploy/istiod --tail=100`
- Restart problematic proxies: `kubectl rollout restart deploy/<deployment> -n <namespace>`

## Validation

- [ ] Control plane pods running and healthy (istiod/linkerd-controller)
- [ ] Sidecar proxies injected into all application pods (2/2 containers)
- [ ] mTLS enabled and functioning (verified with tls-check/tap)
- [ ] Traffic management rules routing requests correctly (verified with curl tests)
- [ ] Circuit breaker trips on repeated failures (tested with fault injection)
- [ ] Observability dashboards showing metrics (Grafana/Kiali/Linkerd Viz)
- [ ] Distributed traces captured in Jaeger for sample requests
- [ ] No configuration warnings from istioctl analyze/linkerd check
- [ ] Proxy sync status shows all proxies in sync
- [ ] Service-to-service communication encrypted (verified in logs/dashboards)

## Common Pitfalls

- **Resource Exhaustion**: Service mesh adds 100-200MB memory per pod for sidecars. Ensure cluster has sufficient capacity. Set appropriate resource limits in injection config.

- **Configuration Conflicts**: Multiple VirtualServices for same host cause undefined behavior. Use single VirtualService per host with multiple match conditions instead.

- **Certificate Expiration**: mTLS certificates auto-rotate but CA root must be managed. Monitor certificate expiry with: `kubectl get certificate -A` and set up alerts.

- **Sidecar Not Injected**: Pods created before namespace labeling won't have sidecars. Must recreate: `kubectl rollout restart deploy/<name> -n <namespace>`.

- **DNS Resolution Issues**: Service mesh intercepts DNS. Use fully qualified names (service.namespace.svc.cluster.local) for cross-namespace calls.

- **Port Naming Requirement**: Istio requires named ports following protocol-name pattern (e.g., http-web, tcp-db). Unnamed ports default to TCP passthrough.

- **Gradual Rollout Required**: Don't enable STRICT mTLS immediately in production. Use PERMISSIVE mode during migration, verify all services meshed, then switch to STRICT.

- **Observability Overhead**: 100% tracing sampling causes performance issues. Use 1-10% for production: `sampling: 1.0` in mesh config.

- **Gateway vs VirtualService Confusion**: Gateway configures ingress (load balancer), VirtualService configures routing. Both required for external traffic.

- **Version Compatibility**: Ensure mesh version compatible with Kubernetes version. Istio supports n-1 minor versions, Linkerd typically supports last 3 Kubernetes versions.

## Related Skills

- `configure-ingress-networking` - Gateway configuration complements mesh ingress
- `deploy-to-kubernetes` - Application deployment patterns that work with service mesh
- `setup-prometheus-monitoring` - Prometheus integration for mesh metrics
- `manage-kubernetes-secrets` - Certificate management for mTLS
- `enforce-policy-as-code` - OPA policies that work alongside mesh authorization
