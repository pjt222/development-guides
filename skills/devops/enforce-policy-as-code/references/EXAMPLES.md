# Enforce Policy as Code — Extended Examples

Complete configuration files and code templates.


## Step 1: Install Policy Engine

```bash
# Install Gatekeeper using Helm
helm repo add gatekeeper https://open-policy-agent.github.io/gatekeeper/charts
helm repo update

# Install with audit enabled
helm install gatekeeper gatekeeper/gatekeeper \
  --namespace gatekeeper-system \
  --create-namespace \
  --set audit.replicas=2 \
  --set replicas=3 \
  --set validatingWebhookFailurePolicy=Fail \
  --set auditInterval=60

# Verify installation
kubectl get pods -n gatekeeper-system
kubectl get crd | grep gatekeeper

# Check webhook configuration
kubectl get validatingwebhookconfigurations gatekeeper-validating-webhook-configuration -o yaml
```

```bash
# Install Kyverno using Helm
helm repo add kyverno https://kyverno.github.io/kyverno/
helm repo update

# Install with HA setup
helm install kyverno kyverno/kyverno \
  --namespace kyverno \
  --create-namespace \
  --set replicaCount=3 \
  --set admissionController.replicas=3 \
  --set backgroundController.replicas=2 \
  --set cleanupController.replicas=2

# Verify installation
kubectl get pods -n kyverno
kubectl get crd | grep kyverno

# Check webhook configurations
kubectl get validatingwebhookconfigurations kyverno-resource-validating-webhook-cfg
kubectl get mutatingwebhookconfigurations kyverno-resource-mutating-webhook-cfg
```

```yaml
# gatekeeper-config.yaml
apiVersion: config.gatekeeper.sh/v1alpha1
kind: Config
metadata:
  name: config
  namespace: gatekeeper-system
spec:
  match:
    - excludedNamespaces:
      - kube-system
      - kube-public
      - kube-node-lease
      - gatekeeper-system
      processes:
      - audit
      - webhook
  validation:
    traces:
      - user: system:serviceaccount:gatekeeper-system:gatekeeper-admin
        kind:
          group: ""
          version: v1
          kind: Namespace
```


## Step 2: Define Constraint Templates and Policies

```yaml
# required-labels-template.yaml
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: k8srequiredlabels
  annotations:
    description: Requires specified labels to be present on resources
spec:
  crd:
    spec:
      names:
        kind: K8sRequiredLabels
      validation:
        openAPIV3Schema:
          type: object
          properties:
            labels:
              type: array
              items:
                type: string
              description: List of required label keys
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8srequiredlabels

        violation[{"msg": msg, "details": {"missing_labels": missing}}] {
          provided := {label | input.review.object.metadata.labels[label]}
          required := {label | label := input.parameters.labels[_]}
          missing := required - provided
          count(missing) > 0
          msg := sprintf("Resource is missing required labels: %v", [missing])
        }
---
# Apply constraint using the template
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sRequiredLabels
metadata:
  name: require-app-labels
spec:
  match:
    kinds:
      - apiGroups: ["apps"]
        kinds: ["Deployment", "StatefulSet", "DaemonSet"]
      - apiGroups: [""]
        kinds: ["Service"]
    namespaces:
      - production
      - staging
  parameters:
    labels:
      - app
      - environment
      - owner
      - cost-center
---
# Container resource limits template
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: k8scontainerrequirements
spec:
  crd:
    spec:
      names:
        kind: K8sContainerRequirements
      validation:
        openAPIV3Schema:
          type: object
          properties:
            cpu:
              type: string
            memory:
              type: string
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8scontainerrequirements

        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          not container.resources.limits.cpu
          msg := sprintf("Container %v must specify CPU limits", [container.name])
        }

        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          not container.resources.limits.memory
          msg := sprintf("Container %v must specify memory limits", [container.name])
        }

        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          not container.resources.requests.cpu
          msg := sprintf("Container %v must specify CPU requests", [container.name])
        }

        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          not container.resources.requests.memory
          msg := sprintf("Container %v must specify memory requests", [container.name])
        }
---
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sContainerRequirements
metadata:
  name: require-container-resources
spec:
  match:
    kinds:
      - apiGroups: ["apps"]
        kinds: ["Deployment", "StatefulSet"]
  parameters:
    cpu: "100m"
    memory: "128Mi"
```

