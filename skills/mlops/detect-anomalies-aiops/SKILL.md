---
name: detect-anomalies-aiops
description: >
  Implement AI-powered anomaly detection for operational metrics using time series analysis
  (Isolation Forest, Prophet, LSTM), alert correlation, and root cause analysis. Reduce
  alert fatigue by intelligently identifying true anomalies in system metrics, logs, and traces.
license: MIT
allowed-tools: Read Write Edit Bash Grep Glob
metadata:
  author: Philipp Thoss
  version: "1.0"
  domain: mlops
  complexity: advanced
  language: multi
  tags: aiops, anomaly-detection, isolation-forest, prophet, alert-correlation, time-series
---

# Detect Anomalies for AIOps

Apply machine learning to detect anomalies in operational metrics, correlate alerts, and reduce false positives.

## When to Use

- Operations team overwhelmed by alert volume (>100 alerts/day)
- Need to detect complex multi-metric anomalies (not just threshold breaches)
- Seasonal patterns make static thresholds ineffective
- Want to predict issues before they impact users (proactive detection)
- Need to correlate related alerts to identify root cause
- Monitoring system generates too many false positives
- Want to detect subtle performance degradation trends

## Inputs

- **Required**: Time series metrics from monitoring system (CPU, memory, latency, error rate)
- **Required**: Historical data (30-90 days minimum)
- **Optional**: Alert history with labels (true positive / false positive)
- **Optional**: System topology (service dependencies)
- **Optional**: Log data for correlation
- **Optional**: Deployment/change events for context

## Procedure

### Step 1: Set Up Environment and Load Data

Install dependencies and prepare time series data for analysis.

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install anomaly detection libraries
pip install prophet scikit-learn pandas numpy
pip install tensorflow keras  # for LSTM models
pip install pyod  # Python Outlier Detection library
pip install statsmodels  # for statistical methods
pip install prometheus-api-client  # if using Prometheus

