# Run A/B Test for Models — Extended Examples

Complete configuration files and code templates.


## Step 1: Design Experiment

### Code Block 1

```python

# ab_test/experiment_config.py
from dataclasses import dataclass
from typing import List, Dict
import numpy as np
from scipy.stats import norm


@dataclass
class ExperimentConfig:
    name: str
    champion_model: str
    challenger_models: List[str]
    traffic_allocation: Dict[str, float]  # {model_name: traffic_pct}
    primary_metric: str
    secondary_metrics: List[str]
    guardrail_metrics: Dict[str, tuple]  # {metric: (min, max)}
    min_sample_size: int
    max_duration_days: int
    significance_level: float = 0.05
    power: float = 0.8
    minimum_detectable_effect: float = 0.05  # 5% relative improvement


def calculate_sample_size(
    baseline_conversion: float,
    min_detectable_effect: float,
    alpha: float = 0.05,
    power: float = 0.8,
) -> int:
    """
    Calculate required sample size per variant for binomial metric.

    Args:
        baseline_conversion: Current conversion rate (0-1)
        min_detectable_effect: Relative improvement to detect (e.g., 0.05 for 5%)
        alpha: Significance level (Type I error)
        power: Statistical power (1 - Type II error)

    Returns:
        Required sample size per variant
    """
    # Effect size (difference in proportions)
    p1 = baseline_conversion
    p2 = p1 * (1 + min_detectable_effect)

    # Pooled proportion
    p_pool = (p1 + p2) / 2

    # Z-scores for alpha and power
    z_alpha = norm.ppf(1 - alpha / 2)
    z_beta = norm.ppf(power)

    # Sample size formula for two proportions
    n = (
        (z_alpha * np.sqrt(2 * p_pool * (1 - p_pool)) +
         z_beta * np.sqrt(p1 * (1 - p1) + p2 * (1 - p2))) ** 2
    ) / ((p2 - p1) ** 2)

    return int(np.ceil(n))


# Example experiment configuration
FRAUD_DETECTION_EXPERIMENT = ExperimentConfig(
    name="fraud_model_v2_test",
    champion_model="fraud_detector_v1.3",
    challenger_models=["fraud_detector_v2.0"],
    traffic_allocation={
        "fraud_detector_v1.3": 0.95,
        "fraud_detector_v2.0": 0.05,
    },
    primary_metric="fraud_detection_rate",
    secondary_metrics=["false_positive_rate", "review_time_savings"],
    guardrail_metrics={
        "p95_latency_ms": (0, 200),
        "error_rate": (0, 0.01),
    },
    min_sample_size=10000,
    max_duration_days=14,
    minimum_detectable_effect=0.10,  # Detect 10% improvement
)

# Calculate required sample size
baseline_fraud_rate = 0.15
required_n = calculate_sample_size(
    baseline_conversion=baseline_fraud_rate,
    min_detectable_effect=0.10,  # Detect 10% improvement
    alpha=0.05,
    power=0.8,
)

print(f"Required sample size per variant: {required_n:,}")
print(f"With 5% traffic to challenger, need ~{required_n / 0.05:,.0f} total transactions")

```


## Step 2: Implement Traffic Splitting

### Code Block 2

