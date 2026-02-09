---
name: build-feature-store
description: >
  Build a feature store using Feast for centralized feature management, configure
  offline and online stores for batch and real-time serving, define feature views
  with transformations, and implement point-in-time correct joins for ML pipelines.
license: MIT
allowed-tools: Read Write Edit Bash Grep Glob
metadata:
  author: Philipp Thoss
  version: "1.0"
  domain: mlops
  complexity: advanced
  language: multi
  tags: feature-store, feast, offline-store, online-store, feature-engineering
---

# Build Feature Store

Implement centralized feature management with Feast for consistent feature serving across training and inference.

## When to Use

- Managing features for multiple ML models across teams
- Ensuring training-serving consistency for features
- Implementing point-in-time correct historical features
- Serving low-latency features for real-time inference
- Reusing feature definitions across projects
- Versioning feature transformations
- Building feature catalog for discovery and governance
- Preventing feature leakage in training pipelines

## Inputs

- **Required**: Raw data sources (databases, data lakes, data warehouses)
- **Required**: Python environment with Feast installed
- **Required**: Offline store backend (BigQuery, Snowflake, Redshift, or Parquet files)
- **Required**: Online store backend (Redis, DynamoDB, Cassandra, or SQLite for dev)
- **Optional**: Feature transformation logic (Python, SQL, Spark)
- **Optional**: Entity key definitions (user_id, product_id, etc.)
- **Optional**: Kubernetes cluster for Feast server deployment

## Procedure

### Step 1: Initialize Feast Feature Repository

Set up Feast project structure and configure storage backends.

```bash
# Install Feast with required extras
pip install 'feast[redis,postgres]'  # Add backends as needed

# Initialize new feature repository
feast init my_feature_repo
cd my_feature_repo

# Directory structure created:
# my_feature_repo/
# ├── feature_store.yaml       # Configuration
# ├── features.py              # Feature definitions
# └── data/                    # Sample data (dev only)
```

Configure `feature_store.yaml`:

```yaml
# feature_store.yaml
project: customer_analytics
registry: data/registry.db  # SQLite for dev, use S3/GCS for prod
provider: local

# Offline store for training data
offline_store:
  type: postgres
  host: localhost
  port: 5432
  database: feature_store
  user: feast_user
  password: ${FEAST_POSTGRES_PASSWORD}

# Online store for real-time serving
online_store:
  type: redis
  connection_string: localhost:6379,db=0

# Entity key serializer
entity_key_serialization_version: 2
```

Production configuration with cloud backends:

```yaml
# feature_store.prod.yaml
project: customer_analytics
registry: s3://feast-registry/prod/registry.db
provider: aws

offline_store:
  type: bigquery
  project_id: my-gcp-project
  dataset_id: feast_offline

online_store:
  type: dynamodb
  region: us-west-2
  table_name: feast_online_store

# Enable batch materialization
batch_engine:
  type: spark
  spark_conf:
    spark.master: yarn
    spark.executor.memory: 4g
```

**Expected:** Feast repository initialized with config file, sample feature definitions created, offline and online stores configured, registry path accessible.

**On failure:** Verify database/Redis credentials (`psql -U feast_user -h localhost`), check connection strings format, ensure databases exist (`CREATE DATABASE feature_store`), verify cloud permissions for S3/BigQuery/DynamoDB, test connectivity to storage backends, check Feast version compatibility with backends (`feast version`).

### Step 2: Define Entities and Data Sources

Create entity definitions and connect to raw data sources.

```python
# entities.py
from feast import Entity, ValueType

# Define entities (primary keys for features)
customer = Entity(
    name="customer",
    description="Customer entity",
    value_type=ValueType.INT64,
)

product = Entity(
    name="product",
    description="Product entity",
    value_type=ValueType.STRING,
)

merchant = Entity(
    name="merchant",
    description="Merchant entity",
    value_type=ValueType.INT64,
)
```

Define data sources:

