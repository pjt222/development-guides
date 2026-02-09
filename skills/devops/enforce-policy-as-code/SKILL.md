---
name: enforce-policy-as-code
description: >
  Implement policy-as-code enforcement using OPA Gatekeeper or Kyverno to validate and mutate
  Kubernetes resources according to organizational policies. Covers constraint templates,
  admission control, audit mode, reporting violations, and integrating with CI/CD pipelines
  for shift-left policy validation.
license: MIT
allowed-tools: Read Write Edit Bash Grep Glob
metadata:
  author: Philipp Thoss
  version: "1.0"
  domain: devops
  complexity: intermediate
  language: multi
  tags: opa, gatekeeper, kyverno, policy, admission-control, compliance, kubernetes
---

# Enforce Policy as Code

Implement declarative policy enforcement using OPA Gatekeeper or Kyverno for Kubernetes resource validation and mutation.

## When to Use

- Enforce organizational standards for resource configuration (labels, annotations, limits)
- Prevent security misconfigurations (privileged containers, host namespaces, insecure images)
- Ensure compliance requirements are met before resources deployed
- Standardize resource naming conventions and metadata
- Implement automated remediation through mutation policies
- Audit existing cluster resources against policies without blocking
- Integrate policy validation into CI/CD pipelines for shift-left approach

## Inputs

- **Required**: Kubernetes cluster with admin access
- **Required**: Choice of policy engine (OPA Gatekeeper or Kyverno)
- **Required**: List of policies to enforce (security, compliance, operational)
- **Optional**: Existing resources to audit
- **Optional**: Exemption/exclusion patterns for specific namespaces or resources
- **Optional**: CI/CD pipeline configuration for pre-deployment validation

## Procedure

### Step 1: Install Policy Engine

Deploy OPA Gatekeeper or Kyverno as admission controller.

**For OPA Gatekeeper:**
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

**For Kyverno:**
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

Create namespace exclusions:
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

**Expected:** Policy engine pods running with multiple replicas. CRDs installed (ConstraintTemplate, Constraint for Gatekeeper; ClusterPolicy, Policy for Kyverno). Validating/mutating webhooks active. Audit controller running.

**On failure:**
- Check pod logs: `kubectl logs -n gatekeeper-system -l app=gatekeeper --tail=50`
- Verify webhook endpoints reachable: `kubectl get endpoints -n gatekeeper-system`
- Check for port conflicts or certificate issues in webhook logs
- Ensure cluster has sufficient resources (policy engines need ~500MB per replica)
- Review RBAC permissions: `kubectl auth can-i create constrainttemplates --as=system:serviceaccount:gatekeeper-system:gatekeeper-admin`

### Step 2: Define Constraint Templates and Policies

Create reusable policy templates and specific constraints.

**OPA Gatekeeper Constraint Template:**
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

**Kyverno ClusterPolicy:**
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

Apply policies:
```bash
# Apply Gatekeeper templates and constraints
kubectl apply -f required-labels-template.yaml

# Apply Kyverno policies
kubectl apply -f kyverno-policies.yaml

# Verify constraint/policy status
kubectl get constraints
kubectl get clusterpolicies

# Check for any policy errors
kubectl describe k8srequiredlabels require-app-labels
kubectl describe clusterpolicy require-labels
```

**Expected:** ConstraintTemplates/ClusterPolicies created successfully. Constraints show status "True" for enforcement. No errors in policy definitions. Webhook begins evaluating new resources against policies.

**On failure:**
- Validate Rego syntax (Gatekeeper): Use `opa test` locally or check constraint status
- Check policy YAML syntax: `kubectl apply --dry-run=client -f policy.yaml`
- Review constraint status: `kubectl get constraint -o yaml | grep -A 10 status`
- Test with simple policy first, then add complexity
- Verify match criteria (kinds, namespaces) are correct

### Step 3: Test Policy Enforcement

Validate policies block non-compliant resources and allow compliant ones.

Create test manifests:
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

Test policies:
```bash
# Attempt to create non-compliant resource (should fail)
kubectl apply -f test-non-compliant.yaml
# Expected: Error with policy violation message

# Create compliant resource (should succeed)
kubectl apply -f test-compliant.yaml
# Expected: deployment.apps/test-compliant created

# Test with dry-run for validation
kubectl apply -f test-non-compliant.yaml --dry-run=server
# Shows policy violations without actually creating resource

# Clean up
kubectl delete -f test-compliant.yaml
```

Test with policy reporting (Kyverno):
```bash
# Check policy reports
kubectl get policyreports -A
kubectl get clusterpolicyreports

# View detailed report
kubectl get policyreport -n production -o yaml

# Check policy rule results
kubectl get policyreport -n production -o jsonpath='{.items[0].results}' | jq .
```

**Expected:** Non-compliant resources rejected with clear violation messages. Compliant resources created successfully. Policy reports show pass/fail results. Dry-run validation works without creating resources.

**On failure:**
- Check if policy is in audit mode instead of enforce: `validationFailureAction: audit`
- Verify webhook is processing requests: `kubectl logs -n gatekeeper-system -l app=gatekeeper`
- Check for namespace exclusions that might exempt test namespace
- Test webhook connectivity: `kubectl run test --rm -it --image=busybox --restart=Never`
- Review webhook failure policy (Ignore vs Fail)

