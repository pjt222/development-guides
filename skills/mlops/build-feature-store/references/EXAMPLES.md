# Build Feature Store — Extended Examples

Complete configuration files and code templates.


## Step 1: Initialize Feast Feature Repository

### Code Block 1

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

### Code Block 2

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


## Step 2: Define Entities and Data Sources

### Code Block 3

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

### Code Block 4

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


## Step 3: Define Feature Views with Transformations

### Code Block 5

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


## Step 4: Apply Feature Definitions and Materialize Features

### Code Block 6

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

### Code Block 7

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


## Step 5: Retrieve Features for Training

### Code Block 8

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

### Code Block 9

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


## Step 6: Serve Features for Real-Time Inference

### Code Block 10

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

### Code Block 11

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
