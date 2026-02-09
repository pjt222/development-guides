---
name: setup-local-kubernetes
description: >
  Set up a local Kubernetes development environment using kind, k3d, or minikube for fast
  inner-loop development. Covers cluster creation, ingress configuration, local registry
  setup, and integration with development tools like Skaffold and Tilt for automatic
  rebuild and redeploy workflows.
license: MIT
allowed-tools: Read Write Edit Bash Grep Glob
metadata:
  author: Philipp Thoss
  version: "1.0"
  domain: devops
  complexity: basic
  language: multi
  tags: kind, k3d, minikube, local-development, skaffold, tilt, docker, kubernetes
---

# Setup Local Kubernetes

Create a local Kubernetes development environment for fast iteration and testing.

## When to Use

- Need local Kubernetes environment for application development
- Want to test Kubernetes manifests and Helm charts before deploying to production
- Require fast inner-loop development with automatic rebuild and redeploy
- Testing multi-service applications with service dependencies
- Learning Kubernetes without cloud costs
- CI/CD pipeline testing locally before pushing changes
- Need isolated environment for experimentation and debugging

## Inputs

- **Required**: Docker Desktop or Docker Engine installed
- **Required**: At least 4GB RAM available for cluster
- **Required**: Choice of local cluster tool (kind, k3d, or minikube)
- **Optional**: Application source code to deploy
- **Optional**: Kubernetes version preference
- **Optional**: Development tool preference (Skaffold, Tilt, or manual)
- **Optional**: Number of worker nodes needed

## Procedure

### Step 1: Install Local Kubernetes Cluster Tool

Choose and install kind, k3d, or minikube based on your requirements.

**Install kind (Kubernetes in Docker):**
```bash
# Linux
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind

# macOS (using Homebrew)
brew install kind

# Windows (using Chocolatey)
choco install kind

# Verify installation
kind version
```

**Install k3d (k3s in Docker):**
```bash
# Linux/macOS
curl -s https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh | bash

# Windows (using Chocolatey)
choco install k3d

# Verify installation
k3d version
```

**Install minikube:**
```bash
# Linux
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# macOS (using Homebrew)
brew install minikube

# Windows (using Chocolatey)
choco install minikube

# Verify installation
minikube version
```

Install kubectl if not already present:
```bash
# Linux
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/

# macOS (using Homebrew)
brew install kubectl

# Windows (using Chocolatey)
choco install kubernetes-cli

# Verify installation
kubectl version --client
```

**Expected:** Tool binary installed and in PATH. Version command returns expected version. kubectl available for cluster interaction.

**On failure:**
- Ensure Docker is running: `docker ps`
- Check system PATH includes installation directory
- For permission issues, verify sudo/admin rights
- On macOS, may need to allow binary in Security & Privacy settings
- Windows users: ensure running terminal as Administrator

### Step 2: Create Local Cluster with Configuration

Create a multi-node cluster with ingress and local registry support.

**Create kind cluster:**
```yaml
# kind-config.yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
name: dev-cluster
nodes:
- role: control-plane
  kubeadmConfigPatches:
  - |
    kind: InitConfiguration
    nodeRegistration:
      kubeletExtraArgs:
        node-labels: "ingress-ready=true"
  extraPortMappings:
  - containerPort: 80
    hostPort: 80
    protocol: TCP
  - containerPort: 443
    hostPort: 443
    protocol: TCP
- role: worker
- role: worker
containerdConfigPatches:
- |-
  [plugins."io.containerd.grpc.v1.cri".registry.mirrors."localhost:5000"]
    endpoint = ["http://kind-registry:5000"]
```

```bash
# Create cluster
kind create cluster --config kind-config.yaml

# Verify cluster
kubectl cluster-info --context kind-dev-cluster
kubectl get nodes

# Install ingress-nginx
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

# Wait for ingress controller
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=90s

# Create local registry
docker run -d --restart=always -p 5000:5000 --name kind-registry registry:2

# Connect registry to kind network
docker network connect kind kind-registry

# Document registry
kubectl apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: local-registry-hosting
  namespace: kube-public
data:
  localRegistryHosting.v1: |
    host: "localhost:5000"
    help: "https://kind.sigs.k8s.io/docs/user/local-registry/"
EOF
```

