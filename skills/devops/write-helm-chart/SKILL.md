---
name: write-helm-chart
description: >
  Create production-ready Helm charts for Kubernetes application deployment with templating,
  values management, chart dependencies, hooks, and testing. Covers chart structure, Go
  template syntax, values.yaml design, chart repositories, versioning, and best practices
  for maintainable and reusable charts.
license: MIT
allowed-tools: Read Write Edit Bash Grep Glob
metadata:
  author: Philipp Thoss
  version: "1.0"
  domain: devops
  complexity: intermediate
  language: multi
  tags: helm, chart, go-templates, kubernetes, packaging, deployment, templating
---

# Write Helm Chart

Create production-ready Helm charts for deploying applications to Kubernetes.

## When to Use

- Need to package Kubernetes application for repeatable deployments
- Want to parameterize manifests for different environments (dev/staging/prod)
- Managing complex multi-component applications with dependencies
- Sharing reusable deployment patterns across teams or organizations
- Implementing versioned application releases with rollback capability
- Need template-based configuration management for Kubernetes resources
- Want to standardize deployment practices across projects

## Inputs

- **Required**: Kubernetes manifests for your application (deployment, service, etc.)
- **Required**: Application name and version
- **Required**: List of configurable parameters (image tag, replicas, resources, etc.)
- **Optional**: Dependencies on other Helm charts (databases, message queues)
- **Optional**: Pre/post-install hooks for migrations or setup
- **Optional**: Chart repository URL for publishing
- **Optional**: Values for different environments

## Procedure

### Step 1: Initialize Chart Structure and Metadata

Create the Helm chart directory structure and define chart metadata.

**Install Helm:**
```bash
# Linux
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# macOS
brew install helm

# Windows (Chocolatey)
choco install kubernetes-helm

# Verify installation
helm version
```

**Create chart structure:**
```bash
# Create new chart
helm create my-app

# Chart structure created:
# my-app/
#   Chart.yaml          # Chart metadata
#   values.yaml         # Default configuration values
#   charts/             # Chart dependencies
#   templates/          # Template files
#     deployment.yaml
#     service.yaml
#     ingress.yaml
#     _helpers.tpl      # Template helpers
#     NOTES.txt         # Post-install notes
#   .helmignore         # Files to ignore

# Or create from scratch
mkdir -p my-app/{templates,charts}
cd my-app
```

**Define Chart.yaml:**
```yaml
# Chart.yaml
apiVersion: v2
name: my-app
description: A Helm chart for deploying my-app to Kubernetes
type: application
version: 0.1.0  # Chart version (SemVer)
appVersion: "1.0.0"  # Application version

# Maintainers
maintainers:
- name: Platform Team
  email: platform@example.com
  url: https://github.com/example/my-app

# Keywords for searching
keywords:
- web
- api
- microservice

# Links
home: https://github.com/example/my-app
sources:
- https://github.com/example/my-app
icon: https://example.com/icon.png

# Annotations for additional metadata
annotations:
  category: Application
  licenses: MIT

# Dependencies
dependencies:
- name: postgresql
  version: "12.x.x"
  repository: https://charts.bitnami.com/bitnami
  condition: postgresql.enabled
  tags:
  - database
- name: redis
  version: "17.x.x"
  repository: https://charts.bitnami.com/bitnami
  condition: redis.enabled
  tags:
  - cache

# Kubernetes version constraint
kubeVersion: ">=1.24.0-0"
```

**Create .helmignore:**
```
# .helmignore
# Patterns to ignore when packaging chart
.git/
.gitignore
.bzr/
.bzrignore
.hg/
.hgignore
.svn/
*.swp
*.bak
*.tmp
*.orig
*~
.DS_Store
.project
.idea/
*.tmproj
.vscode/
```

**Expected:** Chart directory structure created with all required files. Chart.yaml contains complete metadata. Dependencies listed if applicable. Chart validates: `helm lint my-app`.