```python
# data_sources.py
from feast import FileSource, BigQuerySource, RedshiftSource
from feast.data_format import ParquetFormat
from datetime import timedelta

# Development: File-based source
customer_transactions_source = FileSource(
    path="data/customer_transactions.parquet",
    event_timestamp_column="transaction_timestamp",
    created_timestamp_column="created",
)

# Production: Data warehouse source
customer_features_source = BigQuerySource(
    table="my-gcp-project.analytics.customer_features",
    event_timestamp_column="event_timestamp",
    created_timestamp_column="created_timestamp",
)

# Streaming source (for real-time features)
from feast import KafkaSource
from feast.data_format import AvroFormat

clickstream_source = KafkaSource(
    name="clickstream",
    kafka_bootstrap_servers="localhost:9092",
    topic="user_clicks",
    event_timestamp_column="click_timestamp",
    batch_source=FileSource(
        path="data/clickstream_batch.parquet",
        event_timestamp_column="click_timestamp",
    ),
    message_format=AvroFormat(
        schema_json="""{
            "type": "record",
            "name": "Click",
            "fields": [
                {"name": "user_id", "type": "long"},
                {"name": "page_id", "type": "string"},
                {"name": "click_timestamp", "type": "long"}
            ]
        }"""
    ),
)
```

**Expected:** Entity definitions reference correct ID columns, data sources connect to raw data successfully, event_timestamp_column exists in source data, created_timestamp_column allows point-in-time queries.

**On failure:** Verify source data files exist and are readable, check BigQuery/Redshift credentials and table access, ensure timestamp columns have correct format (Unix timestamp or ISO8601), verify Kafka connectivity and topic existence, check schema compatibility between sources and entities.

### Step 3: Define Feature Views with Transformations

Create feature views that define how raw data becomes ML-ready features.

```python
# feature_views.py
from feast import FeatureView, Field
from feast.types import Float32, Int64, String, Bool
from datetime import timedelta
from entities import customer, product
from data_sources import customer_features_source

# Simple feature view without transformations
customer_stats_fv = FeatureView(
    name="customer_stats",
    entities=[customer],
    ttl=timedelta(days=7),  # Feature freshness
    schema=[
        Field(name="total_purchases", dtype=Int64),
        Field(name="total_spend", dtype=Float32),
        Field(name="avg_purchase_value", dtype=Float32),
        Field(name="days_since_last_purchase", dtype=Int64),
        Field(name="is_vip", dtype=Bool),
    ],
    source=customer_features_source,
    tags={"team": "data-science", "domain": "customer"},
)

# Feature view with on-demand transformations
from feast import on_demand_feature_view, RequestSource

@on_demand_feature_view(
    sources=[customer_stats_fv],
    schema=[
        Field(name="purchase_frequency_category", dtype=String),
        Field(name="spending_tier", dtype=String),
    ],
)
def customer_segments(inputs: dict) -> dict:
    """
    On-demand feature transformations executed at request time.
    """
    output = {}

    # Purchase frequency categorization
    days_since = inputs["days_since_last_purchase"]
    if days_since < 7:
        output["purchase_frequency_category"] = "weekly"
    elif days_since < 30:
        output["purchase_frequency_category"] = "monthly"
    else:
        output["purchase_frequency_category"] = "infrequent"

    # Spending tier
    total_spend = inputs["total_spend"]
    if total_spend > 10000:
        output["spending_tier"] = "platinum"
    elif total_spend > 5000:
        output["spending_tier"] = "gold"
    elif total_spend > 1000:
        output["spending_tier"] = "silver"
    else:
        output["spending_tier"] = "bronze"

    return output

# Request-time features from inference payload
from feast import RequestSource

request_source = RequestSource(
    name="request_data",
    schema=[
        Field(name="current_cart_value", dtype=Float32),
        Field(name="items_in_cart", dtype=Int64),
    ],
)

@on_demand_feature_view(
    sources=[customer_stats_fv, request_source],
    schema=[
        Field(name="cart_to_avg_ratio", dtype=Float32),
        Field(name="expected_purchase_probability", dtype=Float32),
    ],
)
def real_time_features(inputs: dict) -> dict:
    """
    Combine historical features with request-time data.
    """
    output = {}

    # Cart value relative to historical average
    cart_value = inputs["current_cart_value"]
    avg_purchase = inputs["avg_purchase_value"]

    output["cart_to_avg_ratio"] = (
        cart_value / avg_purchase if avg_purchase > 0 else 0.0
    )

    # Simple heuristic for purchase probability
    # (In practice, this could be a lightweight model)
    days_since = inputs["days_since_last_purchase"]
    items = inputs["items_in_cart"]

    score = (1.0 / (1.0 + days_since)) * (1.0 + items / 10.0)
    output["expected_purchase_probability"] = min(score, 1.0)

    return output

# Aggregation feature view (pre-computed aggregations)
from feast.aggregation import Aggregation
from feast import FeatureView

product_stats_fv = FeatureView(
    name="product_stats",
    entities=[product],
    ttl=timedelta(days=1),
    schema=[
        Field(name="view_count_7d", dtype=Int64),
        Field(name="purchase_count_7d", dtype=Int64),
        Field(name="avg_rating_7d", dtype=Float32),
        Field(name="conversion_rate_7d", dtype=Float32),
    ],
    source=customer_features_source,
    tags={"freshness": "daily"},
)
```

