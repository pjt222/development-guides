# Monitor Model Drift — Extended Examples

Complete configuration files and code templates.


## Step 1: Install and Configure Evidently AI

### Code Block 1

```python

# monitoring/config/drift_config.py
from evidently.metric_preset import DataDriftPreset, TargetDriftPreset
from evidently.metrics import (
    DatasetDriftMetric,
    DatasetMissingValuesMetric,
    ColumnDriftMetric,
)

DRIFT_CONFIG = {
    "reference_period_days": 30,
    "detection_window_days": 7,
    "psi_threshold": 0.1,  # Population Stability Index
    "ks_threshold": 0.05,  # Kolmogorov-Smirnov p-value
    "drift_share_threshold": 0.5,  # % of features drifting
    "alert_channels": ["slack", "email", "pagerduty"],
}

FEATURE_GROUPS = {
    "numerical": ["age", "income", "credit_score"],
    "categorical": ["region", "product_type", "channel"],
    "critical": ["credit_score", "income"],  # Alert immediately
}

```


## Step 2: Implement Data Drift Detection

### Code Block 2

```python

# monitoring/drift_detector.py
import pandas as pd
import numpy as np
from scipy.stats import ks_2samp, chi2_contingency
from evidently.report import Report
from evidently.metric_preset import DataDriftPreset
from evidently.metrics import ColumnDriftMetric, DatasetDriftMetric
from datetime import datetime, timedelta
import json


class DriftMonitor:
    def __init__(self, reference_data: pd.DataFrame, config: dict):
        self.reference_data = reference_data
        self.config = config
        self.drift_history = []

    def calculate_psi(self, expected: np.ndarray, actual: np.ndarray,
                      bins=10) -> float:
        """
        Calculate Population Stability Index.
        PSI < 0.1: No significant change
        0.1 <= PSI < 0.2: Moderate change
        PSI >= 0.2: Significant change
        """
        # Create bins based on expected distribution
        breakpoints = np.quantile(expected, np.linspace(0, 1, bins + 1))
        breakpoints = np.unique(breakpoints)

        expected_percents = np.histogram(expected, bins=breakpoints)[0] / len(expected)
        actual_percents = np.histogram(actual, bins=breakpoints)[0] / len(actual)

        # Avoid division by zero
        expected_percents = np.where(expected_percents == 0, 0.0001, expected_percents)
        actual_percents = np.where(actual_percents == 0, 0.0001, actual_percents)

        psi = np.sum((actual_percents - expected_percents) *
                     np.log(actual_percents / expected_percents))
        return psi

    def detect_drift(self, current_data: pd.DataFrame) -> dict:
        """
        Run comprehensive drift detection with multiple tests.
        """
        drift_results = {
            "timestamp": datetime.now().isoformat(),
            "overall_drift": False,
            "features": {},
            "summary": {},
        }

        numerical_features = self.config["FEATURE_GROUPS"]["numerical"]
        categorical_features = self.config["FEATURE_GROUPS"]["categorical"]

        # Numerical feature drift (KS test + PSI)
        for feature in numerical_features:
            ref_values = self.reference_data[feature].dropna()
            curr_values = current_data[feature].dropna()

            # Kolmogorov-Smirnov test
            ks_stat, ks_pvalue = ks_2samp(ref_values, curr_values)

            # Population Stability Index
            psi_value = self.calculate_psi(ref_values.values, curr_values.values)

            drift_detected = (
                ks_pvalue < self.config["DRIFT_CONFIG"]["ks_threshold"] or
                psi_value > self.config["DRIFT_CONFIG"]["psi_threshold"]
            )

            drift_results["features"][feature] = {
                "type": "numerical",
                "ks_statistic": float(ks_stat),
                "ks_pvalue": float(ks_pvalue),
                "psi": float(psi_value),
                "drift_detected": drift_detected,
                "severity": self._get_severity(psi_value),
            }

        # Categorical feature drift (Chi-square test)
        for feature in categorical_features:
            ref_counts = self.reference_data[feature].value_counts()
            curr_counts = current_data[feature].value_counts()

            # Align categories
            all_categories = set(ref_counts.index) | set(curr_counts.index)
            ref_aligned = [ref_counts.get(cat, 0) for cat in all_categories]
            curr_aligned = [curr_counts.get(cat, 0) for cat in all_categories]

            # Chi-square test
            contingency = np.array([ref_aligned, curr_aligned])
            chi2, pvalue, _, _ = chi2_contingency(contingency)

            drift_results["features"][feature] = {
                "type": "categorical",
                "chi2_statistic": float(chi2),
                "pvalue": float(pvalue),
                "drift_detected": pvalue < 0.05,
                "new_categories": list(set(curr_counts.index) - set(ref_counts.index)),
            }

        # Overall drift assessment
        drifted_features = sum(
            1 for f in drift_results["features"].values() if f["drift_detected"]
        )
        total_features = len(drift_results["features"])
        drift_share = drifted_features / total_features

        drift_results["overall_drift"] = (
            drift_share >= self.config["DRIFT_CONFIG"]["drift_share_threshold"]
        )
        drift_results["summary"] = {
            "drifted_features": drifted_features,
            "total_features": total_features,
            "drift_share": drift_share,
        }

        return drift_results

    def _get_severity(self, psi: float) -> str:
        """Categorize drift severity based on PSI value."""
        if psi < 0.1:
            return "none"
        elif psi < 0.2:
            return "moderate"
        else:
            return "severe"


# Usage example
if __name__ == "__main__":
    # Load data
    reference_df = pd.read_parquet("data/reference_data.parquet")
    current_df = pd.read_parquet("data/current_week_data.parquet")

    # Initialize monitor
    from config.drift_config import DRIFT_CONFIG, FEATURE_GROUPS
    config = {"DRIFT_CONFIG": DRIFT_CONFIG, "FEATURE_GROUPS": FEATURE_GROUPS}

    monitor = DriftMonitor(reference_df, config)

    # Detect drift
    results = monitor.detect_drift(current_df)

    # Save results
    with open("monitoring/reports/drift_report.json", "w") as f:
        json.dump(results, f, indent=2)

    print(f"Drift detected: {results['overall_drift']}")
    print(f"Drifted features: {results['summary']['drifted_features']}/{results['summary']['total_features']}")

```