```yaml
# kyverno-policies.yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-labels
  annotations:
    policies.kyverno.io/title: Require Labels
    policies.kyverno.io/category: Best Practices
    policies.kyverno.io/severity: medium
    policies.kyverno.io/description: >-
      Requires specific labels on workload resources.
spec:
  validationFailureAction: enforce
  background: true
  rules:
  - name: check-required-labels
    match:
      any:
      - resources:
          kinds:
          - Deployment
          - StatefulSet
          - DaemonSet
          - Service
          namespaces:
          - production
          - staging
    validate:
      message: "Resources must have labels: app, environment, owner"
      pattern:
        metadata:
          labels:
            app: "?*"
            environment: "?*"
            owner: "?*"
---
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-resource-limits
spec:
  validationFailureAction: enforce
  background: true
  rules:
  - name: require-requests-and-limits
    match:
      any:
      - resources:
          kinds:
          - Deployment
          - StatefulSet
    validate:
      message: "Containers must specify resource requests and limits"
      pattern:
        spec:
          containers:
          - resources:
              requests:
                memory: "?*"
                cpu: "?*"
              limits:
                memory: "?*"
                cpu: "?*"
---
# Security policy - no privileged containers
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: disallow-privileged-containers
spec:
  validationFailureAction: enforce
  background: true
  rules:
  - name: check-privileged
    match:
      any:
      - resources:
          kinds:
          - Pod
          - Deployment
          - StatefulSet
          - DaemonSet
    validate:
      message: "Privileged containers are not allowed"
      pattern:
        spec:
          containers:
          - =(securityContext):
              =(privileged): false
```


## Step 3: Test Policy Enforcement

```yaml
# test-non-compliant.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: test-no-labels
  namespace: production
spec:
  replicas: 1
  selector:
    matchLabels:
      app: test
  template:
    metadata:
      labels:
        app: test
    spec:
      containers:
      - name: nginx
        image: nginx:latest
        # Missing resource limits
---
# test-compliant.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: test-compliant
  namespace: production
  labels:
    app: test-app
    environment: production
    owner: platform-team
    cost-center: engineering
spec:
  replicas: 1
  selector:
    matchLabels:
      app: test-app
  template:
    metadata:
      labels:
        app: test-app
    spec:
      containers:
      - name: nginx
        image: nginx:1.21
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 256Mi
```


## Step 4: Implement Mutation Policies

```yaml
# gatekeeper-mutations.yaml
apiVersion: mutations.gatekeeper.sh/v1beta1
kind: Assign
metadata:
  name: add-default-labels
spec:
  applyTo:
  - groups: ["apps"]
    kinds: ["Deployment", "StatefulSet"]
    versions: ["v1"]
  match:
    scope: Namespaced
    namespaces:
    - production
    - staging
  location: "metadata.labels.managed-by"
  parameters:
    assign:
      value: "gatekeeper"
---
apiVersion: mutations.gatekeeper.sh/v1beta1
kind: AssignMetadata
metadata:
  name: add-namespace-label
spec:
  match:
    scope: Namespaced
    kinds:
    - apiGroups: ["*"]
      kinds: ["*"]
  location: "metadata.labels.namespace"
  parameters:
    assign:
      value: "{{ .metadata.namespace }}"
---
# Modify container images to use specific registry
apiVersion: mutations.gatekeeper.sh/v1alpha1
kind: ModifySet
metadata:
  name: set-image-registry
spec:
  applyTo:
  - groups: ["apps"]
    kinds: ["Deployment"]
    versions: ["v1"]
  match:
    scope: Namespaced
  location: "spec.template.spec.containers[name: *].image"
  parameters:
    operation: merge
    values:
      fromList:
      - "registry.internal.example.com/IMAGE"
    pathTests:
    - subPath: "spec.template.spec.containers[name: *].image"
      condition: MustNotMatch
      pattern: "^registry\\.internal\\.example\\.com/.*"
```