```python

# ab_test/traffic_router.py
import hashlib
import random
from typing import Dict, Optional
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)


@dataclass
class RoutingDecision:
    model_name: str
    variant: str
    assignment_id: str


class TrafficRouter:
    def __init__(self, experiment_config: 'ExperimentConfig', seed: int = 42):
        self.config = experiment_config
        self.traffic_allocation = experiment_config.traffic_allocation
        self.seed = seed

        # Validate allocation sums to 1.0
        total = sum(self.traffic_allocation.values())
        assert abs(total - 1.0) < 0.001, f"Traffic allocation must sum to 1.0, got {total}"

        # Create cumulative buckets for routing
        self.buckets = self._create_buckets()

    def _create_buckets(self) -> Dict[str, tuple]:
        """
        Create cumulative probability buckets.
        Example: {model_a: 0.95, model_b: 0.05} ->
                 {model_a: (0, 0.95), model_b: (0.95, 1.0)}
        """
        buckets = {}
        cumsum = 0.0
        for model_name, traffic in self.traffic_allocation.items():
            buckets[model_name] = (cumsum, cumsum + traffic)
            cumsum += traffic
        return buckets

    def assign_variant(self, user_id: str) -> RoutingDecision:
        """
        Deterministically assign user to variant using consistent hashing.
        Same user_id always gets same variant during experiment.
        """
        # Hash user_id to get deterministic random value [0, 1)
        hash_value = int(
            hashlib.md5(f"{user_id}_{self.config.name}_{self.seed}".encode()).hexdigest(),
            16
        )
        random_value = (hash_value % 10000) / 10000.0

        # Find which bucket user falls into
        for model_name, (lower, upper) in self.buckets.items():
            if lower <= random_value < upper:
                return RoutingDecision(
                    model_name=model_name,
                    variant="champion" if model_name == self.config.champion_model else "challenger",
                    assignment_id=f"{user_id}_{self.config.name}",
                )

        # Fallback (should never happen)
        logger.error(f"Failed to assign variant for user {user_id}, using champion")
        return RoutingDecision(
            model_name=self.config.champion_model,
            variant="champion",
            assignment_id=f"{user_id}_{self.config.name}",
        )

    def assign_random_variant(self, session_id: str) -> RoutingDecision:
        """
        Random assignment for non-logged-in users (less stable but acceptable).
        """
        random_value = random.random()
        for model_name, (lower, upper) in self.buckets.items():
            if lower <= random_value < upper:
                return RoutingDecision(
                    model_name=model_name,
                    variant="champion" if model_name == self.config.champion_model else "challenger",
                    assignment_id=f"session_{session_id}",
                )

        return RoutingDecision(
            model_name=self.config.champion_model,
            variant="champion",
            assignment_id=f"session_{session_id}",
        )


# Example usage in prediction service
class ModelServer:
    def __init__(self, router: TrafficRouter):
        self.router = router
        self.models = self._load_models()

    def _load_models(self):
        # Load all models in experiment
        return {
            "fraud_detector_v1.3": load_model("models/fraud_v1.3.pkl"),
            "fraud_detector_v2.0": load_model("models/fraud_v2.0.pkl"),
        }

    def predict(self, user_id: str, features: dict) -> dict:
        # Assign user to variant
        assignment = self.router.assign_variant(user_id)

        # Get prediction from assigned model
        model = self.models[assignment.model_name]
        prediction = model.predict_proba(features)

        # Log assignment for analysis
        log_experiment_event({
            "user_id": user_id,
            "assignment_id": assignment.assignment_id,
            "model_name": assignment.model_name,
            "variant": assignment.variant,
            "prediction": prediction,
            "timestamp": datetime.now().isoformat(),
        })

        return {
            "prediction": prediction,
            "model_version": assignment.model_name,
        }


def load_model(path: str):
    """Load model from disk."""
    import joblib
    return joblib.load(path)


def log_experiment_event(event: dict):
    """Log to data warehouse for analysis."""
    # Example: send to Kafka or write to database
    logger.info(f"Experiment event: {event}")

```


## Step 3: Implement Shadow Deployment (Optional)

### Code Block 3