**Create k3d cluster:**
```bash
# Create cluster with ingress and registry
k3d cluster create dev-cluster \
  --api-port 6550 \
  --port "80:80@loadbalancer" \
  --port "443:443@loadbalancer" \
  --agents 2 \
  --registry-create k3d-registry:5000 \
  --registry-use k3d-registry:5000

# Verify cluster
kubectl cluster-info
kubectl get nodes

# Install ingress-nginx (if not using Traefik that comes with k3d)
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.hostPort.enabled=true
```

**Create minikube cluster:**
```bash
# Create cluster with multiple nodes
minikube start \
  --nodes=3 \
  --cpus=2 \
  --memory=4096 \
  --driver=docker \
  --kubernetes-version=v1.28.0 \
  --addons=ingress,registry,metrics-server

# Verify cluster
kubectl cluster-info
kubectl get nodes

# Access built-in registry
minikube addons enable registry
docker run --rm -it --network=host alpine ash -c "apk add socat && socat TCP-LISTEN:5000,reuseaddr,fork TCP:$(minikube ip):5000"

# Or use minikube docker daemon directly
eval $(minikube docker-env)
```

Test cluster:
```bash
# Deploy test application
kubectl create deployment hello --image=k8s.gcr.io/echoserver:1.4
kubectl expose deployment hello --type=NodePort --port=8080

# Test service
kubectl port-forward service/hello 8080:8080
curl http://localhost:8080

# Clean up test
kubectl delete deployment,service hello
```

**Expected:** Multi-node cluster running with control plane and worker nodes. Ingress controller installed and ready. Local registry accessible at localhost:5000. kubectl context set to new cluster. Test deployment successful.

**On failure:**
- Check Docker has sufficient resources (4GB+ memory recommended)
- Verify no port conflicts: `lsof -i :80,443,5000,6550` (Linux/macOS) or `netstat -ano | findstr "80 443"` (Windows)
- For kind: ensure Docker desktop Kubernetes is disabled (conflicts)
- For k3d: check Docker network connectivity
- For minikube: try different driver (virtualbox, hyperv, kvm2)
- Review cluster creation logs: `kind get clusters`, `k3d cluster list`, `minikube logs`

### Step 3: Configure Development Workflow Tools

Set up Skaffold or Tilt for automated rebuild and redeploy.

**Install Skaffold:**
```bash
# Linux
curl -Lo skaffold https://storage.googleapis.com/skaffold/releases/latest/skaffold-linux-amd64
chmod +x skaffold
sudo mv skaffold /usr/local/bin

# macOS (using Homebrew)
brew install skaffold

# Windows (using Chocolatey)
choco install skaffold

# Verify installation
skaffold version
```

**Create Skaffold configuration:**
```yaml
# skaffold.yaml
apiVersion: skaffold/v4beta7
kind: Config
metadata:
  name: my-app
build:
  local:
    push: false  # Don't push to remote registry
    useBuildkit: true
  artifacts:
  - image: localhost:5000/my-app
    context: .
    docker:
      dockerfile: Dockerfile
    sync:
      manual:
      - src: "src/**/*.js"
        dest: /app/src
      - src: "src/**/*.html"
        dest: /app/src
  - image: localhost:5000/my-worker
    context: ./worker
    docker:
      dockerfile: Dockerfile
deploy:
  kubectl:
    manifests:
    - k8s/deployment.yaml
    - k8s/service.yaml
    - k8s/ingress.yaml
portForward:
- resourceType: service
  resourceName: my-app
  port: 8080
  localPort: 8080
profiles:
- name: dev
  activation:
  - command: dev
  build:
    artifacts:
    - image: localhost:5000/my-app
      sync:
        auto: true
  deploy:
    kubectl:
      flags:
        apply:
        - --force
- name: debug
  activation:
  - command: debug
  build:
    artifacts:
    - image: localhost:5000/my-app
      docker:
        buildArgs:
          DEBUG: "true"
  patches:
  - op: add
    path: /deploy/kubectl/manifests/-
    value: k8s/debug-config.yaml
```

