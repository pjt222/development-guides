# Orchestrate ML Pipeline — Extended Examples

Complete configuration files and code templates.


## Step 1: Choose and Install Orchestration Framework

### Code Block 1

```bash

# Option 1: Prefect (modern, Pythonic, simpler)
pip install prefect
pip install prefect-aws prefect-dask prefect-docker

# Start Prefect server (local development)
prefect server start

# Or use Prefect Cloud (managed)
prefect cloud login

# Option 2: Apache Airflow (mature, widely adopted)
pip install apache-airflow[postgres,celery,redis]

# Initialize Airflow database
airflow db init

# Create admin user
airflow users create \
  --username admin \
  --firstname Admin \
  --lastname User \
  --role Admin \
  --email admin@example.com

# Start Airflow webserver and scheduler
airflow webserver --port 8080 &
airflow scheduler &

```

### Code Block 2

```yaml

# docker-compose.airflow.yml
version: '3.8'

x-airflow-common: &airflow-common
  image: apache/airflow:2.8.0
  environment:
    AIRFLOW__CORE__EXECUTOR: CeleryExecutor
    AIRFLOW__DATABASE__SQL_ALCHEMY_CONN: postgresql+psycopg2://airflow:airflow@postgres/airflow
    AIRFLOW__CELERY__RESULT_BACKEND: db+postgresql://airflow:airflow@postgres/airflow
    AIRFLOW__CELERY__BROKER_URL: redis://:@redis:6379/0
    AIRFLOW__CORE__FERNET_KEY: ''
    AIRFLOW__CORE__DAGS_ARE_PAUSED_AT_CREATION: 'true'
    AIRFLOW__CORE__LOAD_EXAMPLES: 'false'
  volumes:
    - ./dags:/opt/airflow/dags
    - ./logs:/opt/airflow/logs
    - ./plugins:/opt/airflow/plugins
  depends_on:
    - postgres
    - redis

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_USER: airflow
      POSTGRES_PASSWORD: airflow
      POSTGRES_DB: airflow
    volumes:
      - postgres-db-volume:/var/lib/postgresql/data

  redis:
    image: redis:7

  airflow-webserver:
    <<: *airflow-common
    command: webserver
    ports:
      - 8080:8080

  airflow-scheduler:
    <<: *airflow-common
    command: scheduler

  airflow-worker:
    <<: *airflow-common
    command: celery worker

volumes:
  postgres-db-volume:

```


## Step 2: Build ML Pipeline with Prefect

### Code Block 3