**On failure:**
- Check YAML syntax in Chart.yaml: `helm lint my-app`
- Verify apiVersion is v2 (v1 deprecated)
- Ensure version follows SemVer (x.y.z)
- Check dependency repository URLs are reachable
- Use `helm show chart <chart>` to inspect existing charts for examples

### Step 2: Design values.yaml Structure

Create well-organized values.yaml with sensible defaults and documentation.

**Create comprehensive values.yaml:**
```yaml
# values.yaml
# Default values for my-app.
# This is a YAML-formatted file.
# Declare variables to be passed into your templates.

## Global values (shared across all charts)
global:
  imageRegistry: ""
  imagePullSecrets: []
  storageClass: ""

## Image configuration
image:
  registry: docker.io
  repository: mycompany/my-app
  tag: ""  # Defaults to appVersion from Chart.yaml
  pullPolicy: IfNotPresent
  pullSecrets: []

## Deployment configuration
replicaCount: 3

strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1
    maxUnavailable: 0

## Pod configuration
podAnnotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "8080"

podLabels: {}

podSecurityContext:
  runAsNonRoot: true
  runAsUser: 1000
  fsGroup: 1000
  seccompProfile:
    type: RuntimeDefault

securityContext:
  allowPrivilegeEscalation: false
  capabilities:
    drop:
    - ALL
  readOnlyRootFilesystem: true

## Service configuration
service:
  type: ClusterIP
  port: 80
  targetPort: 8080
  annotations: {}
  sessionAffinity: None

## Ingress configuration
ingress:
  enabled: false
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
  - host: my-app.example.com
    paths:
    - path: /
      pathType: Prefix
  tls:
  - secretName: my-app-tls
    hosts:
    - my-app.example.com

## Resource requests and limits
resources:
  limits:
    cpu: 1000m
    memory: 512Mi
  requests:
    cpu: 100m
    memory: 128Mi

## Autoscaling configuration
autoscaling:
  enabled: false
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80

## Health checks
livenessProbe:
  httpGet:
    path: /health
    port: http
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /ready
    port: http
  initialDelaySeconds: 5
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3

## Environment variables
env:
  - name: LOG_LEVEL
    value: info
  - name: PORT
    value: "8080"

## Environment variables from ConfigMap/Secret
envFrom: []
# - configMapRef:
#     name: my-app-config
# - secretRef:
#     name: my-app-secret

## ConfigMap data
configMap:
  enabled: true
  data:
    app.conf: |
      server {
        listen 8080;
      }

## Persistent volume
persistence:
  enabled: false
  storageClass: ""
  accessMode: ReadWriteOnce
  size: 8Gi
  annotations: {}

## Service account
serviceAccount:
  create: true
  annotations: {}
  name: ""

## RBAC
rbac:
  create: true
  rules: []

## Node selection
nodeSelector: {}

tolerations: []

affinity: {}

## Pod Disruption Budget
podDisruptionBudget:
  enabled: false
  minAvailable: 1
  # maxUnavailable: 1

## Network Policy
networkPolicy:
  enabled: false
  policyTypes:
  - Ingress
  - Egress
  ingress: []
  egress: []

## Monitoring
serviceMonitor:
  enabled: false
  interval: 30s
  scrapeTimeout: 10s

## Dependencies
postgresql:
  enabled: true
  auth:
    username: myapp
    password: changeme
    database: myappdb
  primary:
    persistence:
      size: 8Gi

redis:
  enabled: false
  auth:
    enabled: false
  master:
    persistence:
      size: 1Gi
```

**Create values schema for validation:**
```json
# values.schema.json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["image", "service"],
  "properties": {
    "image": {
      "type": "object",
      "required": ["repository"],
      "properties": {
        "repository": {
          "type": "string"
        },
        "tag": {
          "type": "string"
        },
        "pullPolicy": {
          "type": "string",
          "enum": ["Always", "IfNotPresent", "Never"]
        }
      }
    },
    "replicaCount": {
      "type": "integer",
      "minimum": 1
    },
    "service": {
      "type": "object",
      "required": ["port"],
      "properties": {
        "type": {
          "type": "string",
          "enum": ["ClusterIP", "NodePort", "LoadBalancer"]
        },
        "port": {
          "type": "integer",
          "minimum": 1,
          "maximum": 65535
        }
      }
    }
  }
}
```