# Visualization
pip install plotly matplotlib seaborn
```

Load and prepare data:

```python
# aiops/data_loader.py
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MetricsDataLoader:
    """
    Load and preprocess operational metrics for anomaly detection.
    """
    def __init__(self, prometheus_url: str = None):
        self.prometheus_url = prometheus_url

    def load_from_prometheus(
        self,
        query: str,
        start_time: datetime,
        end_time: datetime,
        step: str = "1m",
    ) -> pd.DataFrame:
        """
        Load time series from Prometheus.
        """
        from prometheus_api_client import PrometheusConnect

        prom = PrometheusConnect(url=self.prometheus_url, disable_ssl=True)

        result = prom.custom_query_range(
            query=query,
            start_time=start_time,
            end_time=end_time,
            step=step,
        )

        # Convert to DataFrame
        data = []
        for series in result:
            metric_name = series["metric"].get("__name__", "unknown")
            for timestamp, value in series["values"]:
                data.append({
                    "timestamp": datetime.fromtimestamp(timestamp),
                    "metric": metric_name,
                    "value": float(value),
                    **series["metric"],  # Include labels
                })

        df = pd.DataFrame(data)
        return df

    def load_from_csv(self, filepath: str) -> pd.DataFrame:
        """
        Load metrics from CSV file.
        Expected columns: timestamp, metric, value, [labels]
        """
        df = pd.read_csv(filepath)
        df["timestamp"] = pd.to_datetime(df["timestamp"])
        return df

    def preprocess_metrics(
        self,
        df: pd.DataFrame,
        resample_freq: str = "5min",
        fill_method: str = "interpolate",
    ) -> pd.DataFrame:
        """
        Preprocess metrics: handle missing values, resample, smooth.
        """
        # Set timestamp as index
        df = df.set_index("timestamp")

        # Resample to regular intervals
        df_resampled = df.groupby("metric")["value"].resample(resample_freq).mean()

        # Handle missing values
        if fill_method == "interpolate":
            df_resampled = df_resampled.interpolate(method="time")
        elif fill_method == "ffill":
            df_resampled = df_resampled.fillna(method="ffill")
        elif fill_method == "zero":
            df_resampled = df_resampled.fillna(0)

        # Remove outliers before modeling (optional)
        df_resampled = self._remove_extreme_outliers(df_resampled)

        return df_resampled.reset_index()

    def _remove_extreme_outliers(self, series: pd.Series, n_sigma: int = 5) -> pd.Series:
        """
        Remove extreme outliers (> n sigma) that could be data errors.
        """
        mean = series.mean()
        std = series.std()
        filtered = series.copy()
        filtered[np.abs(series - mean) > n_sigma * std] = np.nan
        return filtered.interpolate()

    def create_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Create time-based features for ML models.
        """
        df = df.copy()

        # Time features
        df["hour"] = df["timestamp"].dt.hour
        df["day_of_week"] = df["timestamp"].dt.dayofweek
        df["day_of_month"] = df["timestamp"].dt.day
        df["is_weekend"] = df["day_of_week"].isin([5, 6]).astype(int)

        # Cyclical encoding (hour)
        df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24)
        df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24)

        # Lag features
        for lag in [1, 6, 12, 24]:  # Assuming 5-min intervals
            df[f"value_lag_{lag}"] = df.groupby("metric")["value"].shift(lag)

        # Rolling statistics
        for window in [6, 12, 24]:  # 30min, 1hr, 2hr windows
            df[f"rolling_mean_{window}"] = (
                df.groupby("metric")["value"]
                .rolling(window=window, min_periods=1)
                .mean()
                .reset_index(level=0, drop=True)
            )
            df[f"rolling_std_{window}"] = (
                df.groupby("metric")["value"]
                .rolling(window=window, min_periods=1)
                .std()
                .reset_index(level=0, drop=True)
            )

        return df


# Example usage
if __name__ == "__main__":
    loader = MetricsDataLoader(prometheus_url="http://prometheus:9090")

    # Load CPU metrics
    end_time = datetime.now()
    start_time = end_time - timedelta(days=7)

    df = loader.load_from_prometheus(
        query='avg(rate(container_cpu_usage_seconds_total[5m])) by (pod)',
        start_time=start_time,
        end_time=end_time,
        step="1m",
    )

    # Preprocess
    df_processed = loader.preprocess_metrics(df, resample_freq="5min")

    # Create features
    df_features = loader.create_features(df_processed)

    print(f"Loaded {len(df_features)} data points")
    print(df_features.head())
```

**Expected:** Time series data loaded with regular intervals, missing values handled, features engineered for ML models.

**On failure:** If Prometheus connection fails, verify URL and network access, if data gaps exist use forward-fill or interpolation, ensure timestamp column is datetime type, check for memory issues with large date ranges (process in chunks).

### Step 2: Implement Isolation Forest for Multivariate Anomaly Detection

Detect anomalies using unsupervised Isolation Forest algorithm.

```python
# aiops/isolation_forest_detector.py
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import pandas as pd
import numpy as np
from typing import Dict, List
import joblib


class IsolationForestDetector:
    """
    Detect anomalies using Isolation Forest on multiple metrics.
    """
    def __init__(
        self,
        contamination: float = 0.01,  # Expected proportion of anomalies
        n_estimators: int = 100,
        random_state: int = 42,
    ):
        self.contamination = contamination
        self.model = IsolationForest(
            contamination=contamination,
            n_estimators=n_estimators,
            random_state=random_state,
            n_jobs=-1,
        )
        self.scaler = StandardScaler()
        self.feature_columns = None

    def fit(self, df: pd.DataFrame, feature_columns: List[str]):
        """
        Train Isolation Forest on normal data.

        Args:
            df: DataFrame with features
            feature_columns: List of column names to use as features
        """
        self.feature_columns = feature_columns

        # Extract features
        X = df[feature_columns].values

        # Handle NaN values
        X = np.nan_to_num(X, nan=0.0)

        # Scale features
        X_scaled = self.scaler.fit_transform(X)

        # Train model
        self.model.fit(X_scaled)

        logger.info(f"Trained Isolation Forest on {len(X)} samples")

    def predict(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Detect anomalies in new data.

        Returns:
            DataFrame with anomaly scores and predictions
        """
        X = df[self.feature_columns].values
        X = np.nan_to_num(X, nan=0.0)
        X_scaled = self.scaler.transform(X)

        # Predict (-1 for anomaly, 1 for normal)
        predictions = self.model.predict(X_scaled)

        # Get anomaly scores (lower = more anomalous)
        anomaly_scores = self.model.decision_function(X_scaled)

        results = df.copy()
        results["is_anomaly"] = (predictions == -1).astype(int)
        results["anomaly_score"] = anomaly_scores

        # Normalize score to 0-1 (higher = more anomalous)
        results["anomaly_score_normalized"] = (
            (anomaly_scores.max() - anomaly_scores) /
            (anomaly_scores.max() - anomaly_scores.min())
        )

        return results

    def save(self, filepath: str):
        """Save trained model."""
        joblib.dump({
            "model": self.model,
            "scaler": self.scaler,
            "feature_columns": self.feature_columns,
        }, filepath)

    @classmethod
    def load(cls, filepath: str):
        """Load trained model."""
        data = joblib.load(filepath)
        detector = cls()
        detector.model = data["model"]
        detector.scaler = data["scaler"]
        detector.feature_columns = data["feature_columns"]
        return detector