```python

# prefect_ml_pipeline.py
from prefect import flow, task
from prefect.tasks import task_input_hash
from datetime import timedelta
import pandas as pd
import mlflow
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score
import dvc.api

@task(cache_key_fn=task_input_hash, cache_expiration=timedelta(hours=1))
def ingest_data(data_source: str) -> pd.DataFrame:
    """
    Ingest data from source (DVC, database, API, etc.)
    """
    print(f"Ingesting data from {data_source}")

    # Option 1: DVC-tracked data
    with dvc.api.open(data_source) as f:
        df = pd.read_csv(f)

    # Option 2: Database query
    # df = pd.read_sql(query, connection)

    print(f"✓ Ingested {len(df)} rows")
    return df

@task(retries=3, retry_delay_seconds=60)
def preprocess_data(df: pd.DataFrame, params: dict) -> tuple:
    """
    Preprocess and feature engineering.
    """
    print("Preprocessing data...")

    # Feature engineering
    df = df.dropna()
    df = df[df['amount'] > 0]  # Remove invalid transactions

    # Handle outliers
    if params.get('remove_outliers'):
        q_low = df['amount'].quantile(0.01)
        q_high = df['amount'].quantile(0.99)
        df = df[(df['amount'] > q_low) & (df['amount'] < q_high)]

    # Split features and labels
    X = df.drop('label', axis=1)
    y = df['label']

    print(f"✓ Preprocessed to {len(X)} samples, {len(X.columns)} features")
    return X, y

@task
def split_data(X: pd.DataFrame, y: pd.Series, test_size: float = 0.2) -> tuple:
    """
    Split into train/test sets.
    """
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=42, stratify=y
    )

    print(f"✓ Split: {len(X_train)} train, {len(X_test)} test")
    return X_train, X_test, y_train, y_test

@task(timeout_seconds=3600)
def train_model(X_train: pd.DataFrame, y_train: pd.Series, params: dict) -> object:
    """
    Train ML model with MLflow tracking.
    """
    print("Training model...")

    mlflow.set_tracking_uri("http://mlflow-server:5000")
    mlflow.set_experiment("customer-churn-pipeline")

    with mlflow.start_run():
        # Log parameters
        mlflow.log_params(params)

        # Train model
        model = RandomForestClassifier(**params)
        model.fit(X_train, y_train)

        # Log model
        mlflow.sklearn.log_model(model, "model")

        print("✓ Model trained")
        return model

@task
def evaluate_model(
    model: object,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    threshold: float = 0.8
) -> dict:
    """
    Evaluate model and validate against threshold.
    """
    print("Evaluating model...")

    y_pred = model.predict(X_test)

    metrics = {
        'accuracy': accuracy_score(y_test, y_pred),
        'f1': f1_score(y_test, y_pred, average='weighted')
    }

    # Log metrics to MLflow
    mlflow.log_metrics(metrics)

    print(f"✓ Metrics: accuracy={metrics['accuracy']:.3f}, f1={metrics['f1']:.3f}")

    # Validate against threshold
    if metrics['accuracy'] < threshold:
        raise ValueError(f"Model accuracy {metrics['accuracy']:.3f} below threshold {threshold}")

    return metrics

@task
def register_model(model: object, metrics: dict, model_name: str) -> str:
    """
    Register model in MLflow Model Registry.
    """
    print("Registering model...")

    # Get current run
    run = mlflow.active_run()
    run_id = run.info.run_id

    # Register model
    model_uri = f"runs:/{run_id}/model"
    result = mlflow.register_model(
        model_uri=model_uri,
        name=model_name
    )

    version = result.version
    print(f"✓ Registered {model_name} version {version}")

    return version

@task
def deploy_model(model_name: str, version: str):
    """
    Deploy model to production (transition to Production stage).
    """
    print(f"Deploying {model_name} v{version}...")

    from mlflow.tracking import MlflowClient
    client = MlflowClient()

    # Transition to Production
    client.transition_model_version_stage(
        name=model_name,
        version=version,
        stage="Production",
        archive_existing_versions=True
    )

    print(f"✓ Deployed to Production")

@flow(name="ml-training-pipeline", log_prints=True)
def ml_training_pipeline(
    data_source: str = "data/raw/customers.csv",
    model_name: str = "customer-churn-model"
):
    """
    End-to-end ML training pipeline.
    """
    # Pipeline parameters
    params = {
        'n_estimators': 100,
        'max_depth': 10,
        'min_samples_split': 5,
        'remove_outliers': True
    }

    # Execute pipeline stages
    df = ingest_data(data_source)
    X, y = preprocess_data(df, params)
    X_train, X_test, y_train, y_test = split_data(X, y)
    model = train_model(X_train, y_train, params)
    metrics = evaluate_model(model, X_test, y_test, threshold=0.85)
    version = register_model(model, metrics, model_name)
    deploy_model(model_name, version)

    return {"model_version": version, "metrics": metrics}

if __name__ == "__main__":
    # Run pipeline
    result = ml_training_pipeline()
    print(f"Pipeline completed: {result}")

```

### Code Block 4

