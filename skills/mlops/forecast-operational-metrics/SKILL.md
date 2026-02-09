---
name: forecast-operational-metrics
description: >
  Forecast infrastructure and application metrics using Prophet or statsmodels for capacity
  planning, cost optimization, and proactive scaling. Visualize predictions in Grafana and
  set up alerts for projected resource exhaustion.
license: MIT
allowed-tools: Read Write Edit Bash Grep Glob
metadata:
  author: Philipp Thoss
  version: "1.0"
  domain: mlops
  complexity: intermediate
  language: multi
  tags: forecasting, prophet, statsmodels, capacity, time-series, grafana
---

# Forecast Operational Metrics

Predict future resource usage and system metrics for capacity planning and cost optimization.

## When to Use

- Need to forecast infrastructure capacity needs (CPU, memory, disk, network)
- Planning hardware/cloud resource procurement for next quarter
- Want to predict cost trends and optimize cloud spending
- Need to set up proactive scaling policies based on predicted load
- Forecasting user traffic for event planning
- Predicting database storage growth for backup planning
- Estimating API usage for rate limiting configuration

## Inputs

- **Required**: Historical time series metrics (3-12 months minimum)
- **Required**: Metric type (CPU, memory, requests/sec, costs, etc.)
- **Required**: Forecast horizon (days, weeks, or months ahead)
- **Optional**: Known future events (deployments, marketing campaigns, holidays)
- **Optional**: Seasonality information (daily, weekly, yearly patterns)
- **Optional**: External regressors (e.g., marketing spend, user signups)

## Procedure

### Step 1: Set Up Environment and Load Data

Install forecasting libraries and prepare time series data.

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install forecasting libraries
pip install prophet statsmodels pandas numpy
pip install plotly matplotlib seaborn  # Visualization
pip install prometheus-api-client influxdb-client  # Data sources
pip install grafana-api  # For pushing forecasts to Grafana
```

Load and prepare data:

```python
# forecasting/data_loader.py
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Optional, Dict, List
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MetricsLoader:
    """
    Load operational metrics from various sources.
    """
    def __init__(self, prometheus_url: str = None, influxdb_config: Dict = None):
        self.prometheus_url = prometheus_url
        self.influxdb_config = influxdb_config

    def load_from_prometheus(
        self,
        query: str,
        lookback_days: int = 90,
        step: str = "1h",
    ) -> pd.DataFrame:
        """
        Load historical metrics from Prometheus.
        """
        from prometheus_api_client import PrometheusConnect

        prom = PrometheusConnect(url=self.prometheus_url, disable_ssl=True)

        end_time = datetime.now()
        start_time = end_time - timedelta(days=lookback_days)

        result = prom.custom_query_range(
            query=query,
            start_time=start_time,
            end_time=end_time,
            step=step,
        )

        # Convert to DataFrame
        data = []
        for series in result:
            for timestamp, value in series["values"]:
                data.append({
                    "timestamp": datetime.fromtimestamp(timestamp),
                    "value": float(value),
                })

        df = pd.DataFrame(data)
        return df

    def load_from_csv(self, filepath: str) -> pd.DataFrame:
        """
        Load metrics from CSV.
        Expected columns: timestamp, value
        """
        df = pd.read_csv(filepath)
        df["timestamp"] = pd.to_datetime(df["timestamp"])
        return df

    def resample_and_aggregate(
        self,
        df: pd.DataFrame,
        freq: str = "1H",
        agg_func: str = "mean",
    ) -> pd.DataFrame:
        """
        Resample time series to regular intervals.

        Args:
            df: DataFrame with timestamp and value columns
            freq: Resample frequency (e.g., "1H", "1D", "1W")
            agg_func: Aggregation function ("mean", "sum", "max", "min")
        """
        df = df.set_index("timestamp")

        if agg_func == "mean":
            resampled = df.resample(freq).mean()
        elif agg_func == "sum":
            resampled = df.resample(freq).sum()
        elif agg_func == "max":
            resampled = df.resample(freq).max()
        elif agg_func == "min":
            resampled = df.resample(freq).min()
        else:
            raise ValueError(f"Unknown agg_func: {agg_func}")

        # Fill missing values
        resampled = resampled.interpolate(method="time")

        return resampled.reset_index()

    def add_external_regressors(
        self,
        df: pd.DataFrame,
        regressors: Dict[str, pd.Series],
    ) -> pd.DataFrame:
        """
        Add external regressors (e.g., marketing spend, events).

        Args:
            df: Base time series
            regressors: Dict of {name: time series}
        """
        for name, series in regressors.items():
            df[name] = series.reindex(df["timestamp"]).values

        return df