**Expected:** values.yaml organized logically with sections. All values documented with comments. Sensible defaults that work out-of-box. Schema validates value types. No hardcoded environment-specific values.

**On failure:**
- Validate YAML syntax: `yamllint values.yaml`
- Check schema validation: `helm lint my-app`
- Review against Helm best practices: `helm lint --strict my-app`
- Ensure all template references have corresponding values
- Test with minimal values: `helm template my-app --set image.repository=test`

### Step 3: Create Template Files with Go Templating

Write Kubernetes resource templates using Go template syntax and Helm functions.

**Create deployment template:**
```yaml
# templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "my-app.fullname" . }}
  labels:
    {{- include "my-app.labels" . | nindent 4 }}
spec:
  {{- if not .Values.autoscaling.enabled }}
  replicas: {{ .Values.replicaCount }}
  {{- end }}
  strategy:
    {{- toYaml .Values.strategy | nindent 4 }}
  selector:
    matchLabels:
      {{- include "my-app.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      annotations:
        checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}
        {{- with .Values.podAnnotations }}
        {{- toYaml . | nindent 8 }}
        {{- end }}
      labels:
        {{- include "my-app.selectorLabels" . | nindent 8 }}
        {{- with .Values.podLabels }}
        {{- toYaml . | nindent 8 }}
        {{- end }}
    spec:
      {{- with .Values.imagePullSecrets }}
      imagePullSecrets:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      serviceAccountName: {{ include "my-app.serviceAccountName" . }}
      securityContext:
        {{- toYaml .Values.podSecurityContext | nindent 8 }}
      containers:
      - name: {{ .Chart.Name }}
        securityContext:
          {{- toYaml .Values.securityContext | nindent 12 }}
        image: "{{ .Values.image.registry }}/{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"
        imagePullPolicy: {{ .Values.image.pullPolicy }}
        ports:
        - name: http
          containerPort: {{ .Values.service.targetPort }}
          protocol: TCP
        {{- with .Values.livenessProbe }}
        livenessProbe:
          {{- toYaml . | nindent 12 }}
        {{- end }}
        {{- with .Values.readinessProbe }}
        readinessProbe:
          {{- toYaml . | nindent 12 }}
        {{- end }}
        resources:
          {{- toYaml .Values.resources | nindent 12 }}
        {{- with .Values.env }}
        env:
          {{- toYaml . | nindent 12 }}
        {{- end }}
        {{- with .Values.envFrom }}
        envFrom:
          {{- toYaml . | nindent 12 }}
        {{- end }}
        {{- if .Values.persistence.enabled }}
        volumeMounts:
        - name: data
          mountPath: /data
        {{- end }}
      {{- if .Values.persistence.enabled }}
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: {{ include "my-app.fullname" . }}
      {{- end }}
      {{- with .Values.nodeSelector }}
      nodeSelector:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.affinity }}
      affinity:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.tolerations }}
      tolerations:
        {{- toYaml . | nindent 8 }}
      {{- end }}
```

**Create helper template file:**
```yaml
# templates/_helpers.tpl
{{/*
Expand the name of the chart.
*/}}
{{- define "my-app.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "my-app.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "my-app.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "my-app.labels" -}}
helm.sh/chart: {{ include "my-app.chart" . }}
{{ include "my-app.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "my-app.selectorLabels" -}}
app.kubernetes.io/name: {{ include "my-app.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "my-app.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "my-app.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Return the appropriate apiVersion for HPA.
*/}}
{{- define "my-app.hpa.apiVersion" -}}
{{- if semverCompare ">=1.23-0" .Capabilities.KubeVersion.GitVersion -}}
autoscaling/v2
{{- else -}}
autoscaling/v2beta2
{{- end -}}
{{- end -}}

{{/*
Image pull secrets
*/}}
{{- define "my-app.imagePullSecrets" -}}
{{- if .Values.global.imagePullSecrets }}
{{- range .Values.global.imagePullSecrets }}
- name: {{ . }}
{{- end }}
{{- else if .Values.image.pullSecrets }}
{{- range .Values.image.pullSecrets }}
- name: {{ . }}
{{- end }}
{{- end }}
{{- end }}
```