```python

# deploy_prefect.py
from prefect.deployments import Deployment
from prefect.server.schemas.schedules import CronSchedule
from prefect_ml_pipeline import ml_training_pipeline

# Create deployment with schedule
deployment = Deployment.build_from_flow(
    flow=ml_training_pipeline,
    name="production-pipeline",
    parameters={
        "data_source": "data/raw/customers.csv",
        "model_name": "customer-churn-model"
    },
    schedule=CronSchedule(cron="0 2 * * 0"),  # Weekly at 2 AM Sunday
    work_pool_name="default",
    tags=["ml", "production", "churn-prediction"]
)

deployment.apply()
print("✓ Deployment created")

```


## Step 3: Build ML Pipeline with Airflow

### Code Block 5

```python

# dags/ml_training_dag.py
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.providers.docker.operators.docker import DockerOperator
from airflow.utils.dates import days_ago
from datetime import datetime, timedelta
import mlflow
import pandas as pd

default_args = {
    'owner': 'data-science-team',
    'depends_on_past': False,
    'email': ['alerts@company.com'],
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 3,
    'retry_delay': timedelta(minutes=5),
    'execution_timeout': timedelta(hours=2),
}

dag = DAG(
    'ml_training_pipeline',
    default_args=default_args,
    description='End-to-end ML training pipeline',
    schedule_interval='0 2 * * 0',  # Weekly at 2 AM Sunday
    start_date=days_ago(1),
    catchup=False,
    tags=['ml', 'production', 'churn'],
)

def ingest_data(**context):
    """Ingest data task."""
    import dvc.api
    with dvc.api.open('data/raw/customers.csv') as f:
        df = pd.read_csv(f)

    # Push to XCom for downstream tasks
    context['ti'].xcom_push(key='data_path', value='/tmp/customers.csv')
    df.to_csv('/tmp/customers.csv', index=False)

    return len(df)

def preprocess_data(**context):
    """Preprocess data task."""
    # Pull from XCom
    data_path = context['ti'].xcom_pull(key='data_path', task_ids='ingest_data')

    df = pd.read_csv(data_path)
    df = df.dropna()

    # Feature engineering
    X = df.drop('label', axis=1)
    y = df['label']

    X.to_csv('/tmp/features.csv', index=False)
    y.to_csv('/tmp/labels.csv', index=False)

    context['ti'].xcom_push(key='features_path', value='/tmp/features.csv')
    context['ti'].xcom_push(key='labels_path', value='/tmp/labels.csv')

    return len(X)

def train_model(**context):
    """Train model task."""
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.model_selection import train_test_split

    # Load data
    X = pd.read_csv(context['ti'].xcom_pull(key='features_path'))
    y = pd.read_csv(context['ti'].xcom_pull(key='labels_path')).values.ravel()

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

    # MLflow tracking
    mlflow.set_tracking_uri("http://mlflow-server:5000")
    with mlflow.start_run():
        params = {'n_estimators': 100, 'max_depth': 10}
        mlflow.log_params(params)

        model = RandomForestClassifier(**params)
        model.fit(X_train, y_train)

        # Save model
        import joblib
        model_path = '/tmp/model.pkl'
        joblib.dump(model, model_path)

        mlflow.sklearn.log_model(model, "model")

        # Push model path to XCom
        context['ti'].xcom_push(key='model_path', value=model_path)
        context['ti'].xcom_push(key='test_data', value=(X_test, y_test))

        run_id = mlflow.active_run().info.run_id
        context['ti'].xcom_push(key='run_id', value=run_id)

    return run_id

def evaluate_model(**context):
    """Evaluate model task."""
    import joblib
    from sklearn.metrics import accuracy_score, f1_score

    # Load model and test data
    model_path = context['ti'].xcom_pull(key='model_path')
    model = joblib.load(model_path)

    X_test, y_test = context['ti'].xcom_pull(key='test_data')

    # Evaluate
    y_pred = model.predict(X_test)
    metrics = {
        'accuracy': accuracy_score(y_test, y_pred),
        'f1': f1_score(y_test, y_pred, average='weighted')
    }

    # Log to MLflow
    mlflow.log_metrics(metrics)

    # Validate threshold
    if metrics['accuracy'] < 0.85:
        raise ValueError(f"Model accuracy {metrics['accuracy']} below threshold")

    context['ti'].xcom_push(key='metrics', value=metrics)
    return metrics

def register_and_deploy(**context):
    """Register model and deploy to production."""
    run_id = context['ti'].xcom_pull(key='run_id')
    metrics = context['ti'].xcom_pull(key='metrics')

    model_uri = f"runs:/{run_id}/model"
    result = mlflow.register_model(model_uri, "customer-churn-model")

    # Transition to Production
    from mlflow.tracking import MlflowClient
    client = MlflowClient()
    client.transition_model_version_stage(
        name="customer-churn-model",
        version=result.version,
        stage="Production",
        archive_existing_versions=True
    )

    return result.version

# Define tasks
ingest = PythonOperator(
    task_id='ingest_data',
    python_callable=ingest_data,
    dag=dag,
)

preprocess = PythonOperator(
    task_id='preprocess_data',
    python_callable=preprocess_data,
    dag=dag,
)

train = PythonOperator(
    task_id='train_model',
    python_callable=train_model,
    dag=dag,
)

evaluate = PythonOperator(
    task_id='evaluate_model',
    python_callable=evaluate_model,
    dag=dag,
)

deploy = PythonOperator(
    task_id='register_and_deploy',
    python_callable=register_and_deploy,
    dag=dag,
)

# Define dependencies
ingest >> preprocess >> train >> evaluate >> deploy

```


