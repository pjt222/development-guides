# Track ML Experiments — Extended Examples

Complete configuration files and code templates.


## Step 1: Initialize MLflow Tracking Server

### Code Block 1

```bash

# Option 1: Local file-based tracking (development)
mkdir -p mlruns
export MLFLOW_TRACKING_URI="file:./mlruns"

# Option 2: SQLite backend with local artifacts
mlflow server \
  --backend-store-uri sqlite:///mlflow.db \
  --default-artifact-root ./mlartifacts \
  --host 0.0.0.0 \
  --port 5000

# Option 3: Production setup with PostgreSQL and S3
mlflow server \
  --backend-store-uri postgresql://user:pass@localhost:5432/mlflow \
  --default-artifact-root s3://my-mlflow-bucket/artifacts \
  --host 0.0.0.0 \
  --port 5000

```

### Code Block 2

```python

# mlflow_config.py
import os

MLFLOW_TRACKING_URI = os.getenv(
    "MLFLOW_TRACKING_URI",
    "http://mlflow-server.company.com:5000"
)

MLFLOW_EXPERIMENT_NAME = os.getenv(
    "MLFLOW_EXPERIMENT_NAME",
    "default-experiment"
)

# Configure artifact storage
ARTIFACT_LOCATION = os.getenv(
    "MLFLOW_ARTIFACT_LOCATION",
    "s3://mlflow-artifacts/experiments"
)

```


## Step 2: Configure Autologging for ML Frameworks

### Code Block 3

```python

# training_script.py
import mlflow
from mlflow_config import MLFLOW_TRACKING_URI, MLFLOW_EXPERIMENT_NAME

# Set tracking URI
mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)
mlflow.set_experiment(MLFLOW_EXPERIMENT_NAME)

# Enable autologging for sklearn
import mlflow.sklearn
mlflow.sklearn.autolog(
    log_input_examples=True,
    log_model_signatures=True,
    log_models=True,
    disable=False,
    exclusive=False,
    disable_for_unsupported_versions=False,
    silent=False
)

# Train model - autologging captures everything
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score
from sklearn.datasets import load_iris

X, y = load_iris(return_X_y=True)

with mlflow.start_run(run_name="rf_baseline"):
    # Autolog captures hyperparameters
    clf = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42)

    # Autolog captures cross-validation scores
    scores = cross_val_score(clf, X, y, cv=5)

    # Autolog saves the model
    clf.fit(X, y)

    # Manually log additional context
    mlflow.log_param("dataset", "iris")
    mlflow.log_metric("mean_cv_score", scores.mean())
    mlflow.log_metric("std_cv_score", scores.std())
    mlflow.set_tag("model_type", "baseline")

```

### Code Block 4

```python

import mlflow.pytorch

mlflow.pytorch.autolog(
    log_every_n_epoch=1,
    log_every_n_step=None,
    log_models=True,
    disable=False,
    exclusive=False,
    disable_for_unsupported_versions=False,
    silent=False
)

# Training loop automatically logged
model = YourPyTorchModel()
trainer = pl.Trainer(max_epochs=10)
trainer.fit(model, train_dataloader)

```


## Step 3: Implement Comprehensive Manual Logging

### Code Block 5