## Step 3: Generate Evidently Reports

### Code Block 3

```python

# monitoring/generate_reports.py
from evidently.report import Report
from evidently.metric_preset import DataDriftPreset, TargetDriftPreset
from evidently.metrics import (
    ColumnDriftMetric,
    DatasetDriftMetric,
    DatasetMissingValuesMetric,
)
import pandas as pd


def generate_drift_report(
    reference_data: pd.DataFrame,
    current_data: pd.DataFrame,
    target_column: str = None,
    output_path: str = "monitoring/reports/drift_report.html",
):
    """
    Generate comprehensive Evidently drift report.
    """
    # Define report structure
    report = Report(metrics=[
        DataDriftPreset(),
        DatasetMissingValuesMetric(),
    ])

    # Add target drift if target column provided
    if target_column:
        report.metrics.append(TargetDriftPreset())

    # Run report
    report.run(
        reference_data=reference_data,
        current_data=current_data,
        column_mapping={
            "target": target_column,
            "prediction": "prediction" if "prediction" in current_data.columns else None,
        }
    )

    # Save HTML report
    report.save_html(output_path)

    # Extract JSON for programmatic access
    report_json = report.as_dict()

    return report_json


def generate_feature_drift_details(
    reference_data: pd.DataFrame,
    current_data: pd.DataFrame,
    features: list,
    output_dir: str = "monitoring/reports/features/",
):
    """
    Generate per-feature drift reports for detailed analysis.
    """
    import os
    os.makedirs(output_dir, exist_ok=True)

    for feature in features:
        report = Report(metrics=[
            ColumnDriftMetric(column_name=feature),
        ])

        report.run(reference_data=reference_data, current_data=current_data)
        report.save_html(f"{output_dir}/{feature}_drift.html")


# Example usage
if __name__ == "__main__":
    reference_df = pd.read_parquet("data/reference_data.parquet")
    current_df = pd.read_parquet("data/current_week_data.parquet")

    # Generate main report
    report_json = generate_drift_report(
        reference_df,
        current_df,
        target_column="conversion"
    )

    # Generate per-feature reports for drifted features
    drifted_features = [
        feature for feature, metrics in report_json["metrics"][0]["result"]["drift_by_columns"].items()
        if metrics["drift_detected"]
    ]

    if drifted_features:
        print(f"Generating detailed reports for {len(drifted_features)} drifted features")
        generate_feature_drift_details(reference_df, current_df, drifted_features)

```