## Step 4: Implement Advanced Features

### Code Block 6

```python

# advanced_pipeline.py (Prefect)
from prefect import flow, task
from prefect.task_runners import DaskTaskRunner, ConcurrentTaskRunner
import time

@task
def process_shard(shard_id: int, data: list) -> dict:
    """Process data shard in parallel."""
    print(f"Processing shard {shard_id}...")
    time.sleep(2)  # Simulate processing
    return {"shard_id": shard_id, "count": len(data)}

@flow(task_runner=DaskTaskRunner())
def parallel_processing_flow(data: list, num_shards: int = 4):
    """Process data in parallel using Dask."""
    # Split data into shards
    shard_size = len(data) // num_shards
    shards = [data[i:i+shard_size] for i in range(0, len(data), shard_size)]

    # Process shards in parallel
    results = []
    for i, shard in enumerate(shards):
        result = process_shard.submit(i, shard)  # .submit() for parallel execution
        results.append(result)

    # Wait for all results
    final_results = [r.result() for r in results]

    return final_results

# Conditional branching
@task
def check_data_quality(df) -> bool:
    """Check if data quality is acceptable."""
    missing_pct = df.isnull().sum().sum() / (df.shape[0] * df.shape[1])
    return missing_pct < 0.05

@task
def handle_poor_quality():
    """Handle poor data quality case."""
    print("Data quality too low, sending alert...")
    # Send alert, skip training, etc.

@task
def proceed_with_training():
    """Proceed with normal training."""
    print("Data quality acceptable, proceeding...")

@flow
def conditional_flow():
    """Flow with conditional branching."""
    df = ingest_data("data/raw/customers.csv")

    quality_ok = check_data_quality(df)

    if quality_ok:
        proceed_with_training()
    else:
        handle_poor_quality()

```

### Code Block 7

```python

# Airflow branching with BranchPythonOperator
from airflow.operators.python import BranchPythonOperator

def check_data_quality(**context):
    """Decide which branch to take."""
    data_path = context['ti'].xcom_pull(key='data_path')
    df = pd.read_csv(data_path)

    missing_pct = df.isnull().sum().sum() / (df.shape[0] * df.shape[1])

    if missing_pct < 0.05:
        return 'proceed_with_training'  # Task ID to execute
    else:
        return 'handle_poor_quality'

branch_task = BranchPythonOperator(
    task_id='check_quality',
    python_callable=check_data_quality,
    dag=dag,
)

proceed_task = PythonOperator(
    task_id='proceed_with_training',
    python_callable=lambda: print("Proceeding with training"),
    dag=dag,
)

alert_task = PythonOperator(
    task_id='handle_poor_quality',
    python_callable=lambda: print("Sending quality alert"),
    dag=dag,
)

ingest >> branch_task >> [proceed_task, alert_task]

```