# Example usage
if __name__ == "__main__":
    loader = MetricsLoader(prometheus_url="http://prometheus:9090")

    # Load CPU usage for last 90 days
    df = loader.load_from_prometheus(
        query='avg(rate(container_cpu_usage_seconds_total[5m]))',
        lookback_days=90,
        step="1h",
    )

    # Resample to daily
    df_daily = loader.resample_and_aggregate(df, freq="1D", agg_func="mean")

    print(f"Loaded {len(df_daily)} days of data")
    print(df_daily.head())
```

**Expected:** Time series data loaded with regular intervals, missing values filled, ready for forecasting.

**On failure:** If data gaps exist, use forward-fill or interpolation, ensure lookback period has sufficient data (90+ days recommended), verify timestamp timezone consistency, check for outliers (>5 sigma) that may skew forecasts.

### Step 2: Implement Prophet Forecasting

Use Facebook Prophet for automatic seasonality detection and forecasting.

```python
# forecasting/prophet_forecaster.py
from prophet import Prophet
import pandas as pd
import numpy as np
from typing import Dict, Optional, List
import logging

logger = logging.getLogger(__name__)


class ProphetForecaster:
    """
    Forecast operational metrics using Prophet.
    """
    def __init__(
        self,
        growth: str = "linear",  # or "logistic" for bounded growth
        daily_seasonality: bool = True,
        weekly_seasonality: bool = True,
        yearly_seasonality: bool = True,
        seasonality_mode: str = "multiplicative",  # or "additive"
    ):
        self.growth = growth
        self.model = None
        self.prophet_params = {
            "growth": growth,
            "daily_seasonality": daily_seasonality,
            "weekly_seasonality": weekly_seasonality,
            "yearly_seasonality": yearly_seasonality,
            "seasonality_mode": seasonality_mode,
        }

    def prepare_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Convert DataFrame to Prophet format (ds, y columns).
        """
        prophet_df = df[["timestamp", "value"]].copy()
        prophet_df.columns = ["ds", "y"]

        # Handle missing values
        prophet_df = prophet_df.dropna()

        # For logistic growth, need cap and floor
        if self.growth == "logistic":
            # Set cap to 1.5x historical max (adjust as needed)
            prophet_df["cap"] = prophet_df["y"].max() * 1.5
            prophet_df["floor"] = 0

        return prophet_df

    def fit(
        self,
        df: pd.DataFrame,
        regressors: Optional[List[str]] = None,
        holidays: Optional[pd.DataFrame] = None,
    ):
        """
        Train Prophet model on historical data.

        Args:
            df: DataFrame with timestamp and value columns
            regressors: List of additional regressor column names
            holidays: DataFrame with holiday dates and names
        """
        prophet_df = self.prepare_data(df)

        # Initialize model
        self.model = Prophet(**self.prophet_params)

        # Add regressors if provided
        if regressors:
            for regressor in regressors:
                self.model.add_regressor(regressor)

        # Add holidays if provided
        if holidays is not None:
            self.model.holidays = holidays

        # Fit model
        self.model.fit(prophet_df)

        logger.info("Prophet model trained successfully")

    def forecast(
        self,
        periods: int,
        freq: str = "D",
        include_history: bool = True,
    ) -> pd.DataFrame:
        """
        Generate forecast for future periods.

        Args:
            periods: Number of periods to forecast
            freq: Frequency of forecast ("D" for daily, "H" for hourly)
            include_history: Include historical data in output

        Returns:
            DataFrame with forecast (ds, yhat, yhat_lower, yhat_upper)
        """
        if self.model is None:
            raise ValueError("Model not trained. Call fit() first.")

        # Generate future dates
        future = self.model.make_future_dataframe(
            periods=periods,
            freq=freq,
            include_history=include_history,
        )

        # For logistic growth, add cap and floor to future
        if self.growth == "logistic":
            future["cap"] = self.model.history["cap"].iloc[0]
            future["floor"] = 0

        # Generate forecast
        forecast = self.model.predict(future)

        return forecast[["ds", "yhat", "yhat_lower", "yhat_upper", "trend"]]

    def plot_forecast(self, forecast: pd.DataFrame, save_path: str = None):
        """
        Visualize forecast with uncertainty intervals.
        """
        import matplotlib.pyplot as plt

        fig = self.model.plot(forecast, figsize=(12, 6))
        plt.title("Operational Metrics Forecast")
        plt.xlabel("Date")
        plt.ylabel("Metric Value")

        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches="tight")
            logger.info(f"Forecast plot saved to {save_path}")

        return fig

    def plot_components(self, forecast: pd.DataFrame, save_path: str = None):
        """
        Visualize trend and seasonality components.
        """
        fig = self.model.plot_components(forecast, figsize=(12, 10))

        if save_path:
            fig.savefig(save_path, dpi=300, bbox_inches="tight")
            logger.info(f"Components plot saved to {save_path}")

        return fig

    def cross_validate(
        self,
        initial: str = "90 days",
        period: str = "30 days",
        horizon: str = "30 days",
    ) -> pd.DataFrame:
        """
        Perform time series cross-validation.

        Args:
            initial: Initial training period
            period: Spacing between cutoff dates
            horizon: Forecast horizon for each cutoff

        Returns:
            DataFrame with cross-validation results
        """
        from prophet.diagnostics import cross_validation, performance_metrics

        cv_results = cross_validation(
            self.model,
            initial=initial,
            period=period,
            horizon=horizon,
        )

        # Calculate performance metrics
        metrics = performance_metrics(cv_results)

        logger.info(f"Cross-validation MAPE: {metrics['mape'].mean():.2%}")
        logger.info(f"Cross-validation MAE: {metrics['mae'].mean():.2f}")

        return cv_results, metrics


# Example usage
if __name__ == "__main__":
    from data_loader import MetricsLoader

    # Load data
    loader = MetricsLoader()
    df = loader.load_from_csv("data/cpu_usage_90days.csv")
    df_daily = loader.resample_and_aggregate(df, freq="1D")

    # Train forecaster
    forecaster = ProphetForecaster(
        growth="linear",
        seasonality_mode="multiplicative",
    )

    forecaster.fit(df_daily)

    # Forecast next 30 days
    forecast = forecaster.forecast(periods=30, freq="D")

    print(forecast.tail(10))  # Last 10 forecast points

    # Visualize
    forecaster.plot_forecast(forecast, save_path="results/cpu_forecast.png")
    forecaster.plot_components(forecast, save_path="results/cpu_components.png")

    # Cross-validate
    cv_results, metrics = forecaster.cross_validate()
    print(f"\nForecast accuracy (MAPE): {metrics['mape'].mean():.2%}")
```

**Expected:** Forecast generated for 30+ days ahead with confidence intervals, seasonal patterns captured in components plot, cross-validation MAPE < 15%.

**On failure:** If forecast looks unrealistic, try different growth model (linear vs logistic), if seasonality missing adjust seasonality_mode, if accuracy poor (<70% MAPE) add more historical data or external regressors, check for data quality issues.

### Step 3: Implement ARIMA/SARIMAX Forecasting (Alternative)

Use statsmodels for traditional time series forecasting.

```python
# forecasting/arima_forecaster.py
from statsmodels.tsa.statespace.sarimax import SARIMAX
from statsmodels.tsa.stattools import adfuller
from statsmodels.graphics.tsaplots import plot_acf, plot_pacf
import pandas as pd
import numpy as np
import logging
import warnings

warnings.filterwarnings('ignore')
logger = logging.getLogger(__name__)


class ARIMAForecaster:
    """
    Forecast using ARIMA/SARIMAX models from statsmodels.
    """
    def __init__(
        self,
        order: tuple = (1, 1, 1),  # (p, d, q)
        seasonal_order: tuple = (1, 1, 1, 7),  # (P, D, Q, s) - s=7 for weekly
    ):
        self.order = order
        self.seasonal_order = seasonal_order
        self.model = None
        self.fitted_model = None

    def check_stationarity(self, series: pd.Series) -> Dict:
        """
        Check if time series is stationary using ADF test.
        """
        result = adfuller(series.dropna())

        return {
            "adf_statistic": result[0],
            "p_value": result[1],
            "is_stationary": result[1] < 0.05,  # p-value < 0.05
            "critical_values": result[4],
        }

    def difference_series(self, series: pd.Series, order: int = 1) -> pd.Series:
        """
        Difference the series to make it stationary.
        """
        differenced = series.copy()
        for i in range(order):
            differenced = differenced.diff().dropna()
        return differenced

    def fit(self, df: pd.DataFrame, exog: pd.DataFrame = None):
        """
        Train SARIMAX model.

        Args:
            df: DataFrame with timestamp and value columns
            exog: External regressors (optional)
        """
        # Prepare data
        series = df.set_index("timestamp")["value"]

        # Check stationarity
        stationarity = self.check_stationarity(series)
        logger.info(f"Stationarity test: p-value={stationarity['p_value']:.4f}")

        # Fit SARIMAX model
        self.model = SARIMAX(
            series,
            exog=exog,
            order=self.order,
            seasonal_order=self.seasonal_order,
            enforce_stationarity=False,
            enforce_invertibility=False,
        )

        self.fitted_model = self.model.fit(disp=False)

        logger.info(f"SARIMAX model fitted with AIC: {self.fitted_model.aic:.2f}")

    def forecast(
        self,
        steps: int,
        exog_future: pd.DataFrame = None,
        return_conf_int: bool = True,
    ) -> pd.DataFrame:
        """
        Generate forecast for future periods.

        Args:
            steps: Number of steps ahead to forecast
            exog_future: Future values of external regressors
            return_conf_int: Include confidence intervals

        Returns:
            DataFrame with forecast and confidence intervals
        """
        if self.fitted_model is None:
            raise ValueError("Model not fitted. Call fit() first.")

        # Generate forecast
        forecast_result = self.fitted_model.forecast(steps=steps, exog=exog_future)

        # Get confidence intervals
        if return_conf_int:
            forecast_conf_int = self.fitted_model.get_forecast(
                steps=steps,
                exog=exog_future,
            ).conf_int()

            forecast_df = pd.DataFrame({
                "forecast": forecast_result,
                "lower": forecast_conf_int.iloc[:, 0],
                "upper": forecast_conf_int.iloc[:, 1],
            })
        else:
            forecast_df = pd.DataFrame({
                "forecast": forecast_result,
            })

        return forecast_df

    def diagnose(self):
        """
        Generate diagnostic plots for model residuals.
        """
        if self.fitted_model is None:
            raise ValueError("Model not fitted.")

        fig = self.fitted_model.plot_diagnostics(figsize=(12, 8))
        return fig

    def summary(self) -> str:
        """
        Get model summary statistics.
        """
        if self.fitted_model is None:
            raise ValueError("Model not fitted.")

        return self.fitted_model.summary()


# Auto-selection of ARIMA parameters
def auto_arima(series: pd.Series, seasonal: bool = True) -> tuple:
    """
    Automatically select best ARIMA parameters using grid search.
    """
    from itertools import product

    # Parameter ranges
    p_range = range(0, 3)
    d_range = range(0, 2)
    q_range = range(0, 3)

    if seasonal:
        P_range = range(0, 2)
        D_range = range(0, 2)
        Q_range = range(0, 2)
        s = 7  # Weekly seasonality
    else:
        P_range = [0]
        D_range = [0]
        Q_range = [0]
        s = 0

    best_aic = np.inf
    best_order = None
    best_seasonal_order = None

    # Grid search
    for (p, d, q) in product(p_range, d_range, q_range):
        for (P, D, Q) in product(P_range, D_range, Q_range):
            try:
                model = SARIMAX(
                    series,
                    order=(p, d, q),
                    seasonal_order=(P, D, Q, s) if seasonal else (0, 0, 0, 0),
                )
                fitted = model.fit(disp=False)

                if fitted.aic < best_aic:
                    best_aic = fitted.aic
                    best_order = (p, d, q)
                    best_seasonal_order = (P, D, Q, s)

            except:
                continue

    logger.info(f"Best ARIMA order: {best_order}, seasonal: {best_seasonal_order}")
    logger.info(f"Best AIC: {best_aic:.2f}")

    return best_order, best_seasonal_order


# Example usage
if __name__ == "__main__":
    from data_loader import MetricsLoader

    # Load data
    loader = MetricsLoader()
    df = loader.load_from_csv("data/requests_per_sec_90days.csv")
    df_hourly = loader.resample_and_aggregate(df, freq="1H")

    # Auto-select parameters
    series = df_hourly.set_index("timestamp")["value"]
    best_order, best_seasonal = auto_arima(series, seasonal=True)

    # Train forecaster
    forecaster = ARIMAForecaster(order=best_order, seasonal_order=best_seasonal)
    forecaster.fit(df_hourly)

    # Forecast next 7 days (168 hours)
    forecast = forecaster.forecast(steps=168)

    print(forecast.head(24))  # Next 24 hours

    # Model diagnostics
    print(forecaster.summary())
```

**Expected:** ARIMA model fitted with optimal parameters, forecast generated with confidence intervals, diagnostic plots show white noise residuals.

**On failure:** If model doesn't converge, simplify parameters (reduce p, q, P, Q), if forecast has wrong trend check differencing order (d, D), if residuals not white noise add more AR/MA terms, ensure series length >2x seasonal period.

### Step 4: Identify Capacity Thresholds and Alerts

Analyze forecast to predict when resources will be exhausted.

```python
# forecasting/capacity_planning.py
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Tuple
import logging

logger = logging.getLogger(__name__)


class CapacityPlanner:
    """
    Analyze forecasts for capacity planning and alert thresholds.
    """
    def __init__(self, capacity_limit: float, warning_threshold: float = 0.8):
        self.capacity_limit = capacity_limit
        self.warning_threshold = warning_threshold

    def find_exhaustion_date(
        self,
        forecast: pd.DataFrame,
        timestamp_column: str = "ds",
        value_column: str = "yhat",
    ) -> Tuple[datetime, int]:
        """
        Find when forecast exceeds capacity limit.

        Returns:
            (exhaustion_date, days_until_exhaustion)
        """
        # Find first point where forecast exceeds limit
        exceeded = forecast[forecast[value_column] >= self.capacity_limit]

        if len(exceeded) == 0:
            logger.info("Capacity not exceeded within forecast horizon")
            return None, None

        exhaustion_date = exceeded.iloc[0][timestamp_column]

        # Calculate days until exhaustion
        days_until = (exhaustion_date - datetime.now()).days

        return exhaustion_date, days_until

    def find_warning_date(
        self,
        forecast: pd.DataFrame,
        timestamp_column: str = "ds",
        value_column: str = "yhat",
    ) -> Tuple[datetime, int]:
        """
        Find when forecast exceeds warning threshold.
        """
        warning_limit = self.capacity_limit * self.warning_threshold

        exceeded = forecast[forecast[value_column] >= warning_limit]

        if len(exceeded) == 0:
            return None, None

        warning_date = exceeded.iloc[0][timestamp_column]
        days_until = (warning_date - datetime.now()).days

        return warning_date, days_until

    def calculate_growth_rate(
        self,
        forecast: pd.DataFrame,
        value_column: str = "yhat",
    ) -> Dict:
        """
        Calculate growth rate from forecast trend.
        """
        # Use first and last forecast points
        start_value = forecast.iloc[0][value_column]
        end_value = forecast.iloc[-1][value_column]
        periods = len(forecast)

        # Calculate CAGR (Compound Annual Growth Rate)
        if start_value > 0:
            growth_rate = (end_value / start_value) ** (1 / periods) - 1
        else:
            growth_rate = 0

        # Daily growth
        daily_growth = (end_value - start_value) / periods

        return {
            "growth_rate": growth_rate,
            "daily_growth": daily_growth,
            "start_value": start_value,
            "end_value": end_value,
            "total_growth_pct": (end_value - start_value) / start_value if start_value > 0 else 0,
        }

    def generate_capacity_report(self, forecast: pd.DataFrame) -> Dict:
        """
        Generate comprehensive capacity planning report.
        """
        exhaustion_date, days_until_exhaustion = self.find_exhaustion_date(forecast)
        warning_date, days_until_warning = self.find_warning_date(forecast)
        growth = self.calculate_growth_rate(forecast)

        # Current usage
        current_value = forecast.iloc[0]["yhat"]
        current_utilization = current_value / self.capacity_limit

        report = {
            "current_value": current_value,
            "current_utilization": current_utilization,
            "capacity_limit": self.capacity_limit,
            "warning_threshold": self.warning_threshold,
            "warning_date": warning_date,
            "days_until_warning": days_until_warning,
            "exhaustion_date": exhaustion_date,
            "days_until_exhaustion": days_until_exhaustion,
            "growth_rate_daily": growth["daily_growth"],
            "growth_rate_pct": growth["total_growth_pct"],
            "forecast_horizon_days": len(forecast),
        }

        return report

    def recommend_scaling_action(self, report: Dict) -> Dict:
        """
        Generate scaling recommendations based on forecast.
        """
        if report["days_until_exhaustion"] is None:
            return {
                "urgency": "low",
                "action": "No action needed",
                "reason": "Capacity sufficient for forecast horizon",
            }

        days_until = report["days_until_exhaustion"]

        if days_until < 7:
            return {
                "urgency": "critical",
                "action": "Scale immediately",
                "reason": f"Capacity exhaustion in {days_until} days",
                "recommendation": f"Add {(report['capacity_limit'] * 0.5):.0f} units capacity",
            }
        elif days_until < 30:
            return {
                "urgency": "high",
                "action": "Plan scaling within 1 week",
                "reason": f"Capacity exhaustion in {days_until} days",
                "recommendation": f"Add {(report['capacity_limit'] * 0.3):.0f} units capacity",
            }
        elif days_until < 90:
            return {
                "urgency": "medium",
                "action": "Plan scaling within 1 month",
                "reason": f"Capacity exhaustion in {days_until} days",
                "recommendation": f"Add {(report['capacity_limit'] * 0.2):.0f} units capacity",
            }
        else:
            return {
                "urgency": "low",
                "action": "Monitor trends",
                "reason": f"Capacity sufficient for {days_until} days",
            }


# Example usage
if __name__ == "__main__":
    from prophet_forecaster import ProphetForecaster
    from data_loader import MetricsLoader

    # Load and forecast
    loader = MetricsLoader()
    df = loader.load_from_csv("data/storage_usage_gb.csv")

    forecaster = ProphetForecaster()
    forecaster.fit(df)
    forecast = forecaster.forecast(periods=90)  # 90 days

    # Capacity planning
    planner = CapacityPlanner(
        capacity_limit=1000,  # 1TB storage
        warning_threshold=0.8,  # Alert at 80%
    )

    report = planner.generate_capacity_report(forecast)

    print("=== Capacity Planning Report ===")
    print(f"Current Usage: {report['current_value']:.1f} GB ({report['current_utilization']:.1%})")
    print(f"Capacity Limit: {report['capacity_limit']} GB")
    print(f"Warning Date: {report['warning_date']}")
    print(f"Exhaustion Date: {report['exhaustion_date']}")
    print(f"Growth Rate: {report['growth_rate_pct']:.1%} over {report['forecast_horizon_days']} days")

    # Get recommendations
    recommendation = planner.recommend_scaling_action(report)
    print(f"\nRecommendation:")
    print(f"  Urgency: {recommendation['urgency'].upper()}")
    print(f"  Action: {recommendation['action']}")
    print(f"  Reason: {recommendation['reason']}")
```

**Expected:** Report shows when capacity limits will be reached, recommendations provided with urgency levels, growth rates calculated.

**On failure:** If exhaustion date unrealistic, verify capacity_limit is correct, if growth rate too high check for outliers in historical data, consider non-linear growth models for mature systems.

### Step 5: Visualize Forecasts in Grafana

Push forecast data to Grafana for real-time monitoring.

```python
# forecasting/grafana_integration.py
import requests
import pandas as pd
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class GrafanaForecaster:
    """
    Push forecast data to Grafana via SimpleJson datasource or annotations.
    """
    def __init__(
        self,
        grafana_url: str,
        api_key: str,
        dashboard_uid: str = None,
    ):
        self.grafana_url = grafana_url.rstrip("/")
        self.api_key = api_key
        self.dashboard_uid = dashboard_uid
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

    def create_annotation(
        self,
        text: str,
        tags: list,
        time: datetime = None,
    ):
        """
        Create annotation in Grafana for forecast events.
        """
        if time is None:
            time = datetime.now()

        payload = {
            "dashboardUID": self.dashboard_uid,
            "text": text,
            "tags": tags,
            "time": int(time.timestamp() * 1000),  # Milliseconds
        }

        url = f"{self.grafana_url}/api/annotations"
        response = requests.post(url, json=payload, headers=self.headers)

        if response.status_code == 200:
            logger.info(f"Annotation created: {text}")
        else:
            logger.error(f"Failed to create annotation: {response.text}")

    def create_capacity_alert_annotation(self, capacity_report: dict):
        """
        Create Grafana annotation for capacity warnings.
        """
        if capacity_report["days_until_warning"]:
            text = (
                f"⚠️ Capacity Warning: {capacity_report['warning_threshold']:.0%} "
                f"threshold will be reached in {capacity_report['days_until_warning']} days"
            )
            self.create_annotation(
                text=text,
                tags=["forecast", "capacity", "warning"],
                time=capacity_report["warning_date"],
            )

        if capacity_report["days_until_exhaustion"]:
            text = (
                f"🔴 Capacity Exhaustion: Limit will be reached in "
                f"{capacity_report['days_until_exhaustion']} days"
            )
            self.create_annotation(
                text=text,
                tags=["forecast", "capacity", "critical"],
                time=capacity_report["exhaustion_date"],
            )


# Alternative: Export to CSV for Grafana CSV datasource
def export_forecast_to_csv(forecast: pd.DataFrame, output_path: str):
    """
    Export forecast in format compatible with Grafana CSV datasource.
    """
    # Grafana CSV format: timestamp, value, forecast_lower, forecast_upper
    export_df = forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]].copy()
    export_df.columns = ["time", "value", "lower_bound", "upper_bound"]

    # Convert timestamp to Unix epoch (seconds)
    export_df["time"] = export_df["time"].astype(int) // 10**9

    export_df.to_csv(output_path, index=False)
    logger.info(f"Forecast exported to {output_path}")


# Example usage
if __name__ == "__main__":
    from prophet_forecaster import ProphetForecaster
    from capacity_planning import CapacityPlanner

    # Generate forecast
    # ... (forecast generation code)

    # Push to Grafana
    grafana = GrafanaForecaster(
        grafana_url="http://grafana:3000",
        api_key="YOUR_GRAFANA_API_KEY",
        dashboard_uid="your-dashboard-uid",
    )

    # Create capacity alert annotations
    # capacity_report = {...}
    # grafana.create_capacity_alert_annotation(capacity_report)

    # Export forecast for CSV datasource
    export_forecast_to_csv(forecast, "grafana/forecasts/cpu_forecast.csv")
```

**Expected:** Forecast annotations appear in Grafana dashboards, capacity warnings visible as vertical markers, forecast data accessible via CSV datasource.

**On failure:** Verify Grafana API key has correct permissions, check dashboard UID is correct, ensure timestamps in milliseconds for annotations, test API with curl before integrating.

### Step 6: Automate Forecast Generation

Set up scheduled jobs to generate forecasts regularly.

```python
# forecasting/scheduler.py
import schedule
import time
import logging
from datetime import datetime, timedelta
from data_loader import MetricsLoader
from prophet_forecaster import ProphetForecaster
from capacity_planning import CapacityPlanner
from grafana_integration import GrafanaForecaster, export_forecast_to_csv
import pandas as pd

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/forecasting.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


def generate_daily_forecast():
    """
    Generate forecast for all monitored metrics.
    """
    try:
        logger.info("Starting daily forecast generation")

        # Metrics to forecast
        metrics_config = [
            {
                "name": "cpu_usage",
                "query": "avg(rate(container_cpu_usage_seconds_total[5m]))",
                "capacity_limit": 0.8,  # 80% CPU
                "forecast_days": 30,
            },
            {
                "name": "memory_usage",
                "query": "sum(container_memory_usage_bytes) / 1e9",  # GB
                "capacity_limit": 32,  # 32 GB
                "forecast_days": 30,
            },
            {
                "name": "disk_usage",
                "query": "sum(node_filesystem_size_bytes - node_filesystem_free_bytes) / 1e9",
                "capacity_limit": 500,  # 500 GB
                "forecast_days": 90,
            },
        ]

        # Load data and generate forecasts
        loader = MetricsLoader(prometheus_url="http://prometheus:9090")

        for metric_config in metrics_config:
            logger.info(f"Forecasting {metric_config['name']}")

            # Load historical data
            df = loader.load_from_prometheus(
                query=metric_config["query"],
                lookback_days=90,
                step="1h",
            )

            df_daily = loader.resample_and_aggregate(df, freq="1D")

            # Generate forecast
            forecaster = ProphetForecaster()
            forecaster.fit(df_daily)
            forecast = forecaster.forecast(periods=metric_config["forecast_days"])

            # Capacity planning
            planner = CapacityPlanner(
                capacity_limit=metric_config["capacity_limit"],
                warning_threshold=0.8,
            )

            report = planner.generate_capacity_report(forecast)

            # Log results
            if report["days_until_warning"]:
                logger.warning(
                    f"{metric_config['name']}: Warning threshold in {report['days_until_warning']} days"
                )

            if report["days_until_exhaustion"]:
                logger.critical(
                    f"{metric_config['name']}: Capacity exhaustion in {report['days_until_exhaustion']} days"
                )

            # Export to Grafana
            export_forecast_to_csv(
                forecast,
                f"grafana/forecasts/{metric_config['name']}_forecast.csv"
            )

        logger.info("Daily forecast generation completed")

    except Exception as e:
        logger.error(f"Forecast generation failed: {e}", exc_info=True)


if __name__ == "__main__":
    # Run immediately
    generate_daily_forecast()

    # Schedule daily at 2 AM
    schedule.every().day.at("02:00").do(generate_daily_forecast)

    logger.info("Forecast scheduler started")

    while True:
        schedule.run_pending()
        time.sleep(60)
```

**Expected:** Forecasts generated daily for all metrics, capacity reports logged, CSV files exported for Grafana, alerts sent for critical capacity warnings.

**On failure:** Verify scheduler process runs continuously (use systemd/supervisor), check Prometheus connectivity, ensure sufficient disk space for forecast exports, implement retry logic for transient failures, set up monitoring for scheduler itself.

## Validation

- [ ] Historical data loaded with 90+ days of continuous metrics
- [ ] Prophet forecast captures daily/weekly seasonality in components plot
- [ ] Forecast confidence intervals contain 85-95% of actual values in validation
- [ ] Capacity exhaustion dates calculated correctly for known scenarios
- [ ] ARIMA model residuals appear as white noise in diagnostic plots
- [ ] Grafana annotations appear at predicted warning/exhaustion dates
- [ ] Automated forecasting runs daily without manual intervention
- [ ] Forecast accuracy (MAPE) < 15% on validation set

## Common Pitfalls

- **Insufficient historical data**: Need 3-12 months for reliable seasonality detection; avoid forecasting with <60 days
- **Ignoring known events**: Holidays, deployments, marketing campaigns skew forecasts; add as external regressors or holidays
- **Overconfidence in long-term forecasts**: Accuracy degrades beyond 30-90 days; use as directional guidance, not exact predictions
- **Static capacity limits**: Infrastructure changes over time; update capacity_limit when adding resources
- **Forecasting anomalies**: Outliers in training data propagate to forecast; clean data or use robust methods
- **Not updating models**: Forecasts stale after system changes; retrain weekly or after significant architecture changes
- **Ignoring confidence intervals**: Point forecasts misleading; always use lower/upper bounds for planning
- **Wrong seasonality period**: Daily for hourly data, weekly for daily data; mismatch causes poor forecasts

## Related Skills

- `detect-anomalies-aiops` - Anomaly detection complements forecasting for proactive monitoring
- `plan-capacity` - Infrastructure capacity planning workflows
- `build-grafana-dashboards` - Visualize forecasts and capacity trends