**Install Tilt:**
```bash
# Linux/macOS
curl -fsSL https://raw.githubusercontent.com/tilt-dev/tilt/master/scripts/install.sh | bash

# Windows (using Scoop)
scoop install tilt

# Verify installation
tilt version
```

**Create Tiltfile:**
```python
# Tiltfile
# Allow Tilt to use local Kubernetes
allow_k8s_contexts('kind-dev-cluster')

# Build and deploy main app
docker_build(
  'localhost:5000/my-app',
  '.',
  dockerfile='Dockerfile',
  live_update=[
    sync('./src', '/app/src'),
    run('npm install', trigger='./package.json'),
  ]
)

# Build worker
docker_build(
  'localhost:5000/my-worker',
  './worker',
  dockerfile='Dockerfile'
)

# Deploy manifests
k8s_yaml(['k8s/deployment.yaml', 'k8s/service.yaml', 'k8s/ingress.yaml'])

# Port forward for local access
k8s_resource('my-app', port_forwards='8080:8080')

# Resource dependencies
k8s_resource(
  'my-app',
  resource_deps=['my-database'],
  labels=['frontend']
)

k8s_resource(
  'my-worker',
  labels=['backend']
)

# Local resource for running tests
local_resource(
  'unit-tests',
  'npm test',
  deps=['src'],
  trigger_mode=TRIGGER_MODE_AUTO,
  auto_init=False,
  labels=['tests']
)

# Helm chart deployment
helm_repo('bitnami', 'https://charts.bitnami.com/bitnami')
helm_resource(
  'postgresql',
  'bitnami/postgresql',
  flags=['--set', 'auth.postgresPassword=devpassword'],
  labels=['database']
)

# Add custom button
button = Button(
  name='run-migrations',
  text='Run DB Migrations',
  location='main',
  argv=['kubectl', 'exec', '-it', 'deploy/my-app', '--', 'npm', 'run', 'migrate']
)

# Configure Tilt UI
config.define_string('app-version', args=False, usage='App version to deploy')
cfg = config.parse()
if cfg.get('app-version'):
  k8s_yaml(helm('charts/my-app', set=['image.tag=' + cfg['app-version']]))
```

Create sample Kubernetes manifests:
```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: app
        image: localhost:5000/my-app
        ports:
        - containerPort: 8080
        env:
        - name: NODE_ENV
          value: development
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 256Mi
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
---
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: my-app
spec:
  selector:
    app: my-app
  ports:
  - port: 8080
    targetPort: 8080
---
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  rules:
  - host: my-app.local
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: my-app
            port:
              number: 8080
```

Test development workflow:
```bash
# Using Skaffold
skaffold dev --port-forward

# Or just build and deploy
skaffold run

# Debug mode
skaffold debug

# Using Tilt
tilt up

# Access Tilt UI
open http://localhost:10350

# Add entry to /etc/hosts for ingress
echo "127.0.0.1 my-app.local" | sudo tee -a /etc/hosts

# Test application
curl http://my-app.local
```

**Expected:** Skaffold or Tilt watching for file changes. Code changes trigger automatic rebuild and redeploy. Hot reload working for supported languages. Port forwarding allows local access. Logs streaming in terminal/UI. Build caching makes rebuilds fast.

**On failure:**
- Verify Docker daemon accessible: `docker ps`
- Check if local registry reachable: `curl http://localhost:5000/v2/_catalog`
- For file sync issues, ensure paths in config match actual structure
- Review Skaffold/Tilt logs for build errors
- Ensure Dockerfile has proper base image and builds successfully: `docker build .`
- Check resource limits not causing OOMKills: `kubectl describe pod -l app=my-app`

### Step 4: Set Up Local Storage and Databases

Configure persistent storage and deploy database services for testing.

**Create local storage class:**
```yaml
# local-storage.yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: local-path
provisioner: rancher.io/local-path
volumeBindingMode: WaitForFirstConsumer
reclaimPolicy: Delete
---
# For kind (uses hostPath)
apiVersion: v1
kind: PersistentVolume
metadata:
  name: local-pv-1
spec:
  capacity:
    storage: 10Gi
  accessModes:
  - ReadWriteOnce
  hostPath:
    path: /tmp/local-pv-1
    type: DirectoryOrCreate
  storageClassName: local-path
---
# Sample PVC
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: app-storage
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
  storageClassName: local-path
```