# Example usage
if __name__ == "__main__":
    from data_loader import MetricsDataLoader

    # Load and preprocess data
    loader = MetricsDataLoader()
    df = loader.load_from_csv("data/metrics_7days.csv")
    df_processed = loader.preprocess_metrics(df)
    df_features = loader.create_features(df_processed)

    # Define feature columns
    feature_cols = [
        "value", "hour_sin", "hour_cos", "is_weekend",
        "value_lag_1", "value_lag_6", "value_lag_12",
        "rolling_mean_6", "rolling_std_6",
    ]

    # Train detector
    detector = IsolationForestDetector(contamination=0.01)
    detector.fit(df_features, feature_cols)

    # Detect anomalies
    results = detector.predict(df_features)

    # Show anomalies
    anomalies = results[results["is_anomaly"] == 1]
    print(f"Detected {len(anomalies)} anomalies ({len(anomalies)/len(results):.2%})")
    print(anomalies[["timestamp", "metric", "value", "anomaly_score_normalized"]].head(10))

    # Save model
    detector.save("models/isolation_forest_detector.pkl")
```

**Expected:** Model trained on historical data, anomalies detected with scores, typically 0.5-2% of points flagged as anomalies.

**On failure:** If too many anomalies (>5%), reduce contamination parameter or retrain on cleaner baseline period, if too few (<0.1%), increase contamination or check feature scaling, verify features have sufficient variance.

### Step 3: Implement Prophet for Time Series Forecasting and Anomaly Detection

Use Facebook Prophet to model seasonality and detect deviations.

```python
# aiops/prophet_detector.py
from prophet import Prophet
import pandas as pd
import numpy as np
from typing import Dict, Tuple
import logging

logger = logging.getLogger(__name__)


