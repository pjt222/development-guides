# Version ML Data — Extended Examples

Complete configuration files and code templates.


## Step 1: Initialize DVC in Git Repository

### Code Block 1

```bash

# Navigate to project root
cd /path/to/ml-project

# Initialize Git (if not already done)
git init
git add .
git commit -m "Initial commit"

# Initialize DVC
dvc init

# Verify DVC setup
ls .dvc/
# Should contain: .gitignore, config, config.local

# Review what DVC added to Git
git status
# Files: .dvc/.gitignore, .dvc/config, .dvcignore

# Commit DVC initialization
git add .dvc .dvcignore
git commit -m "Initialize DVC"

```


## Step 2: Configure Remote Storage Backend

### Code Block 2

```bash

# AWS S3
dvc remote add -d storage s3://my-dvc-bucket/ml-project
dvc remote modify storage region us-west-2

# Configure credentials (use IAM roles in production)
dvc remote modify storage access_key_id YOUR_ACCESS_KEY
dvc remote modify storage secret_access_key YOUR_SECRET_KEY

# Or use AWS CLI profile
dvc remote modify storage profile my-aws-profile

# Google Cloud Storage
dvc remote add -d storage gs://my-dvc-bucket/ml-project
dvc remote modify storage projectname my-gcp-project

# Azure Blob Storage
dvc remote add -d storage azure://mycontainer/path
dvc remote modify storage account_name mystorageaccount
dvc remote modify storage account_key YOUR_ACCOUNT_KEY

# SSH/SFTP
dvc remote add -d storage ssh://user@server:/path/to/storage
dvc remote modify storage password YOUR_PASSWORD
# Or use SSH key
dvc remote modify storage keyfile ~/.ssh/id_rsa

# Local shared drive (for teams on same network)
dvc remote add -d storage /mnt/shared/dvc-storage

# Commit remote configuration (credentials stored in .dvc/config.local, not tracked)
git add .dvc/config
git commit -m "Add DVC remote storage"

```


## Step 3: Version Datasets with DVC

### Code Block 3

```bash

# Add single file
dvc add data/raw/customers.csv

# Add directory (all files inside)
dvc add data/raw/

# DVC creates .dvc files (metadata)
ls data/raw/
# customers.csv  (original file)
# customers.csv.dvc  (metadata file tracked by Git)

# Review .dvc file content
cat data/raw/customers.csv.dvc
# Output:
# outs:
# - md5: a1b2c3d4e5f6g7h8i9j0
#   size: 1048576
#   path: customers.csv

# Git ignores actual data, tracks .dvc file
cat data/raw/.gitignore
# /customers.csv

# Commit .dvc files to Git
git add data/raw/customers.csv.dvc data/raw/.gitignore
git commit -m "Track customers dataset with DVC"

# Push data to remote storage
dvc push

# Verify upload
dvc status -r storage
# Output: Cache and remote 'storage' are in sync.

```

### Code Block 4

```python

# version_dataset.py
import pandas as pd
import subprocess
from datetime import datetime

def version_dataset(data_path, git_message=None):
    """
    Version dataset with DVC and Git.
    """
    # Add to DVC
    result = subprocess.run(
        ["dvc", "add", data_path],
        capture_output=True,
        text=True
    )

    if result.returncode != 0:
        raise Exception(f"DVC add failed: {result.stderr}")

    # Commit to Git
    dvc_file = f"{data_path}.dvc"
    gitignore = f"{data_path.rsplit('/', 1)[0]}/.gitignore"

    if git_message is None:
        git_message = f"Update dataset: {data_path} ({datetime.now().isoformat()})"

    subprocess.run(["git", "add", dvc_file, gitignore])
    subprocess.run(["git", "commit", "-m", git_message])

    # Push to DVC remote
    subprocess.run(["dvc", "push"])

    print(f"✓ Dataset versioned: {data_path}")

# Usage
df = pd.read_csv("data/raw/customers.csv")
# ... data processing ...
df.to_csv("data/processed/customers_clean.csv", index=False)

version_dataset(
    "data/processed/customers_clean.csv",
    git_message="Add cleaned customer dataset v1.0"
)

```


## Step 4: Build Reproducible Data Pipelines

### Code Block 5

```yaml

# dvc.yaml - Pipeline definition
stages:
  download_data:
    cmd: python scripts/download_data.py
    deps:
      - scripts/download_data.py
    outs:
      - data/raw/customers.csv
      - data/raw/transactions.csv

  preprocess:
    cmd: python scripts/preprocess.py
    deps:
      - scripts/preprocess.py
      - data/raw/customers.csv
      - data/raw/transactions.csv
    params:
      - preprocess.feature_engineering
      - preprocess.outlier_threshold
    outs:
      - data/processed/features.csv
      - data/processed/labels.csv

  split_data:
    cmd: python scripts/split_data.py
    deps:
      - scripts/split_data.py
      - data/processed/features.csv
      - data/processed/labels.csv
    params:
      - split.test_size
      - split.random_state
    outs:
      - data/splits/train.csv
      - data/splits/test.csv

  train_model:
    cmd: python scripts/train_model.py
    deps:
      - scripts/train_model.py
      - data/splits/train.csv
    params:
      - model.algorithm
      - model.hyperparameters
    outs:
      - models/model.pkl
    metrics:
      - metrics/train_metrics.json:
          cache: false

  evaluate_model:
    cmd: python scripts/evaluate_model.py
    deps:
      - scripts/evaluate_model.py
      - models/model.pkl
      - data/splits/test.csv
    metrics:
      - metrics/test_metrics.json:
          cache: false
    plots:
      - plots/confusion_matrix.png
      - plots/roc_curve.png

```