**Deploy PostgreSQL for development:**
```yaml
# postgres-dev.yaml
apiVersion: v1
kind: Secret
metadata:
  name: postgres-secret
type: Opaque
stringData:
  POSTGRES_PASSWORD: devpassword
  POSTGRES_USER: devuser
  POSTGRES_DB: devdb
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        envFrom:
        - secretRef:
            name: postgres-secret
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
        resources:
          requests:
            cpu: 100m
            memory: 256Mi
          limits:
            cpu: 500m
            memory: 512Mi
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      storageClassName: local-path
      resources:
        requests:
          storage: 5Gi
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
  clusterIP: None
```

**Deploy Redis for caching:**
```bash
# Using Helm
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install redis bitnami/redis \
  --set auth.enabled=false \
  --set master.persistence.size=1Gi \
  --set replica.replicaCount=0

# Or using kubectl
kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
        resources:
          requests:
            cpu: 50m
            memory: 64Mi
---
apiVersion: v1
kind: Service
metadata:
  name: redis
spec:
  selector:
    app: redis
  ports:
  - port: 6379
EOF
```

Test database connectivity:
```bash
# Apply manifests
kubectl apply -f local-storage.yaml
kubectl apply -f postgres-dev.yaml

# Wait for PostgreSQL to be ready
kubectl wait --for=condition=ready pod -l app=postgres --timeout=60s

# Test connection
kubectl exec -it postgres-0 -- psql -U devuser -d devdb -c "SELECT version();"

# Port forward for local access
kubectl port-forward svc/postgres 5432:5432 &

# Connect from local machine
psql -h localhost -U devuser -d devdb

# Check Redis
kubectl port-forward svc/redis 6379:6379 &
redis-cli -h localhost ping
```

**Expected:** Storage class configured for dynamic provisioning. Database pods running and ready. Services accessible via port-forward or from other pods. Data persists across pod restarts. Resource usage appropriate for development (small limits).

**On failure:**
- Check if storage provisioner installed: `kubectl get storageclass`
- Verify PVC bound to PV: `kubectl get pvc,pv`
- Review pod events for mounting errors: `kubectl describe pod postgres-0`
- For permission issues, check if hostPath directory exists and is writable
- Test database startup: `kubectl logs postgres-0` for PostgreSQL errors
- Ensure no port conflicts for port-forwarding

### Step 5: Configure Observability for Local Development

Add minimal monitoring and logging for debugging.

**Deploy lightweight monitoring stack:**
```bash
# Install metrics-server (if not present)
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# For local clusters, disable TLS verification
kubectl patch deployment metrics-server -n kube-system --type='json' -p='[
  {
    "op": "add",
    "path": "/spec/template/spec/containers/0/args/-",
    "value": "--kubelet-insecure-tls"
  }
]'

# Verify metrics available
kubectl top nodes
kubectl top pods -A

# Install k9s for terminal UI (optional but recommended)
# Linux/macOS
curl -sS https://webinstall.dev/k9s | bash

# Windows
choco install k9s

# Launch k9s
k9s
```

**Set up local logging:**
```bash
# Simple logging with stern (multi-pod log tailing)
# Linux
curl -Lo stern https://github.com/stern/stern/releases/download/v1.26.0/stern_1.26.0_linux_amd64.tar.gz
tar -xzf stern_1.26.0_linux_amd64.tar.gz
sudo mv stern /usr/local/bin/

# macOS
brew install stern

# Usage
stern my-app --since 1m
stern --all-namespaces -l app=my-app

# Or deploy Loki stack for persistent logs (optional)
helm repo add grafana https://grafana.github.io/helm-charts
helm install loki grafana/loki-stack \
  --set promtail.enabled=true \
  --set loki.persistence.enabled=false \
  --set grafana.enabled=true

# Access Grafana
kubectl port-forward -n default svc/loki-grafana 3000:80
# Default credentials: admin/admin
```