```yaml
# kyverno-mutations.yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: add-default-labels
spec:
  background: false
  rules:
  - name: add-labels
    match:
      any:
      - resources:
          kinds:
          - Deployment
          - StatefulSet
    mutate:
      patchStrategicMerge:
        metadata:
          labels:
            +(managed-by): kyverno
            +(modified-date): "{{ time_now_utc() }}"
---
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: add-default-resources
spec:
  background: false
  rules:
  - name: add-default-requests-limits
    match:
      any:
      - resources:
          kinds:
          - Deployment
    mutate:
      foreach:
      - list: "request.object.spec.template.spec.containers[]"
        patchStrategicMerge:
          spec:
            template:
              spec:
                containers:
                - name: "{{ element.name }}"
                  resources:
                    requests:
                      +(memory): "128Mi"
                      +(cpu): "100m"
                    limits:
                      +(memory): "256Mi"
                      +(cpu): "500m"
---
# Image verification and mutation
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: prepend-image-registry
spec:
  background: false
  rules:
  - name: prepend-registry
    match:
      any:
      - resources:
          kinds:
          - Pod
          - Deployment
    preconditions:
      all:
      - key: "{{ request.object.spec.template.spec.containers[0].image }}"
        operator: NotIn
        value: ["registry.internal.example.com/*"]
    mutate:
      foreach:
      - list: "request.object.spec.template.spec.containers"
        patchStrategicMerge:
          spec:
            template:
              spec:
                containers:
                - name: "{{ element.name }}"
                  image: "registry.internal.example.com/{{ element.image }}"
```

```bash
# Apply mutation policies
kubectl apply -f gatekeeper-mutations.yaml
# OR
kubectl apply -f kyverno-mutations.yaml

# Test mutation with a deployment
cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: test-mutation
  namespace: production
spec:
  replicas: 1
  selector:
    matchLabels:
      app: test
  template:
    metadata:
      labels:
        app: test
    spec:
      containers:
      - name: nginx
        image: nginx:latest
EOF

# Verify mutations were applied
kubectl get deployment test-mutation -n production -o yaml | grep -A 5 labels
kubectl get deployment test-mutation -n production -o yaml | grep -A 10 resources

# Clean up
kubectl delete deployment test-mutation -n production
```


## Step 5: Enable Audit Mode and Reporting

```bash
# Audit runs automatically based on auditInterval setting
# Check audit results
kubectl get constraints -o json | \
  jq '.items[] | {name: .metadata.name, violations: .status.totalViolations}'

# Get detailed violation information
kubectl get k8srequiredlabels require-app-labels -o yaml

# View violations by resource
kubectl get k8srequiredlabels require-app-labels -o jsonpath='{.status.violations}' | jq .

# Export violations to file for review
kubectl get constraints -o json | \
  jq '.items[] | {
    name: .metadata.name,
    violations: .status.violations
  }' > policy-violations.json
```

```bash
# Generate policy reports for existing resources
kubectl create job --from=cronjob/kyverno-cleanup-controller -n kyverno manual-report-gen

# View policy reports
kubectl get policyreport -A
kubectl get clusterpolicyreport

# Detailed report for specific namespace
kubectl get policyreport -n production -o yaml

# Summary of violations
kubectl get policyreport -n production -o json | \
  jq '.items[] | {
    name: .metadata.name,
    pass: .summary.pass,
    fail: .summary.fail,
    warn: .summary.warn,
    error: .summary.error
  }'

# Get violations by policy
kubectl get clusterpolicyreport -o json | \
  jq '.items[].results[] | select(.result=="fail") | {
    policy: .policy,
    resource: .resource,
    message: .message
  }'
```

```yaml
# prometheus-rules.yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: policy-alerts
  namespace: monitoring
spec:
  groups:
  - name: policy-compliance
    interval: 60s
    rules:
    - alert: PolicyViolationsIncreasing
      expr: increase(gatekeeper_violations[1h]) > 10
      for: 5m
      annotations:
        summary: "Policy violations increasing"
        description: "{{ $value }} new violations in the last hour"

    - alert: HighPolicyViolationRate
      expr: sum(gatekeeper_violations) > 50
      for: 10m
      annotations:
        summary: "High number of policy violations"
        description: "{{ $value }} total violations detected"
---
# Grafana dashboard ConfigMap
apiVersion: v1
kind: ConfigMap
metadata:
  name: policy-dashboard
  namespace: monitoring
  labels:
    grafana_dashboard: "1"
data:
  policy-compliance.json: |
    {
      "title": "Policy Compliance",
      "panels": [
        {
          "title": "Total Violations",
          "targets": [{
            "expr": "sum(gatekeeper_violations)"
          }]
        },
        {
          "title": "Violations by Constraint",
          "targets": [{
            "expr": "sum(gatekeeper_violations) by (constraint_name)"
          }]
        }
      ]
    }
```