**Create conditional templates:**
```yaml
# templates/ingress.yaml
{{- if .Values.ingress.enabled -}}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ include "my-app.fullname" . }}
  labels:
    {{- include "my-app.labels" . | nindent 4 }}
  {{- with .Values.ingress.annotations }}
  annotations:
    {{- toYaml . | nindent 4 }}
  {{- end }}
spec:
  {{- if .Values.ingress.className }}
  ingressClassName: {{ .Values.ingress.className }}
  {{- end }}
  {{- if .Values.ingress.tls }}
  tls:
    {{- range .Values.ingress.tls }}
    - hosts:
        {{- range .hosts }}
        - {{ . | quote }}
        {{- end }}
      secretName: {{ .secretName }}
    {{- end }}
  {{- end }}
  rules:
    {{- range .Values.ingress.hosts }}
    - host: {{ .host | quote }}
      http:
        paths:
          {{- range .paths }}
          - path: {{ .path }}
            pathType: {{ .pathType }}
            backend:
              service:
                name: {{ include "my-app.fullname" $ }}
                port:
                  number: {{ $.Values.service.port }}
          {{- end }}
    {{- end }}
{{- end }}
---
# templates/hpa.yaml
{{- if .Values.autoscaling.enabled }}
apiVersion: {{ include "my-app.hpa.apiVersion" . }}
kind: HorizontalPodAutoscaler
metadata:
  name: {{ include "my-app.fullname" . }}
  labels:
    {{- include "my-app.labels" . | nindent 4 }}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{ include "my-app.fullname" . }}
  minReplicas: {{ .Values.autoscaling.minReplicas }}
  maxReplicas: {{ .Values.autoscaling.maxReplicas }}
  metrics:
  {{- if .Values.autoscaling.targetCPUUtilizationPercentage }}
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: {{ .Values.autoscaling.targetCPUUtilizationPercentage }}
  {{- end }}
  {{- if .Values.autoscaling.targetMemoryUtilizationPercentage }}
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: {{ .Values.autoscaling.targetMemoryUtilizationPercentage }}
  {{- end }}
{{- end }}
```

**Expected:** Templates generate valid Kubernetes YAML. Conditionals work correctly (if/with). Helper functions produce expected output. Resources properly labeled and named. No hardcoded values in templates.

**On failure:**
- Test template rendering: `helm template my-app`
- Check for template syntax errors: `helm lint my-app`
- Validate Go template syntax carefully (dashes, spaces matter)
- Use `helm template --debug` for detailed error messages
- Test with different values files: `helm template my-app -f values-prod.yaml`
- Verify output is valid Kubernetes YAML: `helm template my-app | kubectl apply --dry-run=client -f -`

### Step 4: Add Hooks for Pre/Post-Install Actions

Create hooks for database migrations, setup tasks, or cleanup.

