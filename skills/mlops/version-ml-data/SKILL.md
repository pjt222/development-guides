---
name: version-ml-data
description: >
  Version machine learning datasets using DVC (Data Version Control) with remote
  storage backends, build reproducible data pipelines with dependency tracking,
  integrate with Git workflows, and ensure data lineage for model reproducibility.
license: MIT
allowed-tools: Read Write Edit Bash Grep Glob
metadata:
  author: Philipp Thoss
  version: "1.0"
  domain: mlops
  complexity: intermediate
  language: multi
  tags: dvc, data-versioning, reproducibility, remote-storage, pipelines
---

# Version ML Data

Implement data version control for machine learning datasets to ensure reproducibility and track data lineage.

## When to Use

- Versioning large datasets that don't fit in Git
- Tracking data changes alongside code changes
- Ensuring reproducibility of ML experiments
- Building automated data pipelines with dependency tracking
- Sharing datasets across team members
- Rolling back to previous data versions
- Auditing data lineage for compliance
- Managing multiple dataset variants (train/test splits, feature sets)

## Inputs

- **Required**: Git repository for metadata tracking
- **Required**: DVC installation (`pip install dvc`)
- **Required**: Raw data files or directories to version
- **Optional**: Remote storage backend (S3, Azure Blob, GCS, SSH, local)
- **Optional**: Data processing scripts for pipeline automation
- **Optional**: CI/CD integration for automated pipeline execution

## Procedure

### Step 1: Initialize DVC in Git Repository

Set up DVC for data versioning alongside code versioning.

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

Configure DVC settings:

```bash
# Set analytics opt-out (optional)
dvc config core.analytics false

# Configure autostage (automatically git add .dvc files)
dvc config core.autostage true

# Set default remote name
dvc config core.remote storage

# Commit configuration
git add .dvc/config
git commit -m "Configure DVC settings"
```

**Expected:** `.dvc/` directory created with config files, `.dvcignore` file present, DVC files tracked by Git, large data files not in Git staging area.

**On failure:** Verify Git repository initialized (`git status`), check DVC installation (`dvc version`), ensure write permissions in project directory, check for conflicting `.dvc/` directory from previous setup, verify Python environment active.

### Step 2: Configure Remote Storage Backend

Set up remote storage for data sharing and backup.

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

Test remote connection:

```bash
# List remote storage contents
dvc remote list storage

# Test write access
echo "test" > test.txt
dvc add test.txt
dvc push
rm test.txt test.txt.dvc .dvc/cache -rf

# Test read access
dvc pull

# Clean up test
rm test.txt test.txt.dvc
git checkout .
```

**Expected:** Remote storage configured and accessible, credentials stored securely in `.dvc/config.local` (git-ignored), test push/pull succeeds, remote storage shows uploaded cache files.

**On failure:** Verify cloud credentials (`aws s3 ls` or equivalent CLI), check bucket/container exists and is accessible, ensure IAM permissions for read/write, verify network connectivity to remote, check firewall rules, test SSH key authentication for SSH remotes, verify storage path has write permissions.

### Step 3: Version Datasets with DVC

Add datasets to DVC tracking and push to remote storage.

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

Version management:

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

**Expected:** `.dvc` metadata files created and committed to Git, original data files git-ignored automatically, `dvc push` uploads data to remote storage, `.dvc/cache` contains data hash, remote storage has cached data files.

**On failure:** Check DVC remote configured (`dvc remote list`), verify write permissions in data directory, ensure sufficient disk space for cache, check network connectivity for push, verify no special characters in file paths, check for large file warnings from Git.

### Step 4: Build Reproducible Data Pipelines

Create DVC pipelines for automated, dependency-tracked data processing.

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

Parameters file:

```yaml
# params.yaml
preprocess:
  feature_engineering: true
  outlier_threshold: 3.0

split:
  test_size: 0.2
  random_state: 42

model:
  algorithm: random_forest
  hyperparameters:
    n_estimators: 100
    max_depth: 10
    min_samples_split: 5
```

Run pipeline:

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

**Expected:** DVC pipeline executes in correct dependency order, only changed stages rerun, outputs cached efficiently, metrics tracked automatically, Git commits include `dvc.yaml` and `dvc.lock`.

**On failure:** Check script paths exist and are executable, verify dependencies specified correctly, ensure params.yaml keys match script usage, check for circular dependencies in pipeline, verify output paths writable, inspect script error messages in stderr, check Python environment has required packages.

### Step 5: Share and Reproduce Data Versions

Enable team members to reproduce exact data versions.

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

Switch between data versions:

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

Branching workflow:

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

**Expected:** `git clone` + `dvc pull` reproduces exact environment, data versions match across team, experiments isolated in branches, metrics comparable across versions.

**On failure:** Verify remote access configured correctly, check credentials for new team members, ensure all .dvc files committed to Git, verify `dvc.lock` tracked by Git (pins exact versions), check network bandwidth for large pulls, verify storage backend has all referenced cache files.

### Step 6: Integrate with MLflow and CI/CD

Connect DVC data versioning with experiment tracking and automation.

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

GitHub Actions CI/CD:

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

**Expected:** MLflow logs DVC data versions with runs, CI/CD automatically pulls data and runs pipeline, metrics validated before deployment, reproducibility enforced by CI.

**On failure:** Check secrets configured in GitHub repository settings, verify DVC remote accessible from CI runners, ensure Git credentials configured for push, check Python dependencies installed, verify metrics validation logic, inspect CI logs for DVC/MLflow errors.

## Validation

- [ ] DVC initialized in Git repository
- [ ] Remote storage configured and accessible
- [ ] Datasets versioned and pushed to remote
- [ ] `.dvc` files committed to Git
- [ ] Large data files git-ignored automatically
- [ ] DVC pipeline executes successfully
- [ ] Team members can reproduce data with `dvc pull`
- [ ] Data versions switchable via Git checkout
- [ ] Metrics tracked across pipeline runs
- [ ] Integration with MLflow working
- [ ] CI/CD pipeline reproduces results

## Common Pitfalls

- **Committing large files to Git**: Forgot to run `dvc add` first - always use DVC for large files (>10MB), check `.gitignore`
- **Missing remote configuration**: `dvc push` fails because no remote - configure remote before sharing, test with `dvc remote list`
- **Lost data versions**: Deleted `.dvc/cache` without pushing - always `dvc push` before cleaning cache
- **Inconsistent environments**: Different Python/package versions - use virtual environments, pin dependencies in `requirements.txt`
- **Broken pipelines**: Changed script without updating `dvc.yaml` - keep pipeline definitions in sync with code
- **Slow pipeline**: Rerunning unchanged stages - DVC caches by default, check `dvc status` to diagnose
- **Merge conflicts**: `.dvc` files conflict during merges - resolve like code conflicts, use `dvc checkout` after resolution
- **Large pull times**: Pulling all data for small experiments - use `dvc pull <specific.dvc>` for selective pulls
- **Credential leaks**: Committing `.dvc/config.local` - keep credentials in `config.local` (git-ignored), not `config`
- **No data lineage**: Not tracking preprocessing steps - use DVC pipelines to track all transformations

## Related Skills

- `track-ml-experiments` - Integrate DVC versions with MLflow experiment tracking
- `orchestrate-ml-pipeline` - Combine DVC pipelines with Airflow/Prefect orchestration
- `build-feature-store` - Version raw data sources for feature engineering
- `serialize-data-formats` - Choose efficient formats for DVC-tracked datasets
- `design-serialization-schema` - Design schemas for versioned data files