### Code Block 6

```bash

# Run entire pipeline
dvc repro

# DVC automatically:
# - Detects which stages need rerun (based on deps/params changes)
# - Executes stages in correct order
# - Caches outputs
# - Tracks metrics

# Run specific stage
dvc repro train_model

# Force rerun all stages
dvc repro --force

# View pipeline DAG
dvc dag

# Output (ASCII art):
#         +------------------+
#         | download_data    |
#         +------------------+
#                  *
#                  *
#                  *
#         +------------------+
#         | preprocess       |
#         +------------------+
#                  *
#                  *
#                  *
#         +------------------+
#         | split_data       |
#         +------------------+
#         **              **
#       **                  **
#     **                      ***
# +------------------+  +------------------+
# | train_model      |  | evaluate_model   |
# +------------------+  +------------------+

# View pipeline status
dvc status

# Compare metrics across runs
dvc metrics show

# Plot metrics
dvc plots show plots/confusion_matrix.png

```


## Step 5: Share and Reproduce Data Versions

### Code Block 7

```bash

# Team member clones repository
git clone https://github.com/team/ml-project.git
cd ml-project

# Install DVC
pip install dvc[s3]  # or appropriate backend

# Configure remote (if not in .dvc/config)
dvc remote add -d storage s3://my-dvc-bucket/ml-project

# Pull all data
dvc pull

# Now have exact same data as original developer
ls data/
# raw/  processed/  splits/

# Reproduce pipeline
dvc repro

# Compare metrics to original
dvc metrics diff HEAD~1

```

### Code Block 8

```bash

# View data version history
git log --oneline -- data/raw/customers.csv.dvc

# Checkout previous data version
git checkout abc123 -- data/raw/customers.csv.dvc

# Pull that version's data
dvc checkout

# Compare data versions
git diff HEAD~1 data/raw/customers.csv.dvc

# Output shows MD5 hash change:
# -  md5: a1b2c3d4...
# +  md5: e5f6g7h8...

# Revert to latest
git checkout HEAD -- data/raw/customers.csv.dvc
dvc checkout

```

### Code Block 9

```bash

# Create experiment branch
git checkout -b experiment/new-features

# Modify data pipeline
vim scripts/preprocess.py

# Add new features
dvc repro preprocess

# Commit changes
git add scripts/preprocess.py data/processed/features.csv.dvc
git commit -m "Add new feature engineering"
dvc push

# Compare with main branch
dvc metrics diff main

# Merge if successful
git checkout main
git merge experiment/new-features
dvc pull

```


## Step 6: Integrate with MLflow and CI/CD

### Code Block 10

```python

# train_with_mlflow.py
import mlflow
import dvc.api
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score

# Get DVC-tracked data path and version
data_path = "data/splits/train.csv"
data_url = dvc.api.get_url(data_path)
data_version = dvc.api.get_version(data_path)

# Load data
df = pd.read_csv(data_path)
X = df.drop("label", axis=1)
y = df["label"]

# Track with MLflow
with mlflow.start_run():
    # Log DVC metadata
    mlflow.log_param("data_version", data_version)
    mlflow.log_param("data_url", data_url)
    mlflow.set_tag("dvc_tracked", "true")

    # Log DVC params
    params = dvc.api.params_show()
    mlflow.log_params(params["model"]["hyperparameters"])

    # Train model
    model = RandomForestClassifier(**params["model"]["hyperparameters"])
    model.fit(X, y)

    # Evaluate
    predictions = model.predict(X)
    accuracy = accuracy_score(y, predictions)
    f1 = f1_score(y, predictions)

    mlflow.log_metric("train_accuracy", accuracy)
    mlflow.log_metric("train_f1", f1)

    # Log model
    mlflow.sklearn.log_model(model, "model")

    print(f"✓ Training completed with data version {data_version}")

```

### Code Block 11

```yaml

# .github/workflows/ml-pipeline.yml
name: ML Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  run-pipeline:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'

      - name: Install dependencies
        run: |
          pip install dvc[s3] mlflow scikit-learn pandas

      - name: Configure DVC remote
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        run: |
          dvc remote modify storage access_key_id $AWS_ACCESS_KEY_ID
          dvc remote modify storage secret_access_key $AWS_SECRET_ACCESS_KEY

      - name: Pull data
        run: dvc pull

      - name: Reproduce pipeline
        run: dvc repro

      - name: Check metrics
        run: |
          dvc metrics show
          # Fail if metrics below threshold
          python scripts/validate_metrics.py

      - name: Push results
        if: github.ref == 'refs/heads/main'
        run: |
          dvc push
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add dvc.lock metrics/
          git commit -m "Update pipeline results [skip ci]"
          git push

```