```python

# ab_test/shadow_deployment.py
import asyncio
from typing import Dict, Any
import logging
from concurrent.futures import ThreadPoolExecutor
import time

logger = logging.getLogger(__name__)


class ShadowDeployment:
    """
    Run champion and challenger in parallel, only return champion results.
    Compare predictions for consistency/debugging before live traffic split.
    """
    def __init__(self, champion_model, challenger_model, log_differences: bool = True):
        self.champion = champion_model
        self.challenger = challenger_model
        self.log_differences = log_differences
        self.executor = ThreadPoolExecutor(max_workers=2)

    def predict(self, features: Dict[str, Any]) -> Dict:
        """
        Get predictions from both models, return only champion result.
        """
        # Run both predictions in parallel
        champion_future = self.executor.submit(self._predict_champion, features)
        challenger_future = self.executor.submit(self._predict_challenger, features)

        # Wait for champion (serve immediately)
        champion_result = champion_future.result()

        # Log challenger result asynchronously
        self.executor.submit(self._log_challenger_result, challenger_future, champion_result, features)

        return champion_result

    def _predict_champion(self, features: Dict) -> Dict:
        """Get champion prediction."""
        start_time = time.time()
        prediction = self.champion.predict_proba(features)
        latency = time.time() - start_time

        return {
            "prediction": prediction,
            "model": "champion",
            "latency_ms": latency * 1000,
        }

    def _predict_challenger(self, features: Dict) -> Dict:
        """Get challenger prediction."""
        start_time = time.time()
        try:
            prediction = self.challenger.predict_proba(features)
            latency = time.time() - start_time

            return {
                "prediction": prediction,
                "model": "challenger",
                "latency_ms": latency * 1000,
                "error": None,
            }
        except Exception as e:
            logger.error(f"Challenger prediction failed: {e}")
            return {
                "prediction": None,
                "model": "challenger",
                "latency_ms": None,
                "error": str(e),
            }

    def _log_challenger_result(self, future, champion_result: Dict, features: Dict):
        """Log challenger result for offline analysis."""
        try:
            challenger_result = future.result(timeout=5.0)

            # Calculate prediction difference
            if challenger_result["prediction"] is not None:
                pred_diff = abs(
                    champion_result["prediction"] - challenger_result["prediction"]
                )

                log_entry = {
                    "timestamp": time.time(),
                    "champion_prediction": champion_result["prediction"],
                    "challenger_prediction": challenger_result["prediction"],
                    "prediction_difference": pred_diff,
                    "champion_latency_ms": champion_result["latency_ms"],
                    "challenger_latency_ms": challenger_result["latency_ms"],
                    "features": features,
                }

                # Log large differences for investigation
                if self.log_differences and pred_diff > 0.1:
                    logger.warning(f"Large prediction difference: {pred_diff:.3f}")

                # Send to analytics pipeline
                self._send_to_analytics(log_entry)

        except Exception as e:
            logger.error(f"Failed to log challenger result: {e}")

    def _send_to_analytics(self, log_entry: Dict):
        """Send shadow deployment results to analytics."""
        # Example: write to Kafka, S3, or database
        # kafka_producer.send("shadow_predictions", log_entry)
        pass


# Example usage
if __name__ == "__main__":
    champion = load_model("models/fraud_v1.3.pkl")
    challenger = load_model("models/fraud_v2.0.pkl")

    shadow = ShadowDeployment(champion, challenger, log_differences=True)

    # Serve predictions (only champion affects users)
    for request in incoming_requests:
        result = shadow.predict(request["features"])
        send_response(result)

```


## Step 4: Collect and Analyze Metrics

### Code Block 4