**Create pre-install hook for migrations:**
```yaml
# templates/hooks/pre-install-migration.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "my-app.fullname" . }}-migration
  labels:
    {{- include "my-app.labels" . | nindent 4 }}
  annotations:
    "helm.sh/hook": pre-install,pre-upgrade
    "helm.sh/hook-weight": "-5"
    "helm.sh/hook-delete-policy": before-hook-creation
spec:
  template:
    metadata:
      name: {{ include "my-app.fullname" . }}-migration
      labels:
        {{- include "my-app.selectorLabels" . | nindent 8 }}
    spec:
      restartPolicy: Never
      serviceAccountName: {{ include "my-app.serviceAccountName" . }}
      containers:
      - name: migration
        image: "{{ .Values.image.registry }}/{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"
        command:
        - /app/migrate
        - --database=$(DATABASE_URL)
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: {{ include "my-app.fullname" . }}-db
              key: url
        resources:
          limits:
            cpu: 500m
            memory: 256Mi
          requests:
            cpu: 100m
            memory: 128Mi
  backoffLimit: 3
---
# templates/hooks/post-install-test.yaml
apiVersion: v1
kind: Pod
metadata:
  name: {{ include "my-app.fullname" . }}-test
  labels:
    {{- include "my-app.labels" . | nindent 4 }}
  annotations:
    "helm.sh/hook": test
    "helm.sh/hook-delete-policy": before-hook-creation
spec:
  restartPolicy: Never
  containers:
  - name: test
    image: curlimages/curl:latest
    command:
    - /bin/sh
    - -c
    - |
      set -ex
      # Test service is accessible
      curl -f http://{{ include "my-app.fullname" . }}:{{ .Values.service.port }}/health
      # Test application returns expected response
      response=$(curl -s http://{{ include "my-app.fullname" . }}:{{ .Values.service.port }}/api/version)
      echo "Response: $response"
      # Add more tests as needed
---
# templates/hooks/pre-delete-backup.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "my-app.fullname" . }}-backup
  labels:
    {{- include "my-app.labels" . | nindent 4 }}
  annotations:
    "helm.sh/hook": pre-delete
    "helm.sh/hook-weight": "5"
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  template:
    metadata:
      name: {{ include "my-app.fullname" . }}-backup
    spec:
      restartPolicy: Never
      containers:
      - name: backup
        image: postgres:15-alpine
        command:
        - /bin/sh
        - -c
        - |
          pg_dump $(DATABASE_URL) | gzip > /backup/dump-$(date +%Y%m%d-%H%M%S).sql.gz
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: {{ include "my-app.fullname" . }}-db
              key: url
        volumeMounts:
        - name: backup
          mountPath: /backup
      volumes:
      - name: backup
        persistentVolumeClaim:
          claimName: {{ include "my-app.fullname" . }}-backup
```

**Create NOTES.txt for post-install instructions:**
```
# templates/NOTES.txt
1. Get the application URL by running these commands:
{{- if .Values.ingress.enabled }}
{{- range $host := .Values.ingress.hosts }}
  {{- range .paths }}
  http{{ if $.Values.ingress.tls }}s{{ end }}://{{ $host.host }}{{ .path }}
  {{- end }}
{{- end }}
{{- else if contains "NodePort" .Values.service.type }}
  export NODE_PORT=$(kubectl get --namespace {{ .Release.Namespace }} -o jsonpath="{.spec.ports[0].nodePort}" services {{ include "my-app.fullname" . }})
  export NODE_IP=$(kubectl get nodes --namespace {{ .Release.Namespace }} -o jsonpath="{.items[0].status.addresses[0].address}")
  echo http://$NODE_IP:$NODE_PORT
{{- else if contains "LoadBalancer" .Values.service.type }}
     NOTE: It may take a few minutes for the LoadBalancer IP to be available.
           You can watch the status of by running 'kubectl get --namespace {{ .Release.Namespace }} svc -w {{ include "my-app.fullname" . }}'
  export SERVICE_IP=$(kubectl get svc --namespace {{ .Release.Namespace }} {{ include "my-app.fullname" . }} --template "{{"{{ range (index .status.loadBalancer.ingress 0) }}{{.}}{{ end }}"}}")
  echo http://$SERVICE_IP:{{ .Values.service.port }}
{{- else if contains "ClusterIP" .Values.service.type }}
  export POD_NAME=$(kubectl get pods --namespace {{ .Release.Namespace }} -l "app.kubernetes.io/name={{ include "my-app.name" . }},app.kubernetes.io/instance={{ .Release.Name }}" -o jsonpath="{.items[0].metadata.name}")
  export CONTAINER_PORT=$(kubectl get pod --namespace {{ .Release.Namespace }} $POD_NAME -o jsonpath="{.spec.containers[0].ports[0].containerPort}")
  echo "Visit http://127.0.0.1:8080 to use your application"
  kubectl --namespace {{ .Release.Namespace }} port-forward $POD_NAME 8080:$CONTAINER_PORT
{{- end }}

2. Get the admin credentials:
  echo Username: admin
  echo Password: $(kubectl get secret --namespace {{ .Release.Namespace }} {{ include "my-app.fullname" . }}-auth -o jsonpath="{.data.password}" | base64 --decode)

3. To run database migrations:
  kubectl create job --from=cronjob/{{ include "my-app.fullname" . }}-migration manual-migration

For more information, visit: {{ .Chart.Home }}
```