## Step 4: Implement Concept Drift Detection

### Code Block 4

```python

# monitoring/concept_drift.py
import pandas as pd
import numpy as np
from sklearn.metrics import roc_auc_score, mean_squared_error, accuracy_score
from typing import Dict, List
import json


class ConceptDriftMonitor:
    """
    Monitor for concept drift by tracking model performance metrics over time.
    """
    def __init__(self, performance_threshold: float, window_size: int = 7):
        self.performance_threshold = performance_threshold
        self.window_size = window_size
        self.performance_history = []

    def detect_performance_degradation(
        self,
        predictions: np.ndarray,
        actuals: np.ndarray,
        metric: str = "auc",
    ) -> Dict:
        """
        Detect concept drift via performance degradation.
        """
        # Calculate current performance
        if metric == "auc":
            current_performance = roc_auc_score(actuals, predictions)
        elif metric == "mse":
            current_performance = mean_squared_error(actuals, predictions)
        elif metric == "accuracy":
            current_performance = accuracy_score(actuals, predictions)
        else:
            raise ValueError(f"Unknown metric: {metric}")

        # Add to history
        self.performance_history.append({
            "timestamp": pd.Timestamp.now().isoformat(),
            "metric": metric,
            "value": current_performance,
        })

        # Keep only recent window
        if len(self.performance_history) > self.window_size:
            self.performance_history = self.performance_history[-self.window_size:]

        # Detect degradation
        if len(self.performance_history) < 3:
            return {"drift_detected": False, "reason": "Insufficient history"}

        recent_avg = np.mean([h["value"] for h in self.performance_history[-3:]])
        degradation = self.performance_threshold - recent_avg

        # For metrics where lower is better (MSE), invert logic
        if metric in ["mse", "rmse", "mae"]:
            drift_detected = recent_avg > self.performance_threshold
        else:
            drift_detected = recent_avg < self.performance_threshold

        return {
            "drift_detected": drift_detected,
            "current_performance": current_performance,
            "recent_avg": recent_avg,
            "threshold": self.performance_threshold,
            "degradation": degradation,
            "history": self.performance_history[-7:],
        }


def analyze_prediction_distribution(
    historical_predictions: pd.DataFrame,
    current_predictions: np.ndarray,
) -> Dict:
    """
    Analyze shifts in prediction distribution (another concept drift signal).
    """
    hist_mean = historical_predictions["prediction"].mean()
    hist_std = historical_predictions["prediction"].std()

    curr_mean = np.mean(current_predictions)
    curr_std = np.std(current_predictions)

    # Z-score for mean shift
    mean_shift_z = abs(curr_mean - hist_mean) / hist_std

    # Variance ratio test
    variance_ratio = curr_std / hist_std

    return {
        "mean_shift_z_score": mean_shift_z,
        "mean_shift_significant": mean_shift_z > 2.0,  # 2 sigma
        "variance_ratio": variance_ratio,
        "variance_changed": variance_ratio < 0.5 or variance_ratio > 2.0,
        "historical_mean": hist_mean,
        "current_mean": curr_mean,
    }


# Example usage
if __name__ == "__main__":
    # Load recent predictions with ground truth
    df = pd.read_parquet("data/predictions_with_labels.parquet")

    monitor = ConceptDriftMonitor(performance_threshold=0.85, window_size=7)

    # Detect performance drift
    result = monitor.detect_performance_degradation(
        predictions=df["prediction"].values,
        actuals=df["actual"].values,
        metric="auc",
    )

    print(f"Concept drift detected: {result['drift_detected']}")
    if result['drift_detected']:
        print(f"Performance degraded to {result['recent_avg']:.3f} (threshold: {result['threshold']:.3f})")

```