```python

# ab_test/analysis.py
import pandas as pd
import numpy as np
from scipy import stats
from typing import Dict, Tuple
import logging

logger = logging.getLogger(__name__)


class ExperimentAnalyzer:
    def __init__(self, experiment_config: 'ExperimentConfig'):
        self.config = experiment_config

    def load_experiment_data(self, start_date: str, end_date: str) -> pd.DataFrame:
        """
        Load experiment data from data warehouse.
        """
        query = f"""
        SELECT
            assignment_id,
            user_id,
            variant,
            model_name,
            prediction,
            outcome,  -- ground truth
            timestamp,
            latency_ms
        FROM experiment_logs
        WHERE experiment_name = '{self.config.name}'
          AND timestamp >= '{start_date}'
          AND timestamp < '{end_date}'
        """
        # df = data_warehouse.query(query)
        df = pd.read_parquet("ab_test/data/experiment_results.parquet")
        return df

    def calculate_metrics(self, df: pd.DataFrame) -> Dict[str, Dict]:
        """
        Calculate metrics for each variant.
        """
        results = {}

        for variant in df["variant"].unique():
            variant_df = df[df["variant"] == variant]

            # Primary metric (e.g., conversion rate, detection rate)
            if self.config.primary_metric == "fraud_detection_rate":
                primary_value = (variant_df["outcome"] == 1).mean()
            elif self.config.primary_metric == "conversion_rate":
                primary_value = (variant_df["outcome"] == "converted").mean()
            else:
                primary_value = variant_df["outcome"].mean()

            # Secondary metrics
            secondary = {}
            for metric in self.config.secondary_metrics:
                if metric == "false_positive_rate":
                    # FP = predicted positive, actually negative
                    secondary[metric] = (
                        (variant_df["prediction"] > 0.5) & (variant_df["outcome"] == 0)
                    ).mean()
                elif metric == "latency_ms":
                    secondary[metric] = variant_df["latency_ms"].mean()
                else:
                    secondary[metric] = variant_df[metric].mean()

            results[variant] = {
                "n_samples": len(variant_df),
                "primary_metric": primary_value,
                "secondary_metrics": secondary,
                "raw_data": variant_df,
            }

        return results

    def test_statistical_significance(
        self,
        champion_data: pd.Series,
        challenger_data: pd.Series,
        metric_type: str = "proportion",
    ) -> Tuple[float, float, Dict]:
        """
        Perform statistical test to determine if difference is significant.

        Args:
            champion_data: Champion variant metric values
            challenger_data: Challenger variant metric values
            metric_type: "proportion" (binomial) or "continuous" (t-test)

        Returns:
            (test_statistic, p_value, details_dict)
        """
        if metric_type == "proportion":
            # Two-proportion z-test
            n1, n2 = len(champion_data), len(challenger_data)
            p1, p2 = champion_data.mean(), challenger_data.mean()

            # Pooled proportion
            p_pool = (champion_data.sum() + challenger_data.sum()) / (n1 + n2)

            # Standard error
            se = np.sqrt(p_pool * (1 - p_pool) * (1/n1 + 1/n2))

            # Z-statistic
            z_stat = (p2 - p1) / se
            p_value = 2 * (1 - stats.norm.cdf(abs(z_stat)))

            # Confidence interval for difference
            diff = p2 - p1
            ci_margin = 1.96 * se

            details = {
                "champion_rate": p1,
                "challenger_rate": p2,
                "absolute_difference": diff,
                "relative_lift": (p2 - p1) / p1 if p1 > 0 else None,
                "confidence_interval": (diff - ci_margin, diff + ci_margin),
            }

            return z_stat, p_value, details

        elif metric_type == "continuous":
            # Welch's t-test (unequal variances)
            t_stat, p_value = stats.ttest_ind(
                challenger_data,
                champion_data,
                equal_var=False,
            )

            diff = challenger_data.mean() - champion_data.mean()

            details = {
                "champion_mean": champion_data.mean(),
                "challenger_mean": challenger_data.mean(),
                "absolute_difference": diff,
                "relative_change": diff / champion_data.mean() if champion_data.mean() != 0 else None,
            }

            return t_stat, p_value, details

        else:
            raise ValueError(f"Unknown metric_type: {metric_type}")

    def generate_report(self, df: pd.DataFrame) -> Dict:
        """
        Generate comprehensive experiment report.
        """
        metrics = self.calculate_metrics(df)

        champion_outcome = metrics["champion"]["raw_data"]["outcome"]
        challenger_outcome = metrics["challenger"]["raw_data"]["outcome"]

        # Test primary metric
        test_stat, p_value, details = self.test_statistical_significance(
            champion_outcome,
            challenger_outcome,
            metric_type="proportion",
        )

        # Determine winner
        is_significant = p_value < self.config.significance_level
        challenger_better = details["challenger_rate"] > details["champion_rate"]

        if is_significant and challenger_better:
            decision = "ROLLOUT_CHALLENGER"
            reason = f"Challenger significantly better (p={p_value:.4f}, lift={details['relative_lift']:.2%})"
        elif is_significant and not challenger_better:
            decision = "KEEP_CHAMPION"
            reason = f"Champion significantly better (p={p_value:.4f})"
        else:
            decision = "INCONCLUSIVE"
            reason = f"No significant difference (p={p_value:.4f})"

        report = {
            "experiment_name": self.config.name,
            "duration_days": (df["timestamp"].max() - df["timestamp"].min()).days,
            "total_samples": len(df),
            "champion_samples": metrics["champion"]["n_samples"],
            "challenger_samples": metrics["challenger"]["n_samples"],
            "primary_metric": {
                "name": self.config.primary_metric,
                "champion": details["champion_rate"],
                "challenger": details["challenger_rate"],
                "absolute_lift": details["absolute_difference"],
                "relative_lift": details["relative_lift"],
                "confidence_interval": details["confidence_interval"],
                "p_value": p_value,
                "significant": is_significant,
            },
            "decision": decision,
            "reason": reason,
        }

        return report


# Example usage
if __name__ == "__main__":
    from experiment_config import FRAUD_DETECTION_EXPERIMENT

    analyzer = ExperimentAnalyzer(FRAUD_DETECTION_EXPERIMENT)

    # Load data
    df = analyzer.load_experiment_data("2024-01-01", "2024-01-14")

    # Generate report
    report = analyzer.generate_report(df)

    print(f"Decision: {report['decision']}")
    print(f"Reason: {report['reason']}")
    print(f"Primary metric lift: {report['primary_metric']['relative_lift']:.2%}")
    print(f"P-value: {report['primary_metric']['p_value']:.4f}")

```