## Step 5: Integrate Monitoring and Alerting

### Code Block 8

```python

# monitoring_integration.py
from prefect.blocks.notifications import SlackWebhook
from prefect import flow, task, get_run_logger
from prefect.context import FlowRunContext

@task(on_failure=[notify_failure])
def critical_task():
    """Task with failure notification."""
    raise Exception("Something went wrong!")

def notify_failure(task, task_run, state):
    """Send notification on task failure."""
    slack_webhook = SlackWebhook.load("ml-alerts")
    slack_webhook.notify(
        subject=f"Task Failed: {task.name}",
        body=f"Task {task.name} failed with state: {state}"
    )

@flow(on_completion=[send_completion_notification])
def monitored_pipeline():
    """Pipeline with monitoring."""
    logger = get_run_logger()

    logger.info("Pipeline started")

    # Track custom metrics
    from prefect.variables import Variable
    run_count = Variable.get("pipeline_run_count", default=0)
    Variable.set("pipeline_run_count", run_count + 1)

    # Execute pipeline
    try:
        result = ml_training_pipeline()
        logger.info(f"Pipeline succeeded: {result}")
    except Exception as e:
        logger.error(f"Pipeline failed: {e}")
        raise

def send_completion_notification(flow, flow_run, state):
    """Send notification on flow completion."""
    if state.is_completed():
        # Send success notification
        pass
    elif state.is_failed():
        # Send failure notification
        pass

```

### Code Block 9

```python

# Airflow SLA and monitoring
from airflow.sensors.base import BaseSensorOperator
from airflow.utils.decorators import apply_defaults

default_args = {
    'sla': timedelta(hours=4),  # Alert if task exceeds 4 hours
    'on_failure_callback': slack_alert_failure,
    'on_success_callback': slack_alert_success,
}

def slack_alert_failure(context):
    """Send Slack alert on failure."""
    from slack_sdk import WebClient
    slack = WebClient(token="YOUR_SLACK_TOKEN")

    task_instance = context.get('task_instance')
    dag_id = context.get('dag').dag_id
    task_id = task_instance.task_id

    slack.chat_postMessage(
        channel='#ml-alerts',
        text=f"❌ Task Failed: {dag_id}.{task_id}\nLog: {task_instance.log_url}"
    )

# Add to DAG
dag = DAG(
    'ml_training_pipeline',
    default_args=default_args,
    ...
)

```


## Step 6: Implement CI/CD for Pipelines

### Code Block 10

```yaml

# .github/workflows/deploy-pipeline.yml
name: Deploy ML Pipeline

on:
  push:
    branches: [main]
    paths:
      - 'pipelines/**'
      - 'dags/**'

jobs:
  test-pipeline:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'

      - name: Install dependencies
        run: |
          pip install prefect mlflow scikit-learn pytest

      - name: Run pipeline tests
        run: |
          pytest tests/test_pipeline.py

      - name: Validate pipeline definition
        run: |
          python -c "from prefect_ml_pipeline import ml_training_pipeline; print('✓ Pipeline valid')"

  deploy-prefect:
    needs: test-pipeline
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'

      - name: Install Prefect
        run: pip install prefect

      - name: Authenticate with Prefect Cloud
        env:
          PREFECT_API_KEY: ${{ secrets.PREFECT_API_KEY }}
        run: |
          prefect cloud login --key $PREFECT_API_KEY

      - name: Deploy pipeline
        run: |
          python deploy_prefect.py

      - name: Notify team
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "ML Pipeline deployed to production"
            }

```