## Step 5: Set Up Automated Alerting

### Code Block 5

```python

# monitoring/alerting.py
import requests
import json
from typing import Dict, List
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DriftAlerter:
    def __init__(self, config: Dict):
        self.config = config
        self.slack_webhook = config.get("slack_webhook_url")
        self.pagerduty_key = config.get("pagerduty_integration_key")

    def send_alert(self, drift_results: Dict, severity: str = "warning"):
        """
        Send alerts to configured channels based on drift severity.
        """
        message = self._format_alert_message(drift_results, severity)

        channels = self.config["DRIFT_CONFIG"]["alert_channels"]

        if "slack" in channels and self.slack_webhook:
            self._send_slack_alert(message, severity)

        if "pagerduty" in channels and severity == "critical":
            self._send_pagerduty_alert(message)

        if "email" in channels:
            self._send_email_alert(message, severity)

    def _format_alert_message(self, drift_results: Dict, severity: str) -> str:
        """Format drift results into alert message."""
        summary = drift_results["summary"]

        message = f"""
🚨 Model Drift Alert - {severity.upper()}

Timestamp: {drift_results['timestamp']}
Overall Drift Detected: {drift_results['overall_drift']}

Summary:
- Drifted Features: {summary['drifted_features']}/{summary['total_features']}
- Drift Share: {summary['drift_share']:.1%}

Critical Features:
"""
        # Add critical feature details
        for feature, metrics in drift_results["features"].items():
            if metrics.get("drift_detected") and feature in self.config["FEATURE_GROUPS"]["critical"]:
                if metrics["type"] == "numerical":
                    message += f"- {feature}: PSI={metrics['psi']:.3f}, KS p-value={metrics['ks_pvalue']:.4f}\n"
                else:
                    message += f"- {feature}: Chi2 p-value={metrics['pvalue']:.4f}\n"

        message += f"\nReport: monitoring/reports/drift_report.html"

        return message

    def _send_slack_alert(self, message: str, severity: str):
        """Send alert to Slack via webhook."""
        color = {"info": "#36a64f", "warning": "#ff9900", "critical": "#ff0000"}[severity]

        payload = {
            "attachments": [{
                "color": color,
                "text": message,
                "footer": "ML Drift Monitor",
                "ts": int(pd.Timestamp.now().timestamp()),
            }]
        }

        try:
            response = requests.post(self.slack_webhook, json=payload)
            response.raise_for_status()
            logger.info("Slack alert sent successfully")
        except Exception as e:
            logger.error(f"Failed to send Slack alert: {e}")

    def _send_pagerduty_alert(self, message: str):
        """Send critical alert to PagerDuty."""
        payload = {
            "routing_key": self.pagerduty_key,
            "event_action": "trigger",
            "payload": {
                "summary": "Critical Model Drift Detected",
                "severity": "critical",
                "source": "ml_drift_monitor",
                "custom_details": {"message": message},
            }
        }

        try:
            response = requests.post(
                "https://events.pagerduty.com/v2/enqueue",
                json=payload,
            )
            response.raise_for_status()
            logger.info("PagerDuty alert sent successfully")
        except Exception as e:
            logger.error(f"Failed to send PagerDuty alert: {e}")

    def _send_email_alert(self, message: str, severity: str):
        """Send email alert via SMTP or email service."""
        # Implementation depends on email service (SendGrid, SES, SMTP)
        logger.info(f"Email alert would be sent: {severity}")


# Example integration
if __name__ == "__main__":
    from drift_detector import DriftMonitor
    from config.drift_config import DRIFT_CONFIG, FEATURE_GROUPS

    # Load data and detect drift
    reference_df = pd.read_parquet("data/reference_data.parquet")
    current_df = pd.read_parquet("data/current_week_data.parquet")

    config = {
        "DRIFT_CONFIG": DRIFT_CONFIG,
        "FEATURE_GROUPS": FEATURE_GROUPS,
        "slack_webhook_url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
        "pagerduty_integration_key": "YOUR_PAGERDUTY_KEY",
    }

    monitor = DriftMonitor(reference_df, config)
    results = monitor.detect_drift(current_df)

    # Determine severity
    drift_share = results["summary"]["drift_share"]
    severity = "critical" if drift_share > 0.7 else "warning" if drift_share > 0.5 else "info"

    # Send alerts
    alerter = DriftAlerter(config)
    if results["overall_drift"]:
        alerter.send_alert(results, severity)

```