## Step 5: Monitor Guardrail Metrics

### Code Block 5

```python

# ab_test/guardrails.py
import pandas as pd
import logging
from typing import Dict, List

logger = logging.getLogger(__name__)


class GuardrailMonitor:
    def __init__(self, experiment_config: 'ExperimentConfig'):
        self.config = experiment_config
        self.guardrails = experiment_config.guardrail_metrics
        self.violations = []

    def check_guardrails(self, df: pd.DataFrame) -> Dict:
        """
        Check if challenger violates any guardrail thresholds.
        """
        challenger_df = df[df["variant"] == "challenger"]

        violations = []
        metrics = {}

        for metric_name, (min_threshold, max_threshold) in self.guardrails.items():
            # Calculate metric
            if metric_name == "p95_latency_ms":
                metric_value = challenger_df["latency_ms"].quantile(0.95)
            elif metric_name == "error_rate":
                metric_value = (challenger_df["error"] == 1).mean()
            elif metric_name == "timeout_rate":
                metric_value = (challenger_df["timeout"] == 1).mean()
            else:
                metric_value = challenger_df[metric_name].mean()

            # Check thresholds
            violated = (metric_value < min_threshold or metric_value > max_threshold)

            if violated:
                violation = {
                    "metric": metric_name,
                    "value": metric_value,
                    "threshold": (min_threshold, max_threshold),
                    "timestamp": pd.Timestamp.now(),
                }
                violations.append(violation)
                logger.error(f"Guardrail violation: {metric_name}={metric_value:.3f}")

            metrics[metric_name] = {
                "value": metric_value,
                "threshold": (min_threshold, max_threshold),
                "violated": violated,
            }

        self.violations.extend(violations)

        return {
            "has_violations": len(violations) > 0,
            "violations": violations,
            "metrics": metrics,
        }

    def should_stop_experiment(self, violation_count: int = 3) -> bool:
        """
        Determine if experiment should be stopped due to repeated violations.
        """
        recent_violations = [
            v for v in self.violations
            if (pd.Timestamp.now() - v["timestamp"]).total_seconds() < 3600  # Last hour
        ]

        return len(recent_violations) >= violation_count


# Example monitoring loop
def monitor_experiment_health():
    """
    Continuous monitoring job that checks guardrails every 5 minutes.
    """
    import time
    from experiment_config import FRAUD_DETECTION_EXPERIMENT

    monitor = GuardrailMonitor(FRAUD_DETECTION_EXPERIMENT)

    while True:
        # Load recent data (last 15 minutes)
        df = load_recent_experiment_data(minutes=15)

        # Check guardrails
        result = monitor.check_guardrails(df)

        if result["has_violations"]:
            logger.warning(f"Guardrail violations detected: {result['violations']}")

            # Send alert
            send_alert(f"Experiment {FRAUD_DETECTION_EXPERIMENT.name} has guardrail violations")

            # Stop experiment if too many violations
            if monitor.should_stop_experiment(violation_count=3):
                logger.critical("Stopping experiment due to repeated violations")
                stop_experiment(FRAUD_DETECTION_EXPERIMENT.name)
                break

        time.sleep(300)  # Check every 5 minutes


def load_recent_experiment_data(minutes: int = 15) -> pd.DataFrame:
    """Load data from last N minutes."""
    # Implementation depends on data pipeline
    pass


def stop_experiment(experiment_name: str):
    """
    Emergency stop: route all traffic back to champion.
    """
    # Update routing configuration to 100% champion
    logger.info(f"Stopping experiment: {experiment_name}")


def send_alert(message: str):
    """Send alert to on-call team."""
    logger.info(f"Alert: {message}")

```