class ProphetAnomalyDetector:
    """
    Detect anomalies by forecasting with Prophet and flagging large deviations.
    """
    def __init__(
        self,
        interval_width: float = 0.99,  # Confidence interval (99%)
        changepoint_prior_scale: float = 0.05,  # Flexibility of trend
    ):
        self.interval_width = interval_width
        self.changepoint_prior_scale = changepoint_prior_scale
        self.models = {}  # One model per metric

    def fit(self, df: pd.DataFrame, metric_column: str = "metric"):
        """
        Train Prophet models for each metric.

        Args:
            df: DataFrame with columns: timestamp, metric, value
            metric_column: Name of column containing metric names
        """
        # Prepare data for Prophet (requires 'ds' and 'y' columns)
        for metric_name in df[metric_column].unique():
            metric_df = df[df[metric_column] == metric_name][["timestamp", "value"]].copy()
            metric_df.columns = ["ds", "y"]

            # Remove NaN values
            metric_df = metric_df.dropna()

            if len(metric_df) < 100:
                logger.warning(f"Skipping {metric_name}: insufficient data ({len(metric_df)} points)")
                continue

            # Train Prophet model
            model = Prophet(
                interval_width=self.interval_width,
                changepoint_prior_scale=self.changepoint_prior_scale,
                daily_seasonality=True,
                weekly_seasonality=True,
                yearly_seasonality=False,  # Usually not enough data
            )

            model.fit(metric_df)
            self.models[metric_name] = model

            logger.info(f"Trained Prophet model for {metric_name}")

    def detect(self, df: pd.DataFrame, metric_column: str = "metric") -> pd.DataFrame:
        """
        Detect anomalies by comparing actual values to forecast bounds.
        """
        results = []

        for metric_name in df[metric_column].unique():
            if metric_name not in self.models:
                logger.warning(f"No model for {metric_name}, skipping")
                continue

            metric_df = df[df[metric_column] == metric_name][["timestamp", "value"]].copy()
            metric_df.columns = ["ds", "y"]

            # Get forecast
            forecast = self.models[metric_name].predict(metric_df[["ds"]])

            # Identify anomalies (outside confidence interval)
            metric_df["forecast"] = forecast["yhat"].values
            metric_df["forecast_lower"] = forecast["yhat_lower"].values
            metric_df["forecast_upper"] = forecast["yhat_upper"].values

            metric_df["is_anomaly"] = (
                (metric_df["y"] < metric_df["forecast_lower"]) |
                (metric_df["y"] > metric_df["forecast_upper"])
            ).astype(int)

            # Calculate anomaly score (distance from forecast)
            metric_df["anomaly_score"] = np.abs(
                metric_df["y"] - metric_df["forecast"]
            ) / (metric_df["forecast_upper"] - metric_df["forecast_lower"] + 1e-6)

            metric_df["metric"] = metric_name
            metric_df.columns = [
                "timestamp", "value", "forecast", "forecast_lower",
                "forecast_upper", "is_anomaly", "anomaly_score", "metric"
            ]

            results.append(metric_df)

        return pd.concat(results, ignore_index=True) if results else pd.DataFrame()

    def forecast_future(
        self,
        metric_name: str,
        periods: int = 288,  # 24 hours at 5-min intervals
    ) -> pd.DataFrame:
        """
        Generate future forecast for capacity planning.
        """
        if metric_name not in self.models:
            raise ValueError(f"No model trained for {metric_name}")

        model = self.models[metric_name]
        future = model.make_future_dataframe(periods=periods, freq="5min")
        forecast = model.predict(future)

        return forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]]


# Example usage
if __name__ == "__main__":
    from data_loader import MetricsDataLoader

    # Load data
    loader = MetricsDataLoader()
    df = loader.load_from_csv("data/metrics_30days.csv")
    df_processed = loader.preprocess_metrics(df)

    # Split into train (first 80%) and test (last 20%)
    split_idx = int(len(df_processed) * 0.8)
    train_df = df_processed.iloc[:split_idx]
    test_df = df_processed.iloc[split_idx:]

    # Train Prophet detector
    detector = ProphetAnomalyDetector(interval_width=0.99)
    detector.fit(train_df)

    # Detect anomalies in test set
    results = detector.detect(test_df)

    anomalies = results[results["is_anomaly"] == 1]
    print(f"Detected {len(anomalies)} anomalies")
    print(anomalies[["timestamp", "metric", "value", "forecast", "anomaly_score"]].head())

    # Forecast next 24 hours
    forecast = detector.forecast_future("cpu_usage", periods=288)
    print("\nForecast for next 24 hours:")
    print(forecast.head(12))  # Next hour
```

**Expected:** Prophet models capture daily/weekly seasonality, anomalies detected when actual values fall outside 99% confidence interval, forecasts generated for capacity planning.

**On failure:** If Prophet takes too long (>5 min per metric), reduce history to 30 days or disable weekly_seasonality, if too many false positives increase interval_width to 0.995, if missing seasonal patterns add custom seasonalities, ensure timezone consistency in timestamps.

### Step 4: Correlate Alerts and Identify Root Cause

Group related anomalies and identify potential root causes.

```python
# aiops/alert_correlation.py
import pandas as pd
import numpy as np
from sklearn.cluster import DBSCAN
from typing import List, Dict
from datetime import timedelta
import networkx as nx