**Expected:** Hooks execute in correct order (weights determine sequence). Pre-install migration completes before deployment. Test hook validates deployment. Pre-delete hook runs cleanup. NOTES.txt provides helpful post-install information.

**On failure:**
- Check hook annotations syntax exactly matches Helm spec
- Verify hook jobs have `restartPolicy: Never`
- Review hook execution: `kubectl get jobs -n <namespace>`
- Check hook logs: `kubectl logs job/<job-name> -n <namespace>`
- Ensure hook-delete-policy appropriate (before-hook-creation, hook-succeeded, hook-failed)
- Test hooks independently: `helm install --dry-run --debug my-app`

### Step 5: Test and Package Chart

Validate chart, run tests, and package for distribution.

**Lint and validate chart:**
```bash
# Basic linting
helm lint my-app

# Strict linting
helm lint --strict my-app

# Test template rendering
helm template my-app

# Test with custom values
helm template my-app -f values-prod.yaml

# Validate against Kubernetes cluster (dry-run)
helm install my-app my-app --dry-run --debug

# Check for deprecated API versions
helm install my-app my-app --dry-run | kubectl apply --dry-run=server -f -
```

**Create chart tests:**
```bash
# Run Helm tests
helm install my-app my-app -n test --create-namespace
helm test my-app -n test

# View test logs
kubectl logs -n test -l "helm.sh/hook=test" --tail=-1

# Create custom test script
cat > test-chart.sh <<'EOF'
#!/bin/bash
set -e

echo "Installing chart..."
helm install test-release ./my-app --wait --timeout 5m

echo "Running tests..."
helm test test-release

echo "Checking deployment..."
kubectl rollout status deployment/test-release-my-app

echo "Checking endpoints..."
kubectl get endpoints test-release-my-app

echo "Upgrading chart..."
helm upgrade test-release ./my-app --set replicaCount=2 --wait

echo "Rolling back..."
helm rollback test-release

echo "Cleaning up..."
helm uninstall test-release

echo "All tests passed!"
EOF

chmod +x test-chart.sh
./test-chart.sh
```

**Package chart:**
```bash
# Update dependencies first
helm dependency update my-app

# Package chart
helm package my-app

# Creates: my-app-0.1.0.tgz

# Verify package
helm verify my-app-0.1.0.tgz

# Generate index for repository
helm repo index . --url https://charts.example.com/

# Creates: index.yaml
```

**Create different values files for environments:**
```yaml
# values-dev.yaml
replicaCount: 1
resources:
  limits:
    cpu: 500m
    memory: 256Mi
  requests:
    cpu: 100m
    memory: 128Mi
ingress:
  enabled: true
  hosts:
  - host: my-app-dev.example.com
    paths:
    - path: /
      pathType: Prefix
postgresql:
  enabled: true
  primary:
    persistence:
      size: 1Gi

---
# values-prod.yaml
replicaCount: 5
resources:
  limits:
    cpu: 2000m
    memory: 1Gi
  requests:
    cpu: 500m
    memory: 512Mi
autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
ingress:
  enabled: true
  className: nginx
  hosts:
  - host: my-app.example.com
    paths:
    - path: /
      pathType: Prefix
  tls:
  - secretName: my-app-tls
    hosts:
    - my-app.example.com
podDisruptionBudget:
  enabled: true
  minAvailable: 2
postgresql:
  enabled: true
  primary:
    persistence:
      size: 50Gi
    resources:
      limits:
        cpu: 4000m
        memory: 8Gi
```