## Step 6: Make Rollout Decision

### Code Block 6

```python

# ab_test/rollout_decision.py
import logging
from typing import Dict
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class RolloutPlan:
    decision: str  # "full_rollout", "gradual_rollout", "rollback", "extend_test"
    reason: str
    next_steps: list
    risk_level: str


def make_rollout_decision(experiment_report: Dict) -> RolloutPlan:
    """
    Determine rollout plan based on experiment results.
    """
    primary = experiment_report["primary_metric"]

    # Check statistical significance
    if not primary["significant"]:
        if experiment_report["duration_days"] >= 14:
            return RolloutPlan(
                decision="keep_champion",
                reason="No significant difference after 14 days",
                next_steps=[
                    "Consider testing larger changes",
                    "Analyze per-segment performance",
                ],
                risk_level="low",
            )
        else:
            return RolloutPlan(
                decision="extend_test",
                reason="Not yet significant, need more data",
                next_steps=[
                    f"Continue test until {experiment_report['champion_samples'] * 2} samples",
                    "Monitor for seasonal effects",
                ],
                risk_level="low",
            )

    # Challenger significantly better
    if primary["challenger"] > primary["champion"]:
        relative_lift = primary["relative_lift"]

        if relative_lift > 0.20:
            # Large improvement: full rollout
            return RolloutPlan(
                decision="full_rollout",
                reason=f"Large significant improvement ({relative_lift:.1%} lift)",
                next_steps=[
                    "Update routing to 100% challenger",
                    "Archive champion model as v1_backup",
                    "Update monitoring dashboards",
                ],
                risk_level="low",
            )
        elif relative_lift > 0.05:
            # Moderate improvement: gradual rollout
            return RolloutPlan(
                decision="gradual_rollout",
                reason=f"Moderate improvement ({relative_lift:.1%} lift)",
                next_steps=[
                    "Week 1: Increase to 25% traffic",
                    "Week 2: Increase to 50% traffic",
                    "Week 3: Increase to 100% if stable",
                ],
                risk_level="medium",
            )
        else:
            # Small improvement: may not be worth complexity
            return RolloutPlan(
                decision="keep_champion",
                reason=f"Improvement too small to justify change ({relative_lift:.1%})",
                next_steps=[
                    "Consider cost/benefit of model complexity",
                    "Test on high-value user segments only",
                ],
                risk_level="low",
            )

    # Champion better: rollback
    else:
        return RolloutPlan(
            decision="rollback",
            reason="Challenger performed worse than champion",
            next_steps=[
                "Immediately route 100% to champion",
                "Investigate why challenger underperformed",
                "Retrain with more recent data",
            ],
            risk_level="critical",
        )


# Example usage
if __name__ == "__main__":
    from analysis import ExperimentAnalyzer
    from experiment_config import FRAUD_DETECTION_EXPERIMENT

    analyzer = ExperimentAnalyzer(FRAUD_DETECTION_EXPERIMENT)
    df = analyzer.load_experiment_data("2024-01-01", "2024-01-14")
    report = analyzer.generate_report(df)

    # Make decision
    plan = make_rollout_decision(report)

    print(f"Decision: {plan.decision}")
    print(f"Reason: {plan.reason}")
    print(f"Risk: {plan.risk_level}")
    print("\nNext steps:")
    for step in plan.next_steps:
        print(f"  - {step}")

```