**Create development dashboard:**
```yaml
# dev-dashboard.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: dev-dashboard
data:
  dashboard.sh: |
    #!/bin/bash
    clear
    echo "=== Development Cluster Status ==="
    echo ""
    echo "Nodes:"
    kubectl get nodes
    echo ""
    echo "Pods:"
    kubectl get pods -A
    echo ""
    echo "Services:"
    kubectl get svc -A
    echo ""
    echo "Resource Usage:"
    kubectl top nodes
    kubectl top pods -A
    echo ""
    echo "Recent Events:"
    kubectl get events --sort-by='.lastTimestamp' | tail -10
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: useful-aliases
data:
  aliases.sh: |
    alias k='kubectl'
    alias kg='kubectl get'
    alias kd='kubectl describe'
    alias kl='kubectl logs'
    alias kx='kubectl exec -it'
    alias ka='kubectl apply -f'
    alias kdel='kubectl delete'
    alias kgp='kubectl get pods'
    alias kgs='kubectl get svc'
    alias kctx='kubectl config current-context'
```

**Expected:** Metrics-server providing resource usage data. kubectl top commands working. k9s or dashboard showing cluster status. Logs accessible via stern or kubectl logs. Low overhead monitoring suitable for development.

**On failure:**
- For metrics-server TLS errors, apply insecure TLS flag patch
- Check if metrics-server pod running: `kubectl get pods -n kube-system -l k8s-app=metrics-server`
- Verify heapster API available: `kubectl get apiservices | grep metrics`
- For stern, ensure kubectl context is set correctly
- Test basic kubectl access before debugging observability tools

### Step 6: Document Workflow and Create Helpers

Create scripts and documentation for team onboarding.

**Create setup script:**
```bash
#!/bin/bash
# setup-local-cluster.sh

set -e

echo "=== Local Kubernetes Cluster Setup ==="

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "Docker not found. Install Docker first."; exit 1; }
command -v kubectl >/dev/null 2>&1 || { echo "kubectl not found. Install kubectl first."; exit 1; }

# Choose cluster tool
read -p "Choose cluster tool (kind/k3d/minikube) [kind]: " TOOL
TOOL=${TOOL:-kind}

# Create cluster based on choice
case $TOOL in
  kind)
    kind create cluster --config kind-config.yaml
    kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
    docker run -d --restart=always -p 5000:5000 --name kind-registry registry:2
    docker network connect kind kind-registry
    ;;
  k3d)
    k3d cluster create dev-cluster --port "80:80@loadbalancer" --port "443:443@loadbalancer" --agents 2 --registry-create k3d-registry:5000
    ;;
  minikube)
    minikube start --nodes=3 --cpus=2 --memory=4096 --addons=ingress,registry,metrics-server
    ;;
  *)
    echo "Invalid choice"
    exit 1
    ;;
esac

# Deploy common services
echo "Deploying common services..."
kubectl apply -f local-storage.yaml
kubectl apply -f postgres-dev.yaml

# Wait for services
echo "Waiting for services to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres --timeout=120s

echo "Setup complete!"
echo ""
echo "Cluster: $(kubectl config current-context)"
echo "Nodes: $(kubectl get nodes --no-headers | wc -l)"
echo ""
echo "Next steps:"
echo "  1. Run 'skaffold dev' or 'tilt up' to start development"
echo "  2. Access ingress at http://my-app.local (add to /etc/hosts)"
echo "  3. Use 'k9s' for cluster management"
echo ""
```

**Create teardown script:**
```bash
#!/bin/bash
# teardown-local-cluster.sh

echo "=== Tearing Down Local Cluster ==="

# Detect and delete cluster
if kind get clusters 2>/dev/null | grep -q dev-cluster; then
  kind delete cluster --name dev-cluster
  docker stop kind-registry && docker rm kind-registry
elif k3d cluster list 2>/dev/null | grep -q dev-cluster; then
  k3d cluster delete dev-cluster
elif minikube status >/dev/null 2>&1; then
  minikube delete
fi

# Cleanup
rm -f kubeconfig
docker system prune -f

echo "Cluster deleted. All resources cleaned up."
```