class AlertCorrelator:
    """
    Correlate multiple alerts to identify incident patterns and root causes.
    """
    def __init__(self, time_window_minutes: int = 5):
        self.time_window = timedelta(minutes=time_window_minutes)

    def correlate_by_time(self, anomalies: pd.DataFrame) -> pd.DataFrame:
        """
        Group anomalies that occur within the same time window.
        """
        anomalies = anomalies.sort_values("timestamp")
        anomalies["incident_id"] = 0

        incident_id = 1
        last_timestamp = None

        for idx, row in anomalies.iterrows():
            if last_timestamp is None or (row["timestamp"] - last_timestamp) > self.time_window:
                incident_id += 1

            anomalies.at[idx, "incident_id"] = incident_id
            last_timestamp = row["timestamp"]

        return anomalies

    def correlate_by_metrics(
        self,
        anomalies: pd.DataFrame,
        metric_relationships: Dict[str, List[str]] = None,
    ) -> pd.DataFrame:
        """
        Correlate anomalies based on known metric relationships.

        Args:
            anomalies: DataFrame with detected anomalies
            metric_relationships: Dict mapping metrics to their dependencies
                Example: {"api_latency": ["database_latency", "cache_hit_rate"]}
        """
        if metric_relationships is None:
            metric_relationships = self._infer_relationships(anomalies)

        # Build dependency graph
        G = nx.DiGraph()
        for metric, dependencies in metric_relationships.items():
            for dep in dependencies:
                G.add_edge(dep, metric)  # dependency -> dependent

        # Find root causes (nodes with no incoming edges during incident)
        anomalies = self.correlate_by_time(anomalies)

        for incident_id in anomalies["incident_id"].unique():
            incident_anomalies = anomalies[anomalies["incident_id"] == incident_id]
            affected_metrics = set(incident_anomalies["metric"])

            # Find metrics with no dependencies in this incident
            root_causes = []
            for metric in affected_metrics:
                # Get dependencies that are also affected
                dependencies = set(G.predecessors(metric)) if metric in G else set()
                affected_deps = dependencies & affected_metrics

                if len(affected_deps) == 0:
                    root_causes.append(metric)

            # Mark root causes
            for idx in incident_anomalies.index:
                if incident_anomalies.at[idx, "metric"] in root_causes:
                    anomalies.at[idx, "is_root_cause"] = True
                else:
                    anomalies.at[idx, "is_root_cause"] = False

        return anomalies

    def _infer_relationships(self, anomalies: pd.DataFrame) -> Dict[str, List[str]]:
        """
        Infer metric relationships from temporal correlation.
        """
        # Pivot to get metric columns
        pivot = anomalies.pivot_table(
            index="timestamp",
            columns="metric",
            values="is_anomaly",
            fill_value=0,
        )

        # Calculate correlation matrix
        corr_matrix = pivot.corr()

        # Identify strong correlations (>0.7)
        relationships = {}
        for metric in corr_matrix.columns:
            correlated = corr_matrix[metric][corr_matrix[metric] > 0.7].index.tolist()
            correlated.remove(metric)  # Remove self
            if correlated:
                relationships[metric] = correlated

        return relationships

    def generate_incident_summary(self, anomalies: pd.DataFrame) -> List[Dict]:
        """
        Generate human-readable incident summaries.
        """
        summaries = []

        for incident_id in anomalies["incident_id"].unique():
            incident = anomalies[anomalies["incident_id"] == incident_id]

            root_causes = incident[incident.get("is_root_cause", False)]

            summary = {
                "incident_id": int(incident_id),
                "start_time": incident["timestamp"].min(),
                "end_time": incident["timestamp"].max(),
                "duration_minutes": (incident["timestamp"].max() - incident["timestamp"].min()).total_seconds() / 60,
                "affected_metrics": incident["metric"].unique().tolist(),
                "num_anomalies": len(incident),
                "max_anomaly_score": incident["anomaly_score"].max(),
                "root_cause_metrics": root_causes["metric"].tolist() if len(root_causes) > 0 else [],
            }

            summaries.append(summary)

        return summaries