**Test with different environments:**
```bash
# Test development values
helm install my-app-dev my-app -f values-dev.yaml --dry-run --debug

# Test production values
helm install my-app-prod my-app -f values-prod.yaml --dry-run --debug

# Install to dev namespace
helm install my-app my-app -f values-dev.yaml -n development --create-namespace

# Install to prod namespace
helm install my-app my-app -f values-prod.yaml -n production --create-namespace
```

**Expected:** Chart passes all lint checks. Template rendering produces valid Kubernetes YAML. Tests pass successfully. Chart packages without errors. Different values files work for each environment. Installation succeeds without warnings.

**On failure:**
- Review lint output for specific issues
- Check template syntax errors with `--debug` flag
- Verify all required values are set: `helm get values <release>`
- Test dependency resolution: `helm dependency list my-app`
- Validate packaged chart: `tar -tzf my-app-0.1.0.tgz`
- Check for missing files in package

### Step 6: Publish to Chart Repository

Set up chart repository and publish versioned releases.

**Create GitHub Pages repository:**
```bash
# Create gh-pages branch for chart hosting
git checkout -b gh-pages
git rm -rf .
mkdir charts
cp ../my-app-0.1.0.tgz charts/
helm repo index charts/ --url https://<username>.github.io/<repo>/charts
git add charts/
git commit -m "Add my-app chart v0.1.0"
git push origin gh-pages

# Configure GitHub Pages in repository settings
# Source: gh-pages branch, /root directory
```

**Or use ChartMuseum:**
```bash
# Run ChartMuseum locally
docker run -d \
  -p 8080:8080 \
  -e STORAGE=local \
  -e STORAGE_LOCAL_ROOTDIR=/charts \
  -v $(pwd)/charts:/charts \
  ghcr.io/helm/chartmuseum:latest

# Upload chart
curl --data-binary "@my-app-0.1.0.tgz" http://localhost:8080/api/charts

# Add repository
helm repo add myrepo http://localhost:8080
helm repo update

# Search charts
helm search repo myrepo
```

**Or use OCI registry (Helm 3.8+):**
```bash
# Login to registry
echo $REGISTRY_PASSWORD | helm registry login registry.example.com --username $REGISTRY_USERNAME --password-stdin

# Push chart as OCI artifact
helm push my-app-0.1.0.tgz oci://registry.example.com/charts

# Install from OCI registry
helm install my-app oci://registry.example.com/charts/my-app --version 0.1.0
```

**Create release automation:**
```yaml
# .github/workflows/release-chart.yaml
name: Release Chart

on:
  push:
    tags:
    - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout
      uses: actions/checkout@v3
      with:
        fetch-depth: 0

    - name: Configure Git
      run: |
        git config user.name "$GITHUB_ACTOR"
        git config user.email "$GITHUB_ACTOR@users.noreply.github.com"

    - name: Install Helm
      uses: azure/setup-helm@v3
      with:
        version: v3.12.0

    - name: Run chart-releaser
      uses: helm/chart-releaser-action@v1.5.0
      env:
        CR_TOKEN: "${{ secrets.GITHUB_TOKEN }}"
```