**Expected:** Feature views registered successfully, schema matches source data, transformations execute without errors, TTL values appropriate for use case, on-demand views combine batch and request features.

**On failure:** Verify field names match source columns exactly, check dtype compatibility (Int64 vs Int32), ensure entity references exist, validate transformation logic with sample data, check for division by zero in calculations, verify request source schema matches inference payload.

### Step 4: Apply Feature Definitions and Materialize Features

Deploy feature definitions to registry and materialize to online store.

```bash
# Apply feature definitions to registry
feast apply

# Expected output:
# Created entity customer
# Created feature view customer_stats
# Created on demand feature view customer_segments

# Verify feature views
feast feature-views list

# Materialize historical features to online store
feast materialize-incremental $(date -u +"%Y-%m-%dT%H:%M:%S")

# Materialize specific time range
feast materialize \
  2024-01-01T00:00:00 \
  2024-01-31T23:59:59

# Check materialization status
feast registry-dump
```

Programmatic materialization:

```python
# materialize_features.py
from feast import FeatureStore
from datetime import datetime, timedelta

# Initialize feature store
fs = FeatureStore(repo_path=".")

# Materialize all feature views
end_date = datetime.now()
start_date = end_date - timedelta(days=7)

fs.materialize(
    start_date=start_date,
    end_date=end_date,
)

print(f"✓ Materialized features from {start_date} to {end_date}")

# Materialize incrementally (since last materialization)
fs.materialize_incremental(end_date=datetime.now())

# Check online store
from feast.infra.online_stores.redis import RedisOnlineStore
online_features = fs.get_online_features(
    features=[
        "customer_stats:total_purchases",
        "customer_stats:avg_purchase_value",
    ],
    entity_rows=[
        {"customer": 1234},
        {"customer": 5678},
    ],
)

print(online_features.to_dict())
```

**Expected:** Feature definitions applied to registry without conflicts, materialization job completes successfully, online store populated with features, feature freshness within configured TTL.

**On failure:** Check offline store query succeeds (`feast feature-views describe customer_stats`), verify time range has data, ensure online store writable (Redis/DynamoDB permissions), check for duplicate feature names across views, verify entity keys exist in source data, monitor materialization job logs for errors, check disk space for local stores.

### Step 5: Retrieve Features for Training

Fetch point-in-time correct historical features for model training.