```python

# comprehensive_tracking.py
import mlflow
import numpy as np
import matplotlib.pyplot as plt
from pathlib import Path

def train_and_log_model(params, X_train, y_train, X_test, y_test):
    """
    Train model with comprehensive MLflow tracking.
    """
    with mlflow.start_run(run_name=f"experiment_{params['version']}") as run:
        # Log parameters
        mlflow.log_params({
            "learning_rate": params["lr"],
            "batch_size": params["batch_size"],
            "optimizer": params["optimizer"],
            "architecture": params["model_arch"]
        })

        # Log tags for organization
        mlflow.set_tags({
            "team": "data-science",
            "project": "customer-churn",
            "environment": "production",
            "git_commit": get_git_commit(),
            "data_version": params["data_version"]
        })

        # Train model (placeholder)
        model = train_model(params, X_train, y_train)

        # Log metrics at different steps
        for epoch in range(params["epochs"]):
            train_loss, val_loss = train_epoch(model, X_train, y_train, X_test, y_test)
            mlflow.log_metrics({
                "train_loss": train_loss,
                "val_loss": val_loss
            }, step=epoch)

        # Log final evaluation metrics
        test_metrics = evaluate_model(model, X_test, y_test)
        mlflow.log_metrics({
            "test_accuracy": test_metrics["accuracy"],
            "test_precision": test_metrics["precision"],
            "test_recall": test_metrics["recall"],
            "test_f1": test_metrics["f1"]
        })

        # Log confusion matrix as artifact
        fig, ax = plt.subplots(figsize=(8, 6))
        plot_confusion_matrix(model, X_test, y_test, ax=ax)
        mlflow.log_figure(fig, "confusion_matrix.png")
        plt.close()

        # Log ROC curve
        fig, ax = plt.subplots(figsize=(8, 6))
        plot_roc_curve(model, X_test, y_test, ax=ax)
        mlflow.log_figure(fig, "roc_curve.png")
        plt.close()

        # Log feature importance
        importance_dict = dict(zip(feature_names, model.feature_importances_))
        mlflow.log_dict(importance_dict, "feature_importance.json")

        # Log model with signature
        from mlflow.models.signature import infer_signature
        signature = infer_signature(X_train, model.predict(X_train))
        mlflow.sklearn.log_model(
            model,
            "model",
            signature=signature,
            input_example=X_train[:5],
            registered_model_name="customer-churn-model"
        )

        # Log dataset information
        mlflow.log_dict({
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "features": list(feature_names),
            "target_distribution": {
                "class_0": int(np.sum(y_train == 0)),
                "class_1": int(np.sum(y_train == 1))
            }
        }, "dataset_info.json")

        # Log training artifacts
        artifacts_dir = Path("training_artifacts")
        artifacts_dir.mkdir(exist_ok=True)

        # Save and log training history
        np.save(artifacts_dir / "train_history.npy", train_history)
        mlflow.log_artifacts(str(artifacts_dir), artifact_path="training")

        print(f"Run ID: {run.info.run_id}")
        return run.info.run_id

def get_git_commit():
    """Get current git commit hash."""
    import subprocess
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "HEAD"]
        ).decode().strip()
    except:
        return "unknown"

```


## Step 4: Compare Runs and Generate Reports

### Code Block 6

```python

# compare_runs.py
import mlflow
from mlflow.tracking import MlflowClient

client = MlflowClient()

def compare_experiments(experiment_name, metric_name="test_accuracy", top_n=5):
    """
    Compare top N runs from an experiment.
    """
    # Get experiment
    experiment = client.get_experiment_by_name(experiment_name)

    # Search runs sorted by metric
    runs = client.search_runs(
        experiment_ids=[experiment.experiment_id],
        filter_string="",
        order_by=[f"metrics.{metric_name} DESC"],
        max_results=top_n
    )

    print(f"\nTop {top_n} runs by {metric_name}:\n")
    print(f"{'Run ID':<36} {'Metric':<12} {'Parameters'}")
    print("-" * 80)

    for run in runs:
        run_id = run.info.run_id
        metric_value = run.data.metrics.get(metric_name, "N/A")
        params = run.data.params

        print(f"{run_id} {metric_value:<12.4f} {params}")

    return runs

def generate_comparison_report(run_ids, output_file="comparison_report.html"):
    """
    Generate HTML comparison report.
    """
    import pandas as pd

    data = []
    for run_id in run_ids:
        run = client.get_run(run_id)
        row = {
            "run_id": run_id[:8],
            **run.data.params,
            **run.data.metrics
        }
        data.append(row)

    df = pd.DataFrame(data)

    # Generate styled HTML report
    html = df.to_html(index=False, float_format=lambda x: f"{x:.4f}")

    with open(output_file, "w") as f:
        f.write(f"""
        <html>
        <head>
            <title>MLflow Experiment Comparison</title>
            <style>
                table {{ border-collapse: collapse; width: 100%; }}
                th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                th {{ background-color: #4CAF50; color: white; }}
                tr:nth-child(even) {{ background-color: #f2f2f2; }}
            </style>
        </head>
        <body>
            <h1>Experiment Comparison Report</h1>
            {html}
        </body>
        </html>
        """)

    print(f"Report saved to {output_file}")

# Usage
experiment_name = "customer-churn"
top_runs = compare_experiments(experiment_name, metric_name="test_f1", top_n=5)
top_run_ids = [run.info.run_id for run in top_runs]
generate_comparison_report(top_run_ids)

```


## Step 5: Configure Remote Artifact Storage

### Code Block 7