# Example usage
if __name__ == "__main__":
    # Load anomalies from previous detectors
    anomalies = pd.read_csv("results/detected_anomalies.csv")
    anomalies["timestamp"] = pd.to_datetime(anomalies["timestamp"])

    # Define metric relationships (service topology)
    metric_relationships = {
        "api_response_time": ["database_query_time", "cache_hit_rate"],
        "database_query_time": ["disk_io_wait"],
        "error_rate": ["api_response_time", "database_connection_pool"],
    }

    # Correlate alerts
    correlator = AlertCorrelator(time_window_minutes=5)
    correlated = correlator.correlate_by_metrics(anomalies, metric_relationships)

    # Generate incident summaries
    summaries = correlator.generate_incident_summary(correlated)

    print(f"Identified {len(summaries)} incidents")
    for summary in summaries:
        print(f"\nIncident {summary['incident_id']}:")
        print(f"  Start: {summary['start_time']}")
        print(f"  Duration: {summary['duration_minutes']:.1f} minutes")
        print(f"  Affected metrics: {', '.join(summary['affected_metrics'])}")
        print(f"  Root causes: {', '.join(summary['root_cause_metrics']) or 'Unknown'}")
```

**Expected:** Related anomalies grouped into incidents, root causes identified based on dependency graph, incident summaries generated for investigation.

**On failure:** If all anomalies separate incidents, increase time_window_minutes, if root cause detection unclear define metric_relationships explicitly based on architecture, verify timestamp sorting is correct.

### Step 5: Integrate with Alerting System

Send intelligent alerts with context and suppression of noise.

```python
# aiops/intelligent_alerting.py
import requests
import logging
from typing import Dict, List
from datetime import datetime, timedelta
import json

logger = logging.getLogger(__name__)