**Document usage:**
```markdown
# README.md
# My App Helm Chart

## Installation

\`\`\`bash
# Add repository
helm repo add myrepo https://charts.example.com
helm repo update

# Install chart
helm install my-app myrepo/my-app

# Install with custom values
helm install my-app myrepo/my-app -f custom-values.yaml

# Upgrade
helm upgrade my-app myrepo/my-app --version 0.2.0
\`\`\`

## Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `replicaCount` | Number of replicas | `3` |
| `image.repository` | Image repository | `mycompany/my-app` |
| `image.tag` | Image tag | `""` (chart appVersion) |
| `resources.limits.cpu` | CPU limit | `1000m` |
| `resources.limits.memory` | Memory limit | `512Mi` |
| `ingress.enabled` | Enable ingress | `false` |
| `postgresql.enabled` | Enable PostgreSQL | `true` |

See [values.yaml](values.yaml) for all options.

## Upgrading

### From 0.1.x to 0.2.x

Breaking changes:
- Renamed `service.type` to `service.kind`
- Removed `legacy.enabled` flag

\`\`\`bash
helm upgrade my-app myrepo/my-app --version 0.2.0 --set service.kind=ClusterIP
\`\`\`
\`\`\`
```

**Expected:** Chart published to repository successfully. Chart discoverable via `helm search`. Installation works from repository. Versioning follows SemVer. Release automation working. Documentation complete.

**On failure:**
- Verify repository URL accessible publicly
- Check index.yaml generated correctly: `helm repo index --help`
- For OCI registries, ensure authentication working
- Review chart-releaser action logs in GitHub
- Test repository addition: `helm repo add test <url> && helm repo update`
- Validate chart metadata: `helm show chart myrepo/my-app`

## Validation

- [ ] Chart structure follows Helm conventions
- [ ] Chart.yaml complete with all metadata
- [ ] values.yaml organized with sensible defaults
- [ ] Templates generate valid Kubernetes YAML
- [ ] Helper templates reduce duplication
- [ ] Conditionals work correctly (if/with/range)
- [ ] Hooks execute in proper order
- [ ] Chart passes `helm lint --strict`
- [ ] Tests pass with `helm test`
- [ ] Chart packages without errors
- [ ] Multiple values files work for different environments
- [ ] Chart published to repository successfully
- [ ] Installation and upgrade work correctly
- [ ] Documentation complete (README, NOTES.txt)
- [ ] Rollback tested and working

## Common Pitfalls

- **Whitespace in Templates**: Go templates are sensitive to whitespace. Use `{{-` to trim left, `-}}` to trim right. Incorrect spacing breaks YAML indentation.

- **Hardcoded Values**: Never hardcode values in templates. Everything configurable should be in values.yaml with sensible defaults. Use `.Values.` references.

- **Missing Conditionals**: Forgetting `{{- if .Values.feature.enabled }}` around optional resources causes errors. Wrap optional resources in conditionals.

- **Selector Immutability**: Deployment selectors can't change after creation. Use consistent selector labels from `_helpers.tpl`. Don't include version in selectors.

- **Incomplete Cleanup**: Not using proper `hook-delete-policy` leaves hook resources behind. Use `before-hook-creation` for most hooks.

- **Dependency Hell**: Pinning dependencies too strictly causes conflicts. Use version ranges (e.g., `~1.2.0` for 1.2.x) instead of exact versions.

- **Missing Resource Limits**: Not setting resource limits in templates causes cluster resource issues. Always include limits/requests, even if overridable.

- **Chart vs App Version**: Mixing chart version (metadata) with app version (deployed software). Increment chart version for template changes, app version for software changes.

- **Global vs Local Values**: Using `.Values` instead of `$` in nested contexts loses scope. Use `$` for root context, `.` for current context.

- **Testing Only Happy Path**: Not testing edge cases (disabled features, minimal values, maximal values). Test with multiple values combinations.

## Related Skills

- `deploy-to-kubernetes` - Applications deployed using Helm charts
- `setup-local-kubernetes` - Local testing of Helm charts
- `implement-gitops-workflow` - GitOps with Helm charts in Git
- `configure-ingress-networking` - Ingress configuration templated in charts
- `setup-prometheus-monitoring` - ServiceMonitor resources in charts
- `enforce-policy-as-code` - Policy validation of chart templates
