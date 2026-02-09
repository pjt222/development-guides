---
name: register-ml-model
description: >
  Register trained models in MLflow Model Registry with version control, implement
  stage transitions (Staging, Production, Archived) with approval workflows, and
  manage model lineage with comprehensive metadata and deployment tracking.
license: MIT
allowed-tools: Read Write Edit Bash Grep Glob
metadata:
  author: Philipp Thoss
  version: "1.0"
  domain: mlops
  complexity: intermediate
  language: multi
  tags: model-registry, mlflow, staging, production, versioning
---

# Register ML Model

Implement MLflow Model Registry for systematic model versioning, stage management, and deployment governance.

## When to Use

- Promoting a trained model from experimentation to production
- Managing multiple model versions across development stages
- Implementing model approval workflows for governance
- Tracking model lineage from training to deployment
- Rolling back to previous model versions
- Comparing deployed model versions for A/B testing
- Auditing model changes for compliance requirements

## Inputs

- **Required**: MLflow tracking server with Model Registry enabled
- **Required**: Trained model logged with MLflow (from tracking runs)
- **Required**: Model name for registry registration
- **Optional**: Approval workflow integration (email, Slack, Jira)
- **Optional**: CI/CD pipeline for automated promotion
- **Optional**: Model validation metrics thresholds

## Procedure

### Step 1: Configure Model Registry Backend

Set up MLflow Model Registry with database backend (file-based registry not recommended for production).

```bash
# Start MLflow server with Model Registry support
mlflow server \
  --backend-store-uri postgresql://user:pass@localhost:5432/mlflow \
  --default-artifact-root s3://mlflow-artifacts/models \
  --host 0.0.0.0 \
  --port 5000
```

Python configuration:

```python
# model_registry_config.py
import mlflow
from mlflow.tracking import MlflowClient

# Set tracking URI (must support Model Registry)
MLFLOW_TRACKING_URI = "http://mlflow-server.company.com:5000"
mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)

# Initialize client
client = MlflowClient()

def verify_registry_backend():
    """
    Verify Model Registry is available.
    """
    try:
        # Attempt to list registered models
        registered_models = client.search_registered_models()
        print(f"✓ Model Registry available ({len(registered_models)} models)")
        return True
    except Exception as e:
        print(f"✗ Model Registry not available: {e}")
        return False

def create_registered_model(name, description, tags=None):
    """
    Create a new registered model in the registry.
    """
    try:
        model = client.create_registered_model(
            name=name,
            description=description,
            tags=tags or {}
        )
        print(f"✓ Created registered model: {name}")
        return model
    except mlflow.exceptions.MlflowException as e:
        if "already exists" in str(e):
            print(f"Model {name} already exists, returning existing model")
            return client.get_registered_model(name)
        else:
            raise

# Verify on import
if __name__ == "__main__":
    verify_registry_backend()
```

**Expected:** Model Registry UI tab appears in MLflow, `search_registered_models()` returns successfully (even if empty), database contains `registered_models` table.