class IntelligentAlerter:
    """
    Send alerts with anomaly context, rate limiting, and deduplication.
    """
    def __init__(
        self,
        slack_webhook: str = None,
        pagerduty_key: str = None,
        min_severity: float = 0.7,  # Only alert on high-confidence anomalies
        rate_limit_minutes: int = 15,  # Suppress repeat alerts
    ):
        self.slack_webhook = slack_webhook
        self.pagerduty_key = pagerduty_key
        self.min_severity = min_severity
        self.rate_limit = timedelta(minutes=rate_limit_minutes)
        self.last_alerts = {}  # metric -> last alert time

    def should_alert(self, metric: str, severity: float) -> bool:
        """
        Determine if alert should be sent (rate limiting + severity).
        """
        if severity < self.min_severity:
            return False

        # Check rate limit
        if metric in self.last_alerts:
            time_since_last = datetime.now() - self.last_alerts[metric]
            if time_since_last < self.rate_limit:
                logger.info(f"Suppressing alert for {metric} (rate limited)")
                return False

        return True

    def send_incident_alert(self, incident_summary: Dict):
        """
        Send alert for an incident with full context.
        """
        severity = self._calculate_severity(incident_summary)

        # Check if should alert
        primary_metric = incident_summary["affected_metrics"][0]
        if not self.should_alert(primary_metric, severity):
            return

        # Build alert message
        message = self._format_incident_message(incident_summary, severity)

        # Send to channels based on severity
        if severity >= 0.9:  # Critical
            if self.pagerduty_key:
                self._send_pagerduty(message, "critical")
            if self.slack_webhook:
                self._send_slack(message, "danger")
        elif severity >= 0.7:  # Warning
            if self.slack_webhook:
                self._send_slack(message, "warning")
        else:  # Info
            logger.info(f"Low severity incident: {message}")

        # Update rate limit tracker
        self.last_alerts[primary_metric] = datetime.now()

    def _calculate_severity(self, incident: Dict) -> float:
        """
        Calculate incident severity (0-1) based on multiple factors.
        """
        # Factors:
        # 1. Max anomaly score
        # 2. Number of affected metrics
        # 3. Presence of root cause
        # 4. Duration

        score_factor = incident["max_anomaly_score"]
        metric_factor = min(len(incident["affected_metrics"]) / 5, 1.0)  # Cap at 5 metrics
        root_cause_factor = 1.2 if incident["root_cause_metrics"] else 1.0
        duration_factor = min(incident["duration_minutes"] / 30, 1.0)  # Cap at 30 min

        severity = (
            score_factor * 0.4 +
            metric_factor * 0.3 +
            duration_factor * 0.3
        ) * root_cause_factor

        return min(severity, 1.0)

    def _format_incident_message(self, incident: Dict, severity: float) -> str:
        """Format incident into alert message."""
        severity_emoji = "🔴" if severity >= 0.9 else "🟡" if severity >= 0.7 else "🟢"

        message = f"""
{severity_emoji} **Incident {incident['incident_id']}** (Severity: {severity:.0%})

**Time:** {incident['start_time'].strftime('%Y-%m-%d %H:%M:%S')}
**Duration:** {incident['duration_minutes']:.1f} minutes
**Affected Metrics:** {', '.join(incident['affected_metrics'])}

**Root Cause:** {', '.join(incident['root_cause_metrics']) or 'Under investigation'}

**Details:**
- Number of anomalies: {incident['num_anomalies']}
- Max anomaly score: {incident['max_anomaly_score']:.2f}

**Runbook:** [View incident details](/incidents/{incident['incident_id']})
"""
        return message.strip()

    def _send_slack(self, message: str, color: str = "warning"):
        """Send alert to Slack."""
        if not self.slack_webhook:
            return

        payload = {
            "attachments": [{
                "color": color,
                "text": message,
                "footer": "AIOps Anomaly Detection",
                "ts": int(datetime.now().timestamp()),
            }]
        }

        try:
            response = requests.post(self.slack_webhook, json=payload, timeout=5)
            response.raise_for_status()
            logger.info("Slack alert sent successfully")
        except Exception as e:
            logger.error(f"Failed to send Slack alert: {e}")

    def _send_pagerduty(self, message: str, severity: str = "warning"):
        """Send critical alert to PagerDuty."""
        if not self.pagerduty_key:
            return

        payload = {
            "routing_key": self.pagerduty_key,
            "event_action": "trigger",
            "payload": {
                "summary": message.split('\n')[0],  # First line
                "severity": severity,
                "source": "aiops_anomaly_detector",
                "custom_details": {"full_message": message},
            }
        }

        try:
            response = requests.post(
                "https://events.pagerduty.com/v2/enqueue",
                json=payload,
                timeout=5,
            )
            response.raise_for_status()
            logger.info("PagerDuty alert sent successfully")
        except Exception as e:
            logger.error(f"Failed to send PagerDuty alert: {e}")


# Example usage
if __name__ == "__main__":
    alerter = IntelligentAlerter(
        slack_webhook="https://hooks.slack.com/services/YOUR/WEBHOOK",
        pagerduty_key="YOUR_PAGERDUTY_KEY",
        min_severity=0.7,
        rate_limit_minutes=15,
    )

    # Load incident summaries
    with open("results/incident_summaries.json") as f:
        incidents = json.load(f)

    # Send alerts for incidents
    for incident in incidents:
        alerter.send_incident_alert(incident)
```

**Expected:** High-severity incidents trigger PagerDuty pages, medium-severity go to Slack, low-severity logged only, duplicate alerts suppressed within 15-minute window.

**On failure:** Test webhook URLs with curl first, verify severity calculation produces reasonable values (0.5-0.9 range), check rate limiting doesn't suppress all alerts, ensure timezone handling is correct for last_alerts tracking.

### Step 6: Deploy as Continuous Monitoring Service

Set up automated pipeline that runs periodically.

```python
# aiops/monitoring_service.py
import schedule
import time
import logging
from datetime import datetime, timedelta
from data_loader import MetricsDataLoader
from isolation_forest_detector import IsolationForestDetector
from prophet_detector import ProphetAnomalyDetector
from alert_correlation import AlertCorrelator
from intelligent_alerting import IntelligentAlerter
import pandas as pd

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/aiops_monitoring.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