## Step 6: Integrate with CI/CD Pipeline

```bash
#!/bin/bash
# validate-policies.sh

set -e

echo "=== Policy Validation for CI/CD ==="

# Install policy CLI tools
echo "Installing validation tools..."
# For Gatekeeper
curl -L https://github.com/open-policy-agent/gatekeeper/releases/download/v3.14.0/gator-v3.14.0-linux-amd64.tar.gz | tar xz
sudo mv gator /usr/local/bin/

# For Kyverno
curl -L https://github.com/kyverno/kyverno/releases/download/v1.11.0/kyverno-cli_v1.11.0_linux_x86_64.tar.gz | tar xz
sudo mv kyverno /usr/local/bin/

# Fetch policies from cluster
echo "Fetching policies from cluster..."
kubectl get constrainttemplates -o yaml > templates.yaml
kubectl get constraints -o yaml > constraints.yaml
kubectl get clusterpolicies -o yaml > policies.yaml

# Validate manifests against policies
echo "Validating Kubernetes manifests..."

# Using Gatekeeper gator
gator test -f constraints.yaml -t templates.yaml manifests/

# Using Kyverno CLI
kyverno apply policies.yaml --resource manifests/ --policy-report

# Check exit codes
if [ $? -eq 0 ]; then
  echo "✓ All policy validations passed"
  exit 0
else
  echo "✗ Policy violations detected"
  exit 1
fi
```

```yaml
# .github/workflows/policy-validation.yaml
name: Policy Validation

on:
  pull_request:
    paths:
    - 'manifests/**'
    - 'charts/**'

jobs:
  validate-policies:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Setup kubectl
      uses: azure/setup-kubectl@v3
      with:
        version: 'v1.28.0'

    - name: Configure kubeconfig
      run: |
        mkdir -p $HOME/.kube
        echo "${{ secrets.KUBECONFIG }}" | base64 -d > $HOME/.kube/config

    - name: Install Kyverno CLI
      run: |
        curl -L https://github.com/kyverno/kyverno/releases/download/v1.11.0/kyverno-cli_v1.11.0_linux_x86_64.tar.gz | tar xz
        sudo mv kyverno /usr/local/bin/

    - name: Fetch cluster policies
      run: |
        kubectl get clusterpolicies -o yaml > cluster-policies.yaml

    - name: Validate manifests
      run: |
        kyverno apply cluster-policies.yaml \
          --resource manifests/ \
          --policy-report \
          --detailed-results

    - name: Generate policy report
      if: always()
      run: |
        kyverno apply cluster-policies.yaml \
          --resource manifests/ \
          --policy-report \
          --output json > policy-report.json

    - name: Upload policy report
      if: always()
      uses: actions/upload-artifact@v3
      with:
        name: policy-report
        path: policy-report.json

    - name: Comment PR with results
      if: failure()
      uses: actions/github-script@v6
      with:
        script: |
          const fs = require('fs');
          const report = JSON.parse(fs.readFileSync('policy-report.json'));
          const comment = `### Policy Validation Failed\n\n${JSON.stringify(report, null, 2)}`;
          github.rest.issues.createComment({
            issue_number: context.issue.number,
            owner: context.repo.owner,
            repo: context.repo.repo,
            body: comment
          });
```

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Validate Kubernetes manifests against policies
if git diff --cached --name-only | grep -E 'manifests/.*\.yaml$'; then
  echo "Validating Kubernetes manifests against policies..."

  # Export manifests from staging
  git diff --cached --name-only | grep -E 'manifests/.*\.yaml$' | \
    xargs -I {} git show :{} > /tmp/manifests.yaml

  # Validate with Kyverno
  kyverno apply policies.yaml --resource /tmp/manifests.yaml

  if [ $? -ne 0 ]; then
    echo "Policy validation failed. Commit aborted."
    exit 1
  fi
fi
```