**Create README:**
```markdown
# Local Kubernetes Development

## Quick Start

\`\`\`bash
# Setup cluster
./setup-local-cluster.sh

# Start development
skaffold dev
# OR
tilt up

# Access application
echo "127.0.0.1 my-app.local" | sudo tee -a /etc/hosts
curl http://my-app.local
\`\`\`

## Development Workflow

1. Make code changes in `src/`
2. Skaffold/Tilt automatically rebuilds and redeploys
3. Test changes at http://my-app.local
4. Logs visible in terminal/Tilt UI

## Useful Commands

\`\`\`bash
# View all pods
kubectl get pods -A

# View logs
stern my-app

# Execute into pod
kubectl exec -it deploy/my-app -- /bin/sh

# Port forward to service
kubectl port-forward svc/my-app 8080:8080

# Cluster dashboard
k9s
\`\`\`

## Troubleshooting

### Pods not starting
\`\`\`bash
kubectl describe pod <pod-name>
kubectl logs <pod-name>
\`\`\`

### Ingress not working
\`\`\`bash
# Check ingress controller
kubectl get pods -n ingress-nginx
# Verify ingress resource
kubectl get ingress
\`\`\`

### Clean slate
\`\`\`bash
./teardown-local-cluster.sh
./setup-local-cluster.sh
\`\`\`

## Resources

- [kind Documentation](https://kind.sigs.k8s.io/)
- [k3d Documentation](https://k3d.io/)
- [Skaffold Documentation](https://skaffold.dev/)
- [Tilt Documentation](https://tilt.dev/)
\`\`\`
```

**Expected:** Setup script creates cluster in one command. Teardown script cleans everything up. README provides clear instructions for common tasks. Team members can get productive quickly.

**On failure:**
- Test scripts manually before distributing
- Add error handling for each step
- Provide troubleshooting section in README
- Create video walkthrough for complex setups
- Maintain scripts as cluster tool versions update

## Validation

- [ ] Local cluster created with multiple nodes
- [ ] Ingress controller installed and responding
- [ ] Local registry accessible and accepting pushes
- [ ] Sample application deploys successfully
- [ ] File sync working (changes reflected without full rebuild)
- [ ] Port forwarding allows local access to services
- [ ] Database services running and accessible
- [ ] Metrics server providing resource usage
- [ ] Logs accessible via kubectl/stern/Tilt
- [ ] Setup/teardown scripts work reliably
- [ ] Documentation clear and up-to-date
- [ ] Team members can onboard in <30 minutes

## Common Pitfalls

- **Insufficient Resources**: Local clusters need 4GB+ RAM, 2+ CPU cores. Check Docker Desktop settings. Reduce replicas and resource requests for development.

- **Port Conflicts**: Ports 80, 443, 5000 commonly used. Check with `lsof -i :<port>` before cluster creation. Adjust port mappings if needed.

- **Slow Rebuilds**: Without proper caching, Docker rebuilds are slow. Use multi-stage builds, .dockerignore, and BuildKit. Enable Skaffold/Tilt caching.

- **Context Confusion**: Multiple kubectl contexts cause confusion. Use `kubectl config current-context` and `kubectx` tool to switch clearly.

- **File Sync Not Working**: Path mismatches between host and container break sync. Verify paths in skaffold.yaml/Tiltfile match Dockerfile WORKDIR.

- **Ingress Not Resolving**: Forgot to add entry to /etc/hosts. Or ingress controller not ready. Wait for controller pods before testing.

- **Database Data Loss**: Default storage ephemeral. Use PersistentVolumes for data that should survive restarts. Be explicit about storage class.

- **Resource Limits Too High**: Don't copy production resource specs to local. Reduce limits significantly for local development to fit in Docker Desktop.

- **Network Isolation**: Local cluster can't always reach host services. Use `host.docker.internal` (Docker Desktop) or ngrok for reverse proxying.

- **Version Skew**: Local cluster version differs from production. Explicitly set Kubernetes version during creation to match production.

## Related Skills

- `deploy-to-kubernetes` - Application deployment patterns tested locally first
- `write-helm-chart` - Helm charts tested in local cluster
- `setup-prometheus-monitoring` - Monitoring setup tested locally
- `configure-ingress-networking` - Ingress configuration validated locally
- `implement-gitops-workflow` - GitOps tested with local cluster
- `optimize-cloud-costs` - Cost optimization strategies developed locally