def run_anomaly_detection():
    """
    Main anomaly detection pipeline.
    """
    try:
        logger.info("Starting anomaly detection run")

        # 1. Load recent metrics (last hour)
        loader = MetricsDataLoader(prometheus_url="http://prometheus:9090")
        end_time = datetime.now()
        start_time = end_time - timedelta(hours=1)

        df = loader.load_from_prometheus(
            query='avg(rate(container_cpu_usage_seconds_total[5m])) by (pod)',
            start_time=start_time,
            end_time=end_time,
        )

        df_processed = loader.preprocess_metrics(df)
        df_features = loader.create_features(df_processed)

        # 2. Run Isolation Forest detector
        if_detector = IsolationForestDetector.load("models/isolation_forest_detector.pkl")
        if_results = if_detector.predict(df_features)

        # 3. Run Prophet detector
        prophet_detector = ProphetAnomalyDetector()
        # Load pre-trained models from disk
        # prophet_results = prophet_detector.detect(df_processed)

        # Combine results (for now, just use Isolation Forest)
        anomalies = if_results[if_results["is_anomaly"] == 1]

        if len(anomalies) == 0:
            logger.info("No anomalies detected")
            return

        logger.info(f"Detected {len(anomalies)} anomalies")

        # 4. Correlate alerts
        correlator = AlertCorrelator(time_window_minutes=5)
        correlated = correlator.correlate_by_time(anomalies)
        incident_summaries = correlator.generate_incident_summary(correlated)

        # 5. Send intelligent alerts
        alerter = IntelligentAlerter(
            slack_webhook="YOUR_SLACK_WEBHOOK",
            min_severity=0.7,
        )

        for incident in incident_summaries:
            alerter.send_incident_alert(incident)

        logger.info(f"Anomaly detection completed: {len(incident_summaries)} incidents")

    except Exception as e:
        logger.error(f"Anomaly detection failed: {e}", exc_info=True)


if __name__ == "__main__":
    # Run immediately
    run_anomaly_detection()

    # Schedule to run every 5 minutes
    schedule.every(5).minutes.do(run_anomaly_detection)

    logger.info("Anomaly detection service started")

    while True:
        schedule.run_pending()
        time.sleep(60)
```

**Expected:** Service runs continuously, detects anomalies every 5 minutes, alerts sent for incidents, logs all activity.

**On failure:** Verify scheduler process stays alive (use systemd/supervisor for production), check Prometheus connectivity, ensure models are loaded successfully, implement dead man's switch alert if service stops running, monitor memory usage (reload models periodically if memory grows).

## Validation

- [ ] Historical data loaded correctly with no missing timestamps
- [ ] Isolation Forest detects known anomalies from test set
- [ ] Prophet models capture daily/weekly seasonality in visualizations
- [ ] Alert correlation groups temporally-related anomalies
- [ ] Root cause detection identifies upstream issues correctly
- [ ] Intelligent alerting suppresses duplicate alerts
- [ ] Severity calculation produces reasonable scores (0.5-0.9)
- [ ] Monitoring service runs continuously without crashes for 7+ days
- [ ] False positive rate < 10% (validated against labeled data)
- [ ] True positive rate > 80% for critical incidents

## Common Pitfalls

- **Training on anomalous data**: Ensure baseline period used for training is clean (no incidents); manually review or use labeled data
- **Ignoring seasonality**: Static models fail on daily/weekly patterns; use Prophet or add time features
- **Too sensitive thresholds**: 99% confidence intervals may flag normal peaks; start with 99.5% and tune based on false positives
- **Not handling missing data**: Gaps in metrics cause model errors; implement robust preprocessing with interpolation
- **Alert fatigue from low severity**: Filter alerts below severity threshold; focus on high-confidence anomalies
- **Ignoring system topology**: Treating all metrics independently misses cascading failures; define dependency relationships
- **Model drift**: Models trained on old data become stale; retrain monthly or when system changes
- **Resource contention**: Running detection on every metric is expensive; prioritize critical services or sample metrics

## Related Skills

- `monitor-model-drift` - Detect when anomaly detection models degrade
- `monitor-data-integrity` - Data quality checks before anomaly detection
- `setup-prometheus-monitoring` - Collect operational metrics
- `forecast-operational-metrics` - Capacity planning with Prophet forecasts