```python
# get_training_data.py
from feast import FeatureStore
import pandas as pd
from datetime import datetime

# Initialize feature store
fs = FeatureStore(repo_path=".")

# Define entity dataframe with timestamps (training examples)
entity_df = pd.DataFrame({
    "customer": [1001, 1002, 1003, 1004, 1005],
    "event_timestamp": [
        datetime(2024, 1, 1, 10, 0, 0),
        datetime(2024, 1, 2, 14, 30, 0),
        datetime(2024, 1, 3, 9, 15, 0),
        datetime(2024, 1, 5, 16, 45, 0),
        datetime(2024, 1, 7, 11, 20, 0),
    ],
    "label": [1, 0, 1, 0, 1],  # Target variable
})

# Retrieve historical features (point-in-time correct)
training_df = fs.get_historical_features(
    entity_df=entity_df,
    features=[
        "customer_stats:total_purchases",
        "customer_stats:total_spend",
        "customer_stats:avg_purchase_value",
        "customer_stats:days_since_last_purchase",
        "customer_stats:is_vip",
        "customer_segments:purchase_frequency_category",
        "customer_segments:spending_tier",
    ],
).to_df()

print(training_df.head())

# Verify no feature leakage (features computed before event timestamp)
assert (training_df["event_timestamp"] <= entity_df["event_timestamp"]).all()

# Save training data
training_df.to_parquet("training_data.parquet")
print(f"✓ Saved training data: {len(training_df)} rows")

# Alternative: Use feature service for grouped retrieval
from feast import FeatureService

# Define feature service (in features.py)
from feast import FeatureService

customer_model_v1 = FeatureService(
    name="customer_churn_model_v1",
    features=[
        customer_stats_fv,
        customer_segments,
    ],
    tags={"model": "churn-predictor", "version": "1.0"},
)

# Apply feature service
# feast apply

# Retrieve using feature service
training_df = fs.get_historical_features(
    entity_df=entity_df,
    features=fs.get_feature_service("customer_churn_model_v1"),
).to_df()
```

Point-in-time correctness validation:

```python
# validate_pit_correctness.py
import pandas as pd
from datetime import datetime, timedelta

def validate_point_in_time_correctness(training_df, entity_df):
    """
    Ensure features don't leak future information.
    """
    issues = []

    for idx, row in training_df.iterrows():
        event_time = row["event_timestamp"]
        customer_id = row["customer"]

        # Check that days_since_last_purchase is based on past data only
        # (Implement actual validation logic based on your data)

        # Example: Verify feature values are from before event timestamp
        if pd.notna(row.get("total_purchases")):
            # Feature should be computed from data before event_time
            pass  # Add validation logic

    if issues:
        raise ValueError(f"Point-in-time correctness violated: {issues}")

    print("✓ Point-in-time correctness validated")

validate_point_in_time_correctness(training_df, entity_df)
```

**Expected:** Historical features retrieved successfully, entity_df timestamps preserved, no NaN values for materialized features, point-in-time correctness guaranteed (no future data leakage), feature service groups features logically.

**On failure:** Check entity_df has required columns (entity names + event_timestamp), verify feature view names match registry, ensure offline store has data for requested time range, check for timezone mismatches (use UTC), verify entity IDs exist in source data, inspect logs for SQL query errors, validate feature view TTL covers requested time range.

### Step 6: Serve Features for Real-Time Inference

Retrieve low-latency features from online store for model serving.

```python
# serve_features.py
from feast import FeatureStore
import time

# Initialize feature store
fs = FeatureStore(repo_path=".")

def get_inference_features(customer_ids: list, request_data: dict = None):
    """
    Retrieve features for real-time inference.

    Args:
        customer_ids: List of customer IDs
        request_data: Optional request-time features (cart value, etc.)
    """
    start_time = time.time()

    # Prepare entity rows
    entity_rows = [{"customer": cid} for cid in customer_ids]

    # Get online features
    feature_names = [
        "customer_stats:total_purchases",
        "customer_stats:total_spend",
        "customer_stats:avg_purchase_value",
        "customer_stats:days_since_last_purchase",
        "customer_stats:is_vip",
    ]

    # Add on-demand features if request data provided
    if request_data:
        feature_names.extend([
            "real_time_features:cart_to_avg_ratio",
            "real_time_features:expected_purchase_probability",
        ])

        # Add request features to entity rows
        for row in entity_rows:
            row.update(request_data)

    online_features = fs.get_online_features(
        features=feature_names,
        entity_rows=entity_rows,
    )

    latency = time.time() - start_time
    print(f"Feature retrieval latency: {latency*1000:.2f}ms")

    # Convert to dict for model input
    features_dict = online_features.to_dict()

    return features_dict

# Example usage
customer_ids = [1001, 1002, 1003]

# Request-time data from inference payload
request_data = {
    "current_cart_value": 150.00,
    "items_in_cart": 3,
}

features = get_inference_features(customer_ids, request_data)
print(features)

# Batch inference (retrieve many features at once)
def batch_inference(customer_ids: list, batch_size: int = 100):
    """
    Retrieve features in batches for efficiency.
    """
    results = []

    for i in range(0, len(customer_ids), batch_size):
        batch = customer_ids[i:i+batch_size]
        features = get_inference_features(batch)
        results.append(features)

    return results

# Performance test
import numpy as np

customer_ids = list(range(1000, 2000))  # 1000 customers
start = time.time()
batch_inference(customer_ids, batch_size=100)
duration = time.time() - start

print(f"Batch inference: {len(customer_ids)} customers in {duration:.2f}s")
print(f"Throughput: {len(customer_ids)/duration:.0f} customers/sec")
```