### Step 4: Implement Mutation Policies

Configure automatic remediation through mutation.

**Gatekeeper mutation:**
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

**Kyverno mutation policies:**
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

Apply and test mutations:
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

**Expected:** Mutations automatically add labels, resources, or modify images. Deployed resources show mutated values. Mutations logged in policy engine logs. No errors during mutation application.

**On failure:**
- Check mutation webhook is enabled: `kubectl get mutatingwebhookconfiguration`
- Verify mutation policy syntax: especially JSON paths and conditions
- Review logs: `kubectl logs -n kyverno deploy/kyverno-admission-controller`
- Test mutations don't conflict (multiple mutations on same field)
- Ensure mutation applied before validation (order matters)

### Step 5: Enable Audit Mode and Reporting

Configure audit to identify violations in existing resources without blocking.

**Gatekeeper audit:**
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

**Kyverno audit and reporting:**
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

Create dashboard for policy compliance:
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

**Expected:** Audit identifies violations in existing resources without blocking deployments. Policy reports generated with pass/fail counts. Violations exportable for review. Metrics exposed for monitoring. Alerts fire on increasing violations.

**On failure:**
- Verify audit controller running: `kubectl get pods -n gatekeeper-system -l gatekeeper.sh/operation=audit`
- Check audit interval setting in installation
- Review audit logs for errors: `kubectl logs -n gatekeeper-system -l gatekeeper.sh/operation=audit`
- Ensure RBAC permissions allow reading all resource types for audit
- Verify CRD status field being populated: `kubectl get constraint -o yaml | grep -A 20 status`

### Step 6: Integrate with CI/CD Pipeline

Add pre-deployment policy validation to shift-left policy enforcement.

**CI/CD integration script:**
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

**GitHub Actions workflow:**
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

**Pre-commit hook:**
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

**Expected:** CI/CD pipeline validates manifests before deployment. Policy violations fail pipeline with clear messages. Policy reports attached to PR. Pre-commit hooks catch violations early. Developers notified of policy issues before reaching cluster.

**On failure:**
- Verify CLI tools installed and in PATH
- Check kubeconfig credentials valid for fetching policies
- Test policy validation locally first: `kyverno apply policy.yaml --resource manifest.yaml`
- Ensure policies synced from cluster are complete
- Review policy CLI logs for specific validation errors

## Validation

- [ ] Policy engine pods running with HA configuration
- [ ] Validating and mutating webhooks active and reachable
- [ ] Constraint templates and policies created without errors
- [ ] Non-compliant resources rejected with clear violation messages
- [ ] Compliant resources deploy successfully
- [ ] Mutation policies automatically remediate resources
- [ ] Audit mode identifies violations in existing resources
- [ ] Policy reports generated and accessible
- [ ] Metrics exposed for policy compliance monitoring
- [ ] CI/CD pipeline validates manifests pre-deployment
- [ ] Pre-commit hooks prevent policy violations
- [ ] Namespace exclusions configured appropriately

## Common Pitfalls

- **Webhook Failure Policy**: `failurePolicy: Fail` blocks all resources if webhook unavailable. Use `Ignore` for non-critical policies, but understand security implications. Test webhook availability before enforcing.

- **Too Restrictive Initial Policies**: Starting with enforcement mode on strict policies breaks existing workloads. Begin with audit mode, review violations, communicate with teams, then enforce gradually.

- **Missing Resource Specifications**: Policies must specify API groups, versions, and kinds correctly. Use `kubectl api-resources` to find exact values. Wildcards (`*`) convenient but can cause performance issues.

- **Mutation Order**: Mutations applied before validations. Ensure mutations don't conflict and that validations account for mutated values. Test mutation+validation together.

- **Namespace Exclusions**: Excluding system namespaces necessary, but be careful not to over-exclude. Review exclusions regularly as policies mature.

- **Rego Complexity (Gatekeeper)**: Complex Rego policies difficult to debug. Start simple, test with `opa test` locally, add logging with `trace()`, use gator for offline testing.

- **Performance Impact**: Policy evaluation adds latency to admission. Keep policies efficient, use appropriate matching criteria, monitor webhook latency metrics.

- **Policy Conflicts**: Multiple policies modifying same field cause issues. Coordinate policies across teams, use policy libraries for common patterns, test combinations.

- **Background Scanning**: Background audit scans entire cluster. Can be resource-intensive in large clusters. Adjust audit interval based on cluster size and policy count.

- **Version Compatibility**: Policy CRD versions change. Gatekeeper v3 uses `v1beta1` constraints, Kyverno v1.11 uses `kyverno.io/v1`. Check docs for your version.

## Related Skills

- `manage-kubernetes-secrets` - Secret validation policies
- `security-audit-codebase` - Complementary security scanning
- `deploy-to-kubernetes` - Application deployment with policy validation
- `setup-service-mesh` - Service mesh authorization policies complement admission policies
- `configure-api-gateway` - Gateway policies work alongside admission policies
- `implement-gitops-workflow` - GitOps with policy validation in pipeline