**On failure:** Verify MLflow version ≥1.2 (Model Registry introduced in 1.2), check database backend (SQLite not fully supported for Model Registry), ensure `--backend-store-uri` points to database (not file://), verify database user has CREATE TABLE permissions, check MLflow server logs for migration errors.

### Step 2: Register Model from Training Run

Register a logged model to the Model Registry with comprehensive metadata.

```python
# register_model.py
import mlflow
from mlflow.tracking import MlflowClient
from model_registry_config import MLFLOW_TRACKING_URI

mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)
client = MlflowClient()

def register_model_from_run(
    run_id,
    model_artifact_path,
    model_name,
    description=None,
    tags=None
):
    """
    Register a model from a completed MLflow run.

    Args:
        run_id: MLflow run ID containing the model
        model_artifact_path: Path to model within run artifacts (e.g., "model")
        model_name: Name for the registered model
        description: Optional description
        tags: Optional tags dict

    Returns:
        ModelVersion object
    """
    # Build model URI
    model_uri = f"runs:/{run_id}/{model_artifact_path}"

    # Register model (creates new version)
    result = mlflow.register_model(
        model_uri=model_uri,
        name=model_name,
        tags=tags
    )

    version = result.version
    print(f"✓ Registered {model_name} version {version}")

    # Update version description
    if description:
        client.update_model_version(
            name=model_name,
            version=version,
            description=description
        )

    # Add version-level tags
    if tags:
        for key, value in tags.items():
            client.set_model_version_tag(model_name, version, key, value)

    return result

def register_model_during_training(
    model,
    model_name,
    X_train,
    signature=None,
    input_example=None,
    pip_requirements=None
):
    """
    Register model during active MLflow run.

    Example usage in training script:
        with mlflow.start_run():
            model = train_model()
            register_model_during_training(
                model, "my-model", X_train
            )
    """
    from mlflow.models.signature import infer_signature

    if signature is None:
        signature = infer_signature(X_train, model.predict(X_train))

    if input_example is None:
        input_example = X_train[:5]

    # Log model with registration
    mlflow.sklearn.log_model(
        sk_model=model,
        artifact_path="model",
        signature=signature,
        input_example=input_example,
        registered_model_name=model_name,
        pip_requirements=pip_requirements
    )

    print(f"✓ Model logged and registered as {model_name}")

# Example: Register best run from experiment
def register_best_run(experiment_name, metric="test_accuracy", model_name=None):
    """
    Find best run and register its model.
    """
    experiment = client.get_experiment_by_name(experiment_name)

    # Find best run
    runs = client.search_runs(
        experiment_ids=[experiment.experiment_id],
        order_by=[f"metrics.{metric} DESC"],
        max_results=1
    )

    if not runs:
        raise ValueError(f"No runs found in experiment {experiment_name}")

    best_run = runs[0]
    run_id = best_run.info.run_id
    metric_value = best_run.data.metrics.get(metric)

    if model_name is None:
        model_name = f"{experiment_name}-model"

    # Register with detailed metadata
    result = register_model_from_run(
        run_id=run_id,
        model_artifact_path="model",
        model_name=model_name,
        description=f"Best model from {experiment_name} ({metric}={metric_value:.4f})",
        tags={
            "experiment": experiment_name,
            "run_id": run_id,
            "metric": metric,
            "metric_value": str(metric_value),
            "registered_by": "automated_pipeline"
        }
    )

    return result

# Usage
if __name__ == "__main__":
    # Option 1: Register from specific run
    register_model_from_run(
        run_id="abc123def456",
        model_artifact_path="model",
        model_name="customer-churn-classifier",
        description="Random Forest classifier with optimized hyperparameters",
        tags={"team": "data-science", "project": "churn-prediction"}
    )

    # Option 2: Register best run automatically
    register_best_run(
        experiment_name="churn-experiments",
        metric="test_f1",
        model_name="customer-churn-classifier"
    )
```

**Expected:** New model version appears in Model Registry UI, version includes description and tags, model artifacts are accessible via `models:/<model-name>/<version>` URI, model signature and input example are preserved.

**On failure:** Verify run_id exists and has completed (`client.get_run(run_id)`), check model artifact path matches logged artifact (`mlflow.search_runs()` to inspect), ensure model was logged with proper framework flavor (`mlflow.sklearn.log_model` not `mlflow.log_artifact`), verify no special characters in model name (use hyphens not underscores), check artifact storage accessibility.

### Step 3: Implement Stage Transitions with Validation

Move model versions through stages (None → Staging → Production → Archived) with validation checks.

```python
# stage_management.py
import mlflow
from mlflow.tracking import MlflowClient
from datetime import datetime

client = MlflowClient()

class ModelStageManager:
    """
    Manage model version stage transitions with validation.
    """

    STAGES = ["None", "Staging", "Production", "Archived"]

    def __init__(self, model_name):
        self.model_name = model_name

    def transition_to_staging(self, version, validation_metrics=None):
        """
        Promote model version to Staging with validation.

        Args:
            version: Model version number
            validation_metrics: Dict of required metrics and thresholds
        """
        print(f"Promoting {self.model_name} v{version} to Staging...")

        # Validation checks
        if validation_metrics:
            if not self._validate_metrics(version, validation_metrics):
                raise ValueError("Model failed validation checks")

        # Check for existing Staging models
        staging_versions = client.get_latest_versions(
            self.model_name,
            stages=["Staging"]
        )

        if staging_versions:
            print(f"Warning: {len(staging_versions)} version(s) already in Staging")
            # Optionally archive old staging versions
            for old_version in staging_versions:
                self._archive_version(old_version.version)

        # Transition to Staging
        client.transition_model_version_stage(
            name=self.model_name,
            version=version,
            stage="Staging",
            archive_existing_versions=True
        )

        # Add transition metadata
        client.set_model_version_tag(
            self.model_name,
            version,
            "promoted_to_staging_at",
            datetime.now().isoformat()
        )

        print(f"✓ {self.model_name} v{version} promoted to Staging")

    def transition_to_production(self, version, approval_required=True):
        """
        Promote model version to Production with approval workflow.

        Args:
            version: Model version number
            approval_required: Whether to require manual approval
        """
        print(f"Promoting {self.model_name} v{version} to Production...")

        # Check current stage
        model_version = client.get_model_version(self.model_name, version)
        if model_version.current_stage != "Staging":
            raise ValueError(
                f"Model must be in Staging (currently in {model_version.current_stage})"
            )

        # Approval workflow
        if approval_required:
            approval = self._request_approval(version)
            if not approval:
                print("✗ Promotion to Production rejected")
                return False

        # Check for existing Production models
        prod_versions = client.get_latest_versions(
            self.model_name,
            stages=["Production"]
        )

        # Transition to Production
        client.transition_model_version_stage(
            name=self.model_name,
            version=version,
            stage="Production",
            archive_existing_versions=True  # Archive old Production versions
        )

        # Add transition metadata
        client.set_model_version_tag(
            self.model_name,
            version,
            "promoted_to_production_at",
            datetime.now().isoformat()
        )

        if prod_versions:
            old_version = prod_versions[0].version
            print(f"Archived previous Production version: {old_version}")

        print(f"✓ {self.model_name} v{version} promoted to Production")
        return True

    def rollback_production(self):
        """
        Rollback Production to previous Archived version.
        """
        # Get current Production version
        prod_versions = client.get_latest_versions(
            self.model_name,
            stages=["Production"]
        )

        if not prod_versions:
            raise ValueError("No Production version to rollback")

        current_prod = prod_versions[0]

        # Find previous Production version (now in Archived)
        all_versions = client.search_model_versions(f"name='{self.model_name}'")
        archived_versions = [
            v for v in all_versions
            if v.current_stage == "Archived" and
            "promoted_to_production_at" in v.tags
        ]

        if not archived_versions:
            raise ValueError("No previous Production version found")

        # Get most recent archived production version
        archived_versions.sort(
            key=lambda v: v.tags.get("promoted_to_production_at", ""),
            reverse=True
        )
        rollback_version = archived_versions[0]

        print(f"Rolling back from v{current_prod.version} to v{rollback_version.version}")

        # Archive current Production
        client.transition_model_version_stage(
            name=self.model_name,
            version=current_prod.version,
            stage="Archived"
        )

        # Promote previous version back to Production
        client.transition_model_version_stage(
            name=self.model_name,
            version=rollback_version.version,
            stage="Production"
        )

        # Add rollback metadata
        client.set_model_version_tag(
            self.model_name,
            rollback_version.version,
            "rolled_back_at",
            datetime.now().isoformat()
        )

        print(f"✓ Rolled back to {self.model_name} v{rollback_version.version}")

    def _validate_metrics(self, version, required_metrics):
        """
        Validate model metrics against thresholds.
        """
        model_version = client.get_model_version(self.model_name, version)
        run_id = model_version.run_id
        run = client.get_run(run_id)

        for metric_name, threshold in required_metrics.items():
            metric_value = run.data.metrics.get(metric_name)
            if metric_value is None:
                print(f"✗ Metric {metric_name} not found")
                return False
            if metric_value < threshold:
                print(f"✗ {metric_name}={metric_value} below threshold {threshold}")
                return False
            print(f"✓ {metric_name}={metric_value} >= {threshold}")

        return True

    def _archive_version(self, version):
        """
        Archive a model version.
        """
        client.transition_model_version_stage(
            name=self.model_name,
            version=version,
            stage="Archived"
        )

    def _request_approval(self, version):
        """
        Request approval for Production promotion.
        Implement your approval workflow here (email, Slack, Jira, etc.)
        """
        # Placeholder - integrate with your approval system
        print(f"Approval requested for {self.model_name} v{version}")
        print("Implement approval workflow (email, Slack, JIRA ticket, etc.)")

        # For demo: auto-approve
        return True

# Usage
if __name__ == "__main__":
    manager = ModelStageManager("customer-churn-classifier")

    # Promote to Staging with validation
    manager.transition_to_staging(
        version=3,
        validation_metrics={
            "test_accuracy": 0.85,
            "test_f1": 0.80
        }
    )

    # Promote to Production with approval
    manager.transition_to_production(
        version=3,
        approval_required=True
    )

    # Rollback if issues detected
    # manager.rollback_production()
```

**Expected:** Model version stage updates in registry, old versions archived automatically, transition timestamps recorded in tags, rollback restores previous production version.

**On failure:** Check version exists and is in expected stage, verify archive_existing_versions flag behavior (may not archive if only one version), ensure database supports concurrent transactions for stage updates, check for stage transition locks (only one transition per version at a time), verify approval workflow integration.

### Step 4: Implement Model Aliasing and References

Use model aliases for stable deployment references (MLflow ≥2.0).

```python
# model_aliases.py
from mlflow.tracking import MlflowClient

client = MlflowClient()

def set_model_alias(model_name, version, alias):
    """
    Set an alias for a model version (MLflow 2.0+).

    Common aliases: "champion", "challenger", "canary", "latest-approved"
    """
    try:
        client.set_registered_model_alias(
            name=model_name,
            alias=alias,
            version=version
        )
        print(f"✓ Set alias '{alias}' for {model_name} v{version}")
    except AttributeError:
        print("Model aliasing requires MLflow ≥2.0, using tags as fallback")
        client.set_model_version_tag(model_name, version, f"alias_{alias}", "true")

def get_model_by_alias(model_name, alias):
    """
    Retrieve model version by alias.
    """
    try:
        model_version = client.get_model_version_by_alias(model_name, alias)
        print(f"Alias '{alias}' points to {model_name} v{model_version.version}")
        return model_version
    except AttributeError:
        # Fallback for MLflow <2.0
        versions = client.search_model_versions(
            f"name='{model_name}' and tag.alias_{alias}='true'"
        )
        if versions:
            return versions[0]
        raise ValueError(f"No version found with alias '{alias}'")

def load_model_by_alias(model_name, alias):
    """
    Load model using alias for inference.
    """
    model_uri = f"models:/{model_name}@{alias}"
    model = mlflow.sklearn.load_model(model_uri)
    return model

# Champion/Challenger pattern
def setup_ab_test_aliases(model_name, champion_version, challenger_version):
    """
    Set up A/B test with champion and challenger aliases.
    """
    set_model_alias(model_name, champion_version, "champion")
    set_model_alias(model_name, challenger_version, "challenger")

    print("\nA/B test setup:")
    print(f"  Champion: v{champion_version} (serves 90% traffic)")
    print(f"  Challenger: v{challenger_version} (serves 10% traffic)")

# Usage in deployment
def get_production_model(model_name, traffic_split=0.9):
    """
    Load model based on A/B test traffic split.
    """
    import random

    if random.random() < traffic_split:
        return load_model_by_alias(model_name, "champion")
    else:
        return load_model_by_alias(model_name, "challenger")
```

**Expected:** Aliases appear in Model Registry UI, loading models by alias works (`models:/name@alias`), updating alias immediately affects new loads, A/B test infrastructure functional.

**On failure:** Upgrade MLflow to ≥2.0 for native alias support, use tag-based fallback for older versions, verify alias naming (alphanumeric and hyphens only), check for alias conflicts (one alias per model version).

### Step 5: Implement Model Lineage Tracking

Track full lineage from data to deployment with comprehensive metadata.

```python
# model_lineage.py
import mlflow
from mlflow.tracking import MlflowClient
import json

client = MlflowClient()

def enrich_model_metadata(model_name, version, lineage_data):
    """
    Add comprehensive lineage metadata to model version.

    Args:
        model_name: Registered model name
        version: Model version number
        lineage_data: Dict containing lineage information
    """
    # Training data lineage
    if "data_source" in lineage_data:
        client.set_model_version_tag(
            model_name, version,
            "data_source_uri", lineage_data["data_source"]
        )

    if "data_version" in lineage_data:
        client.set_model_version_tag(
            model_name, version,
            "data_version", lineage_data["data_version"]
        )

    # Feature engineering lineage
    if "feature_pipeline" in lineage_data:
        client.set_model_version_tag(
            model_name, version,
            "feature_pipeline", json.dumps(lineage_data["feature_pipeline"])
        )

    # Training environment
    if "training_environment" in lineage_data:
        env = lineage_data["training_environment"]
        client.set_model_version_tag(model_name, version, "python_version", env.get("python_version"))
        client.set_model_version_tag(model_name, version, "framework_version", env.get("framework_version"))

    # Deployment tracking
    if "deployment_info" in lineage_data:
        deployment = lineage_data["deployment_info"]
        client.set_model_version_tag(model_name, version, "deployed_to", deployment.get("environment"))
        client.set_model_version_tag(model_name, version, "deployment_timestamp", deployment.get("timestamp"))

    print(f"✓ Enriched {model_name} v{version} with lineage metadata")

def get_model_lineage(model_name, version):
    """
    Retrieve complete model lineage.
    """
    model_version = client.get_model_version(model_name, version)

    lineage = {
        "model_name": model_name,
        "version": version,
        "stage": model_version.current_stage,
        "run_id": model_version.run_id,
        "tags": dict(model_version.tags),
        "creation_timestamp": model_version.creation_timestamp,
    }

    # Get training run details
    run = client.get_run(model_version.run_id)
    lineage["training"] = {
        "experiment_name": client.get_experiment(run.info.experiment_id).name,
        "parameters": dict(run.data.params),
        "metrics": dict(run.data.metrics),
        "tags": dict(run.data.tags),
    }

    return lineage

def export_lineage_report(model_name, version, output_file="lineage_report.json"):
    """
    Export lineage as JSON report.
    """
    lineage = get_model_lineage(model_name, version)

    with open(output_file, "w") as f:
        json.dump(lineage, f, indent=2, default=str)

    print(f"✓ Lineage report saved to {output_file}")

# Usage
if __name__ == "__main__":
    lineage_data = {
        "data_source": "s3://data-lake/customer_churn/v2.3",
        "data_version": "2.3.0",
        "feature_pipeline": {
            "version": "1.5",
            "transformations": ["StandardScaler", "OneHotEncoder"],
            "feature_count": 47
        },
        "training_environment": {
            "python_version": "3.9.7",
            "framework_version": "sklearn-1.0.2"
        },
        "deployment_info": {
            "environment": "production",
            "timestamp": "2024-01-15T10:30:00Z"
        }
    }

    enrich_model_metadata("customer-churn-classifier", version=5, lineage_data=lineage_data)
    export_lineage_report("customer-churn-classifier", version=5)
```

**Expected:** Model version tags include comprehensive lineage information, `get_model_lineage()` returns full history, JSON report contains data source, training details, and deployment info.

**On failure:** Verify tag values are strings (convert dicts to JSON), check tag key naming (no spaces or special chars), ensure lineage data captured during training, verify run_id is valid and accessible.

### Step 6: Automate Registry Operations with CI/CD

Integrate model registration into CI/CD pipelines for automated promotion.

```yaml
# .github/workflows/model_promotion.yml
name: Model Promotion Pipeline

on:
  workflow_dispatch:
    inputs:
      model_name:
        description: 'Model name to promote'
        required: true
      version:
        description: 'Model version number'
        required: true
      target_stage:
        description: 'Target stage (Staging/Production)'
        required: true
        type: choice
        options:
          - Staging
          - Production

jobs:
  promote-model:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'

      - name: Install dependencies
        run: |
          pip install mlflow boto3 psycopg2-binary

      - name: Run validation tests
        env:
          MLFLOW_TRACKING_URI: ${{ secrets.MLFLOW_TRACKING_URI }}
        run: |
          python scripts/validate_model.py \
            --model-name ${{ github.event.inputs.model_name }} \
            --version ${{ github.event.inputs.version }}

      - name: Promote model
        env:
          MLFLOW_TRACKING_URI: ${{ secrets.MLFLOW_TRACKING_URI }}
        run: |
          python scripts/promote_model.py \
            --model-name ${{ github.event.inputs.model_name }} \
            --version ${{ github.event.inputs.version }} \
            --target-stage ${{ github.event.inputs.target_stage }}

      - name: Notify team
        if: success()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "Model promoted: ${{ github.event.inputs.model_name }} v${{ github.event.inputs.version }} → ${{ github.event.inputs.target_stage }}"
            }
```

Python automation script:

```python
# scripts/promote_model.py
import argparse
from stage_management import ModelStageManager

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model-name", required=True)
    parser.add_argument("--version", type=int, required=True)
    parser.add_argument("--target-stage", required=True, choices=["Staging", "Production"])
    args = parser.parse_args()

    manager = ModelStageManager(args.model_name)

    if args.target_stage == "Staging":
        manager.transition_to_staging(
            version=args.version,
            validation_metrics={
                "test_accuracy": 0.85,
                "test_f1": 0.80
            }
        )
    elif args.target_stage == "Production":
        manager.transition_to_production(
            version=args.version,
            approval_required=False  # Approval via PR review
        )

if __name__ == "__main__":
    main()
```

**Expected:** GitHub Actions workflow triggers on manual dispatch, validation tests pass, model promoted to target stage, Slack notification sent, deployment pipeline triggered automatically.

**On failure:** Check GitHub secrets configuration for MLFLOW_TRACKING_URI, verify network access from GitHub Actions to MLflow server (may need VPN or IP allowlist), ensure validation script has correct metric thresholds, check Slack webhook configuration, verify Python script executable permissions.

## Validation

- [ ] Model Registry accessible and backend configured
- [ ] Models register successfully from training runs
- [ ] Stage transitions work (None → Staging → Production → Archived)
- [ ] Validation checks enforce quality thresholds
- [ ] Model aliases set and resolved correctly
- [ ] Lineage metadata captured comprehensively
- [ ] Rollback functionality restores previous versions
- [ ] CI/CD pipeline automates promotions
- [ ] Team notifications working for stage changes
- [ ] Model URIs resolve correctly in all stages

## Common Pitfalls

- **SQLite limitations**: Model Registry requires database backend (PostgreSQL/MySQL) for production - file-based registry causes concurrency issues
- **Stage conflicts**: Multiple versions in same stage cause confusion - use `archive_existing_versions=True` to auto-archive
- **Missing run linkage**: Registering models without run_id loses lineage - always register from MLflow runs, not raw files
- **Alias confusion**: Using stages as deployment targets instead of aliases - stages are for workflow, aliases for deployment references
- **Validation skipped**: Promoting to Production without checks - implement mandatory validation in CI/CD pipeline
- **No rollback plan**: Production issues without rollback capability - maintain previous Production version in Archived stage
- **Tag overload**: Too many unstructured tags - standardize tag schema and naming conventions
- **Manual processes**: Human-driven promotions are error-prone and slow - automate with CI/CD and approval workflows
- **Lost artifacts**: Model registered but artifacts deleted from storage - ensure artifact retention policies align with model lifecycle

## Related Skills

- `track-ml-experiments` - Log models to MLflow before registering them
- `deploy-ml-model-serving` - Deploy registered models to serving infrastructure
- `run-ab-test-models` - A/B test models using registry aliases
- `orchestrate-ml-pipeline` - Automate model training and registration
- `version-ml-data` - Version training data for model lineage