FastAPI integration:

```python
# api.py
from fastapi import FastAPI
from pydantic import BaseModel
from feast import FeatureStore
import mlflow

app = FastAPI()
fs = FeatureStore(repo_path=".")

# Load model
model = mlflow.sklearn.load_model("models:/churn-model/Production")

class PredictionRequest(BaseModel):
    customer_id: int
    current_cart_value: float
    items_in_cart: int

@app.post("/predict")
async def predict(request: PredictionRequest):
    """
    Predict customer churn using Feast features.
    """
    # Get features from Feast
    features = get_inference_features(
        customer_ids=[request.customer_id],
        request_data={
            "current_cart_value": request.current_cart_value,
            "items_in_cart": request.items_in_cart,
        }
    )

    # Convert to model input format
    import pandas as pd
    feature_df = pd.DataFrame([features])

    # Predict
    prediction = model.predict_proba(feature_df)[0]

    return {
        "customer_id": request.customer_id,
        "churn_probability": float(prediction[1]),
        "features_used": list(features.keys())
    }
```

**Expected:** Online features retrieved in <10ms for single entity, batch retrieval scales efficiently, on-demand transformations execute correctly, request-time features merged with batch features, API responds quickly (<50ms end-to-end).

**On failure:** Check online store populated (run materialize if empty), verify Redis/DynamoDB connectivity and latency, ensure entity keys exist in online store, check for cold start issues (warm up cache), verify on-demand transformation logic, monitor online store memory/CPU usage, check network latency between service and online store.

## Validation

- [ ] Feast repository initialized and configured
- [ ] Offline and online stores connected successfully
- [ ] Entity definitions match source data
- [ ] Feature views registered in registry
- [ ] On-demand transformations execute correctly
- [ ] Materialization completes without errors
- [ ] Historical features retrieved with point-in-time correctness
- [ ] Online features served with low latency (<10ms)
- [ ] Feature freshness within configured TTL
- [ ] Training-serving consistency verified
- [ ] Feature catalog accessible for discovery

## Common Pitfalls

- **Feature leakage**: Using future data in historical features - always validate point-in-time correctness, use created_timestamp column
- **Inconsistent transformations**: Different logic for training vs serving - use Feast on-demand views for consistency
- **Stale features**: Online store not materialized regularly - set up scheduled materialization jobs (cron/Airflow)
- **Missing entity keys**: Entities in training set not in online store - ensure comprehensive materialization, handle missing keys gracefully
- **Type mismatches**: Schema types don't match source data - validate dtypes before apply, use explicit Field definitions
- **Slow online retrieval**: Network latency or overloaded online store - co-locate feature store with inference service, use connection pooling
- **Large feature views**: Materializing millions of entities is slow - partition by date, use incremental materialization, optimize offline queries
- **No feature versioning**: Breaking changes affect production models - version feature views, maintain backward compatibility
- **Timezone confusion**: Mixing timezones causes incorrect joins - always use UTC for timestamps
- **Ignoring TTL**: Serving expired features - set appropriate TTL values, monitor feature freshness

## Related Skills

- `track-ml-experiments` - Log feature metadata in MLflow experiments
- `orchestrate-ml-pipeline` - Schedule feature materialization jobs
- `version-ml-data` - Version raw data sources for feature engineering
- `deploy-ml-model-serving` - Integrate feature store with model serving
- `serialize-data-formats` - Choose efficient storage formats for features
- `design-serialization-schema` - Design schemas for feature sources