## Step 6: Schedule Monitoring Jobs

### Code Block 6

```python

# monitoring/scheduler.py
import schedule
import time
import logging
from datetime import datetime, timedelta
import pandas as pd

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('monitoring/logs/drift_monitor.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


def run_drift_check():
    """
    Main drift monitoring job.
    """
    try:
        logger.info("Starting drift monitoring job")

        # Load reference data (training set or stable period)
        reference_df = pd.read_parquet("data/reference_data.parquet")

        # Load current production data (last 7 days)
        end_date = datetime.now()
        start_date = end_date - timedelta(days=7)
        current_df = load_production_data(start_date, end_date)

        # Run drift detection
        from drift_detector import DriftMonitor
        from config.drift_config import DRIFT_CONFIG, FEATURE_GROUPS

        config = {"DRIFT_CONFIG": DRIFT_CONFIG, "FEATURE_GROUPS": FEATURE_GROUPS}
        monitor = DriftMonitor(reference_df, config)
        results = monitor.detect_drift(current_df)

        # Generate reports
        from generate_reports import generate_drift_report
        generate_drift_report(reference_df, current_df, target_column="target")

        # Send alerts if needed
        if results["overall_drift"]:
            from alerting import DriftAlerter
            alerter = DriftAlerter(config)
            drift_share = results["summary"]["drift_share"]
            severity = "critical" if drift_share > 0.7 else "warning"
            alerter.send_alert(results, severity)

        logger.info(f"Drift monitoring completed. Drift detected: {results['overall_drift']}")

    except Exception as e:
        logger.error(f"Drift monitoring failed: {e}", exc_info=True)
        # Send failure alert
        send_failure_alert(str(e))


def load_production_data(start_date: datetime, end_date: datetime) -> pd.DataFrame:
    """
    Load production data from data warehouse or feature store.
    """
    # Example: query from data warehouse
    query = f"""
    SELECT *
    FROM ml_predictions
    WHERE prediction_timestamp >= '{start_date}'
      AND prediction_timestamp < '{end_date}'
    """
    # Replace with your actual data loading logic
    # df = your_data_warehouse.query(query)
    df = pd.read_parquet("data/current_week_data.parquet")
    return df


def send_failure_alert(error_message: str):
    """Send alert when monitoring job fails."""
    # Implement failure notification
    logger.critical(f"MONITORING JOB FAILED: {error_message}")


if __name__ == "__main__":
    # Run immediately
    run_drift_check()

    # Schedule daily at 2 AM
    schedule.every().day.at("02:00").do(run_drift_check)

    logger.info("Drift monitoring scheduler started")

    # Keep running
    while True:
        schedule.run_pending()
        time.sleep(60)

```

### Code Block 7

```python

# airflow/dags/drift_monitoring_dag.py
from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta

default_args = {
    'owner': 'ml-team',
    'depends_on_past': False,
    'start_date': datetime(2024, 1, 1),
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 2,
    'retry_delay': timedelta(minutes=5),
}

dag = DAG(
    'model_drift_monitoring',
    default_args=default_args,
    description='Monitor ML model drift daily',
    schedule_interval='0 2 * * *',  # Daily at 2 AM
    catchup=False,
)

def run_drift_monitoring():
    from monitoring.scheduler import run_drift_check
    run_drift_check()

monitor_task = PythonOperator(
    task_id='monitor_drift',
    python_callable=run_drift_monitoring,
    dag=dag,
)

```