```python

# artifact_storage_config.py
import mlflow
import os

def configure_s3_backend():
    """
    Configure S3 for artifact storage.
    """
    # Set environment variables
    os.environ["AWS_ACCESS_KEY_ID"] = "your-access-key"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "your-secret-key"
    os.environ["AWS_DEFAULT_REGION"] = "us-west-2"

    # Set artifact location
    artifact_uri = "s3://mlflow-artifacts-bucket/experiments"

    # Create experiment with S3 artifacts
    experiment_id = mlflow.create_experiment(
        name="production-experiments",
        artifact_location=artifact_uri
    )

    return experiment_id

def configure_azure_backend():
    """
    Configure Azure Blob Storage for artifacts.
    """
    os.environ["AZURE_STORAGE_CONNECTION_STRING"] = "your-connection-string"

    artifact_uri = "wasbs://mlflow@storageaccount.blob.core.windows.net/artifacts"

    experiment_id = mlflow.create_experiment(
        name="azure-experiments",
        artifact_location=artifact_uri
    )

    return experiment_id

def test_artifact_upload(experiment_name):
    """
    Test artifact upload to remote storage.
    """
    mlflow.set_experiment(experiment_name)

    with mlflow.start_run(run_name="storage_test"):
        # Create test artifact
        test_file = "test_artifact.txt"
        with open(test_file, "w") as f:
            f.write("Test artifact content")

        # Log artifact
        mlflow.log_artifact(test_file)

        # Verify upload
        run = mlflow.active_run()
        artifact_uri = run.info.artifact_uri
        print(f"Artifacts stored at: {artifact_uri}")

        # Clean up
        os.remove(test_file)

    return artifact_uri

```

### Code Block 8

```yaml

# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: mlflow
      POSTGRES_USER: mlflow
      POSTGRES_PASSWORD: mlflow
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  mlflow:
    image: python:3.9-slim
    command: >
      bash -c "pip install mlflow boto3 psycopg2-binary &&
               mlflow server
               --backend-store-uri postgresql://mlflow:mlflow@postgres:5432/mlflow
               --default-artifact-root s3://mlflow-artifacts/experiments
               --host 0.0.0.0
               --port 5000"
    ports:
      - "5000:5000"
    environment:
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}
      AWS_DEFAULT_REGION: us-west-2
    depends_on:
      - postgres

volumes:
  postgres_data:

```


## Step 6: Implement Experiment Lifecycle Management

### Code Block 9

```python

# lifecycle_management.py
import mlflow
from mlflow.tracking import MlflowClient
from datetime import datetime, timedelta

client = MlflowClient()

def archive_old_experiments(days_old=90):
    """
    Archive experiments older than specified days.
    """
    cutoff_date = datetime.now() - timedelta(days=days_old)
    cutoff_timestamp = int(cutoff_date.timestamp() * 1000)

    experiments = client.search_experiments()

    for exp in experiments:
        # Get latest run in experiment
        runs = client.search_runs(
            experiment_ids=[exp.experiment_id],
            order_by=["start_time DESC"],
            max_results=1
        )

        if runs and runs[0].info.start_time < cutoff_timestamp:
            print(f"Archiving experiment: {exp.name}")
            client.delete_experiment(exp.experiment_id)

def cleanup_failed_runs(experiment_name):
    """
    Delete failed or incomplete runs.
    """
    experiment = client.get_experiment_by_name(experiment_name)

    runs = client.search_runs(
        experiment_ids=[experiment.experiment_id],
        filter_string="status = 'FAILED'"
    )

    for run in runs:
        print(f"Deleting failed run: {run.info.run_id}")
        client.delete_run(run.info.run_id)

def tag_best_runs(experiment_name, metric="test_accuracy", top_n=3):
    """
    Tag top N runs as best performers.
    """
    experiment = client.get_experiment_by_name(experiment_name)

    runs = client.search_runs(
        experiment_ids=[experiment.experiment_id],
        order_by=[f"metrics.{metric} DESC"],
        max_results=top_n
    )

    for i, run in enumerate(runs):
        client.set_tag(run.info.run_id, "rank", str(i + 1))
        client.set_tag(run.info.run_id, "best_performer", "true")
        print(f"Tagged run {run.info.run_id[:8]} as rank {i + 1}")

# Schedule with cron or Airflow
if __name__ == "__main__":
    archive_old_experiments(days_old=180)
    cleanup_failed_runs("customer-churn")
    tag_best_runs("customer-churn", metric="test_f1", top_n=5)

```
